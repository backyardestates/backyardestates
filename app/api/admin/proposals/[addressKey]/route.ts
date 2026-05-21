import { NextResponse } from "next/server";
import { ProposalStatus, Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { ensureProposalContext } from "@/lib/db/ensureProposalContext";
import { proposalToSnapshot } from "@/lib/db/proposalMapper";

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
// GET /api/admin/proposals/[addressKey]?status=SAVED|DRAFT
// ─────────────────────────────────────────────────────────────────────────────
export async function GET(
    req: Request,
    { params }: { params: Promise<{ addressKey: string }> }
) {
    try {
        const { userId, role } = await ensureProposalContext();
        const { addressKey } = await params;
        const status = parseStatus(new URL(req.url).searchParams.get("status"));

        // ADMINs can read anyone's proposal; ARCHITECTs are scoped to their own.
        const row = await prisma.proposal.findFirst({
            where: {
                ...(role === Role.ADMIN ? {} : { createdById: userId }),
                addressKey: decodeURIComponent(addressKey),
                status,
            },
        });

        if (!row) {
            return NextResponse.json({ proposal: null }, { status: 404 });
        }

        return NextResponse.json({ proposal: proposalToSnapshot(row) });
    } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        if (msg === "UNAUTHORIZED") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        console.error("[GET /api/admin/proposals/:addressKey]", err);
        return NextResponse.json({ error: msg }, { status: 500 });
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /api/admin/proposals/[addressKey]?status=SAVED|DRAFT
// ─────────────────────────────────────────────────────────────────────────────
export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ addressKey: string }> }
) {
    try {
        const { userId, role } = await ensureProposalContext();
        const { addressKey } = await params;
        const status = parseStatus(new URL(req.url).searchParams.get("status"));

        // ADMINs can delete any matching proposal; ARCHITECTs only their own.
        const result = await prisma.proposal.deleteMany({
            where: {
                ...(role === Role.ADMIN ? {} : { createdById: userId }),
                addressKey: decodeURIComponent(addressKey),
                status,
            },
        });

        return NextResponse.json({ deleted: result.count });
    } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        if (msg === "UNAUTHORIZED") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        console.error("[DELETE /api/admin/proposals/:addressKey]", err);
        return NextResponse.json({ error: msg }, { status: 500 });
    }
}
