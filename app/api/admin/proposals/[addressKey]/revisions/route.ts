import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ensureProposalContext } from "@/lib/db/ensureProposalContext";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/admin/proposals/[addressKey]/revisions
// Lightweight history index for every proposal row (draft + canonical) on this
// address — no snapshot blobs. Fetch a revision's full snapshot via
// /api/admin/proposals/revision/[id] when the user actually restores.
// ─────────────────────────────────────────────────────────────────────────────
export async function GET(
    req: Request,
    { params }: { params: Promise<{ addressKey: string }> },
) {
    try {
        await ensureProposalContext();
        const { addressKey: rawAddressKey } = await params;
        const addressKey = decodeURIComponent(rawAddressKey);

        const revisions = await prisma.proposalRevision.findMany({
            where: { proposal: { addressKey } },
            orderBy: { createdAt: "desc" },
            take: 40,
            select: {
                id: true,
                kind: true,
                createdAt: true,
                createdById: true,
                proposal: {
                    select: {
                        status: true,
                        createdBy: { select: { email: true } },
                    },
                },
            },
        });

        // Resolve author emails in one pass (createdById may differ from the
        // proposal owner — e.g. a PROMOTE revision preserves the displaced
        // author's work).
        const authorIds = [...new Set(revisions.map((r) => r.createdById))];
        const authors = authorIds.length
            ? await prisma.user.findMany({
                where: { id: { in: authorIds } },
                select: { id: true, email: true },
            })
            : [];
        const emailById = new Map(authors.map((a) => [a.id, a.email]));

        return NextResponse.json({
            revisions: revisions.map((r) => ({
                id: r.id,
                kind: r.kind,
                createdAt: r.createdAt.toISOString(),
                authorEmail: emailById.get(r.createdById) ?? null,
                proposalStatus: r.proposal.status,
            })),
        });
    } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        if (msg === "UNAUTHORIZED") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        console.error("[GET /api/admin/proposals/:addressKey/revisions]", err);
        return NextResponse.json({ error: msg }, { status: 500 });
    }
}
