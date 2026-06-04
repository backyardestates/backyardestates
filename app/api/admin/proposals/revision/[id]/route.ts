import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ensureProposalContext } from "@/lib/db/ensureProposalContext";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/admin/proposals/revision/[id]
// Full snapshot of one history checkpoint (used by the Restore action).
// ─────────────────────────────────────────────────────────────────────────────
export async function GET(
    _req: Request,
    { params }: { params: Promise<{ id: string }> },
) {
    try {
        await ensureProposalContext();
        const { id } = await params;

        const revision = await prisma.proposalRevision.findUnique({
            where: { id },
            select: { id: true, kind: true, createdAt: true, snapshotJson: true },
        });
        if (!revision) {
            return NextResponse.json({ error: "Revision not found" }, { status: 404 });
        }

        return NextResponse.json({
            id: revision.id,
            kind: revision.kind,
            createdAt: revision.createdAt.toISOString(),
            snapshot: revision.snapshotJson,
        });
    } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        if (msg === "UNAUTHORIZED") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        console.error("[GET /api/admin/proposals/revision/:id]", err);
        return NextResponse.json({ error: msg }, { status: 500 });
    }
}
