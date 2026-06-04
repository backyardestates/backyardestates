import { NextResponse } from "next/server";
import { ProposalStatus, Role, EngagementStage, EngagementEventType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { ensureProposalContext } from "@/lib/db/ensureProposalContext";
import { snapshotToProposalCreate } from "@/lib/db/proposalMapper";
import { materializeProposal } from "@/lib/db/materializeProposal";
import { recordProposalRevision } from "@/lib/db/proposalRevisions";
import { STAGE_ORDER, transitionEngagementStage } from "@/lib/engagement/stage";
import type { ProposalSnapshot } from "@/lib/proposalSnapshot";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// REVIEWED saves materialize line items + link engagements; give them headroom
// beyond the platform default so large multi-unit proposals can't 504.
export const maxDuration = 60;

// In the existing schema, "saved" maps to ProposalStatus.REVIEWED — the admin
// has reviewed the work and locked it in. DRAFT is the autosave state.
function parseStatus(raw: string | null): ProposalStatus {
    const norm = (raw ?? "").toUpperCase();
    if (norm === "SAVED" || norm === "REVIEWED") return ProposalStatus.REVIEWED;
    if (norm === "DRAFT") return ProposalStatus.DRAFT;
    if (norm in ProposalStatus) {
        return ProposalStatus[norm as keyof typeof ProposalStatus];
    }
    return ProposalStatus.REVIEWED;
}

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/admin/proposals?status=SAVED|DRAFT
// Lists the current user's proposals (most recent first) as a lightweight
// metadata index — NO snapshot blobs. Full snapshots load one-at-a-time via
// GET /api/admin/proposals/[addressKey] when a proposal is actually opened.
// (This route previously returned every snapshotJson in the org, a multi-MB
// payload that regularly 504'd in production.)
// ─────────────────────────────────────────────────────────────────────────────
export async function GET(req: Request) {
    try {
        const { userId, role } = await ensureProposalContext();
        const { searchParams } = new URL(req.url);
        const status = parseStatus(searchParams.get("status"));

        // ADMINs see every proposal in the org; ARCHITECTs only their own.
        const rows = await prisma.proposal.findMany({
            where: {
                ...(role === Role.ADMIN ? {} : { createdById: userId }),
                status,
            },
            orderBy: { updatedAt: "desc" },
            take: 300,
            select: {
                addressKey: true,
                customerName: true,
                addressLine1: true,
                city: true,
                state: true,
                zip: true,
                updatedAt: true,
            },
        });

        // Multiple users can hold a DRAFT on the same address — dedupe to the
        // newest per addressKey so the picker shows one row per property.
        const seen = new Set<string>();
        const proposals = rows.flatMap((r) => {
            if (!r.addressKey || seen.has(r.addressKey)) return [];
            seen.add(r.addressKey);
            return [{
                addressKey: r.addressKey,
                address: [r.addressLine1, r.city, [r.state, r.zip].filter(Boolean).join(" ")]
                    .filter(Boolean)
                    .join(", "),
                customerName: r.customerName ?? "",
                savedAt: r.updatedAt.toISOString(),
            }];
        });

        return NextResponse.json({ proposals });
    } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        if (msg === "UNAUTHORIZED") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        console.error("[GET /api/admin/proposals]", err);
        return NextResponse.json({ error: msg }, { status: 500 });
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/admin/proposals?status=SAVED|DRAFT[&draftId=<id>]
// Body: ProposalSnapshot
//
// DRAFT identity: when `draftId` is supplied (the client remembers the id the
// server returned on its first save), the draft is updated BY ID — so editing
// the address renames the one draft instead of forking a new row per address
// prefix. Without draftId (older clients / first save) we fall back to the
// legacy (createdById, addressKey, DRAFT) lookup.
// ─────────────────────────────────────────────────────────────────────────────
export async function POST(req: Request) {
    try {
        const { userId, organizationId, role } = await ensureProposalContext();
        const { searchParams } = new URL(req.url);
        const status = parseStatus(searchParams.get("status"));
        const draftId = searchParams.get("draftId");
        // Optimistic-concurrency inputs for REVIEWED saves: baseSavedAt is the
        // canonical's updatedAt the editor loaded; force=1 overwrites anyway.
        const baseSavedAt = searchParams.get("baseSavedAt");
        const force = searchParams.get("force") === "1";

        const snapshot = (await req.json()) as ProposalSnapshot;
        if (!snapshot?.addressKey) {
            return NextResponse.json(
                { error: "Missing addressKey in snapshot" },
                { status: 400 }
            );
        }

        const payload = snapshotToProposalCreate(snapshot, {
            userId,
            organizationId,
            status,
        });

        // Two distinct upsert shapes:
        //
        //   DRAFT  — per-user. Each user can have their own draft on the same
        //            addressKey. Look up by (createdById, addressKey, DRAFT).
        //
        //   REVIEWED — ONE canonical per addressKey across the whole org.
        //              When a user clicks Save, their draft is "promoted":
        //              the canonical for this address is updated in place
        //              (replacing whoever owned it before), the saver becomes
        //              the new createdById, and their own DRAFT row is
        //              deleted. Other users' DRAFTs on this address are left
        //              alone — they can still resume / admin can still review.
        let saved;
        if (status === ProposalStatus.DRAFT) {
            // Prefer the id the client pinned (survives address edits — kills
            // the "10 drafts per proposal" fork bug); fall back to the legacy
            // addressKey lookup for clients that don't send one yet.
            let existing: { id: string } | null = null;
            if (draftId) {
                existing = await prisma.proposal.findFirst({
                    where: { id: draftId, createdById: userId, status: ProposalStatus.DRAFT },
                    select: { id: true },
                });
            }
            if (!existing) {
                existing = await prisma.proposal.findFirst({
                    where: {
                        createdById: userId,
                        addressKey: snapshot.addressKey,
                        status: ProposalStatus.DRAFT,
                    },
                    select: { id: true },
                });
            }
            saved = existing
                ? await prisma.proposal.update({
                    where: { id: existing.id },
                    data: {
                        customerName: payload.customerName,
                        customerEmail: payload.customerEmail,
                        addressLine1: payload.addressLine1,
                        city: payload.city,
                        state: payload.state,
                        zip: payload.zip,
                        // The draft is keyed by id now, so the address columns
                        // (incl. addressKey) follow the user's edits in place.
                        addressKey: payload.addressKey,
                        // Keep the Pipedrive linkage fresh on re-save so the
                        // agreement-pdf "Save to deal" note targets the right
                        // record (these were previously only set on create).
                        pipedrivePersonId: payload.pipedrivePersonId,
                        pipedriveDealId: payload.pipedriveDealId,
                        snapshotJson: payload.snapshotJson,
                        snapshotVersion: payload.snapshotVersion,
                    },
                })
                : await prisma.proposal.create({ data: payload });

            // Coarse history checkpoint (at most one per 10 min) — gives the
            // draft its "internal history" without a row per keystroke.
            await recordProposalRevision({
                proposalId: saved.id,
                createdById: userId,
                kind: "AUTOSAVE",
                snapshotJson: payload.snapshotJson,
                throttle: true,
            });
        } else {
            // REVIEWED save = promotion. Architects can promote (their middleware
            // role check has already passed); admins can promote anyone's draft.
            const existingCanonical = await prisma.proposal.findFirst({
                where: { addressKey: snapshot.addressKey, status: ProposalStatus.REVIEWED },
                select: {
                    id: true,
                    createdById: true,
                    snapshotJson: true,
                    updatedAt: true,
                    createdBy: { select: { email: true } },
                },
            });

            // Conflict guard: someone saved a newer canonical after this editor
            // loaded. 409 lets the client ask "overwrite or load latest?"
            // instead of silently clobbering a colleague's work. Only enforced
            // when the client supplies baseSavedAt (older clients behave as
            // before) and skipped on force=1. 2s slack absorbs clock/serialize
            // jitter.
            if (existingCanonical && baseSavedAt && !force) {
                const base = new Date(baseSavedAt).getTime();
                if (
                    Number.isFinite(base) &&
                    existingCanonical.updatedAt.getTime() > base + 2_000
                ) {
                    return NextResponse.json(
                        {
                            conflict: {
                                savedBy: existingCanonical.createdBy?.email ?? null,
                                savedAt: existingCanonical.updatedAt.toISOString(),
                            },
                        },
                        { status: 409 },
                    );
                }
            }

            // Preserve the version we're about to overwrite — "last save wins"
            // is only acceptable because the displaced canonical stays
            // recoverable from the History modal.
            if (existingCanonical?.snapshotJson) {
                await recordProposalRevision({
                    proposalId: existingCanonical.id,
                    createdById: existingCanonical.createdById,
                    kind: "PROMOTE",
                    snapshotJson: existingCanonical.snapshotJson,
                });
            }
            saved = existingCanonical
                ? await prisma.proposal.update({
                    where: { id: existingCanonical.id },
                    data: {
                        customerName: payload.customerName,
                        customerEmail: payload.customerEmail,
                        addressLine1: payload.addressLine1,
                        city: payload.city,
                        state: payload.state,
                        zip: payload.zip,
                        // Keep the Pipedrive linkage fresh on re-save so the
                        // agreement-pdf "Save to deal" note targets the right
                        // record (these were previously only set on create).
                        pipedrivePersonId: payload.pipedrivePersonId,
                        pipedriveDealId: payload.pipedriveDealId,
                        snapshotJson: payload.snapshotJson,
                        snapshotVersion: payload.snapshotVersion,
                        // Promoter becomes the new canonical owner. This makes
                        // "last save wins" the visible ownership rule.
                        createdById: userId,
                    },
                })
                : await prisma.proposal.create({ data: payload });

            // Delete only the promoter's own DRAFT — other users' drafts on
            // this address survive so they can resume their own work.
            await prisma.proposal.deleteMany({
                where: {
                    createdById: userId,
                    addressKey: snapshot.addressKey,
                    status: ProposalStatus.DRAFT,
                },
            });

            // Checkpoint the promoted version itself (explicit Save).
            await recordProposalRevision({
                proposalId: saved.id,
                createdById: userId,
                kind: "SAVE",
                snapshotJson: payload.snapshotJson,
            });
        }
        // Reference the role variable to keep TS happy even though we no
        // longer branch on it here; the role gate is enforced by middleware.
        void role;

        // Materialize the structured tables for downstream reporting/exports.
        // Drafts skip this — DRAFT autosaves fire on every keystroke and the
        // wipe+rebuild cost is wasted until the admin commits.
        let materialized: { lineItems: number; discounts: number } | null = null;
        if (status !== ProposalStatus.DRAFT) {
            try {
                materialized = await materializeProposal(saved.id, snapshot);
            } catch (matErr) {
                // Materialization failures shouldn't block the JSON save —
                // the snapshot is the source of truth. Log and surface in
                // the response for visibility.
                console.error("[POST /api/admin/proposals] materialize failed", matErr);
            }
        }

        // Phase 4: link this proposal to a matching engagement (by address) and
        // nudge the engagement to PROPOSAL_DRAFT. Best-effort + fail-safe — never
        // affects the save the rep just confirmed.
        if (status !== ProposalStatus.DRAFT && saved.addressKey) {
            try {
                const eng = await prisma.engagement.findFirst({
                    where: {
                        organizationId,
                        addressKey: saved.addressKey,
                        stage: { notIn: [EngagementStage.SIGNED, EngagementStage.LOST] },
                    },
                    orderBy: { updatedAt: "desc" },
                    select: { id: true, stage: true },
                });
                if (eng) {
                    if (saved.engagementId !== eng.id) {
                        await prisma.proposal.update({
                            where: { id: saved.id },
                            data: { engagementId: eng.id },
                        });
                    }
                    const from = STAGE_ORDER.indexOf(eng.stage);
                    const target = STAGE_ORDER.indexOf(EngagementStage.PROPOSAL_DRAFT);
                    if (from !== -1 && from < target) {
                        await transitionEngagementStage({
                            engagementId: eng.id,
                            toStage: EngagementStage.PROPOSAL_DRAFT,
                            actorId: userId,
                            eventType: EngagementEventType.PROPOSAL_LINKED,
                            message: "Proposal drafted.",
                        });
                    }
                }
            } catch (linkErr) {
                console.error("[POST /api/admin/proposals] engagement link failed", linkErr);
            }
        }

        return NextResponse.json({
            id: saved.id,
            addressKey: saved.addressKey,
            // New canonical timestamp — the client uses it as the next
            // baseSavedAt so back-to-back saves don't self-conflict.
            savedAt: saved.updatedAt.toISOString(),
            ...(materialized ? { materialized } : {}),
        });
    } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        if (msg === "UNAUTHORIZED") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        console.error("[POST /api/admin/proposals]", err);
        return NextResponse.json({ error: msg }, { status: 500 });
    }
}
