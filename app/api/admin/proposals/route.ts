import { NextResponse } from "next/server";
import { ProposalStatus, Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { ensureProposalContext } from "@/lib/db/ensureProposalContext";
import { proposalToSnapshot, snapshotToProposalCreate } from "@/lib/db/proposalMapper";
import { materializeProposal } from "@/lib/db/materializeProposal";
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

        // Look up an existing proposal at this (addressKey, status). For
        // ARCHITECTs we additionally scope by createdById so they can never
        // overwrite someone else's row. ADMINs match against any row for
        // this addressKey so they can edit anyone's proposal — but we
        // preserve the original creator when updating (no ownership transfer
        // just because an admin saved it).
        const existing = await prisma.proposal.findFirst({
            where: {
                ...(role === Role.ADMIN ? {} : { createdById: userId }),
                addressKey: snapshot.addressKey,
                status,
            },
            select: { id: true, createdById: true },
        });

        const saved = existing
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
                    // Intentionally NOT updating createdById — preserves the
                    // original owner even when an admin edits.
                },
            })
            : await prisma.proposal.create({ data: payload });

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
