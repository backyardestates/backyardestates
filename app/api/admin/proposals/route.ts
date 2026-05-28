import { NextResponse } from "next/server";
import { ProposalStatus, Role, EngagementStage, EngagementEventType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { ensureProposalContext } from "@/lib/db/ensureProposalContext";
import { proposalToSnapshot, snapshotToProposalCreate } from "@/lib/db/proposalMapper";
import { materializeProposal } from "@/lib/db/materializeProposal";
import { STAGE_ORDER, transitionEngagementStage } from "@/lib/engagement/stage";
import type { ProposalSnapshot } from "@/lib/proposalSnapshot";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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
// Lists the current user's proposals (most recent first).
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
        });

        const snapshots = rows
            .map((row) => proposalToSnapshot(row))
            .filter((s): s is ProposalSnapshot => s !== null);

        return NextResponse.json({ proposals: snapshots });
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
// POST /api/admin/proposals?status=SAVED|DRAFT
// Upsert by (createdById, addressKey, status).
// Body: ProposalSnapshot
// ─────────────────────────────────────────────────────────────────────────────
export async function POST(req: Request) {
    try {
        const { userId, organizationId, role } = await ensureProposalContext();
        const { searchParams } = new URL(req.url);
        const status = parseStatus(searchParams.get("status"));

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
            const existing = await prisma.proposal.findFirst({
                where: {
                    createdById: userId,
                    addressKey: snapshot.addressKey,
                    status: ProposalStatus.DRAFT,
                },
                select: { id: true },
            });
            saved = existing
                ? await prisma.proposal.update({
                    where: { id: existing.id },
                    data: {
                        customerName: payload.customerName,
                        addressLine1: payload.addressLine1,
                        city: payload.city,
                        state: payload.state,
                        zip: payload.zip,
                        snapshotJson: payload.snapshotJson,
                        snapshotVersion: payload.snapshotVersion,
                    },
                })
                : await prisma.proposal.create({ data: payload });
        } else {
            // REVIEWED save = promotion. Architects can promote (their middleware
            // role check has already passed); admins can promote anyone's draft.
            const existingCanonical = await prisma.proposal.findFirst({
                where: { addressKey: snapshot.addressKey, status: ProposalStatus.REVIEWED },
                select: { id: true, createdById: true },
            });
            saved = existingCanonical
                ? await prisma.proposal.update({
                    where: { id: existingCanonical.id },
                    data: {
                        customerName: payload.customerName,
                        addressLine1: payload.addressLine1,
                        city: payload.city,
                        state: payload.state,
                        zip: payload.zip,
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
