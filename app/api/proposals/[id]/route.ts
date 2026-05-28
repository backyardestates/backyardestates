import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ensureProposalContext } from "@/lib/db/ensureProposalContext";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/proposals/[id]
//
// Powers the standalone by-id report routes (Phase 0b). The [id] segment is
// either the canonical Proposal cuid (requires an authed session) or a
// non-guessable shareToken (public — for customer-facing /present links, since
// /present is a public route).
//
// Returns the presenter-ready payloads persisted on the last REVIEWED save:
//   - presenterBroadcast → seeds the presenter deck
//   - agreementInput      → seeds the agreement preview (authed only)
// Both are null for proposals saved before this was wired; callers fall back
// to opening the proposal in the admin tool (live broadcast).
// ─────────────────────────────────────────────────────────────────────────────
export async function GET(
    _req: Request,
    { params }: { params: Promise<{ id: string }> },
) {
    try {
        const { id } = await params;

        const proposal = await prisma.proposal.findFirst({
            where: { OR: [{ id }, { shareToken: id }] },
            select: {
                id: true,
                shareToken: true,
                customerName: true,
                addressKey: true,
                presenterBroadcast: true,
                agreementInput: true,
            },
        });

        if (!proposal) {
            return NextResponse.json({ error: "Not found" }, { status: 404 });
        }

        // Token match = public access (present share link). Otherwise require auth.
        const matchedByToken = !!proposal.shareToken && proposal.shareToken === id;
        let authed = false;
        if (!matchedByToken) {
            try {
                await ensureProposalContext();
                authed = true;
            } catch {
                return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
            }
        }

        return NextResponse.json({
            id: proposal.id,
            customerName: proposal.customerName,
            addressKey: proposal.addressKey,
            presenterBroadcast: proposal.presenterBroadcast,
            // agreementInput is internal — only return it to authed callers.
            agreementInput: authed ? proposal.agreementInput : null,
        });
    } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error("[GET /api/proposals/[id]]", err);
        return NextResponse.json({ error: msg }, { status: 500 });
    }
}
