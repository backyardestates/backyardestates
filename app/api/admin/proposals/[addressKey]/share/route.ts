import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { ProposalStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { ensureProposalContext } from "@/lib/db/ensureProposalContext";
import { requireApiPermission } from "@/lib/rbac/getPermissions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/admin/proposals/[addressKey]/share   body: { shared: boolean }
//
// Grants or revokes a customer's access to the read-only present-v2 deck for
// the canonical (REVIEWED) proposal at this address. Granting sets
// sharedWithCustomerAt + ensures a shareToken; revoking clears the timestamp.
// The customer dashboard then matches on customerEmail + this flag. No internal
// costs are exposed — the customer only ever sees the presenter payload.
// ─────────────────────────────────────────────────────────────────────────────
export async function POST(
    req: Request,
    { params }: { params: Promise<{ addressKey: string }> },
) {
    const denied = await requireApiPermission("proposals.edit");
    if (denied) return denied;

    try {
        const { userId } = await ensureProposalContext();
        const { addressKey: rawAddressKey } = await params;
        const addressKey = decodeURIComponent(rawAddressKey);

        const body = (await req.json().catch(() => ({}))) as { shared?: boolean };
        const shared = body.shared !== false; // default to granting

        const proposal = await prisma.proposal.findFirst({
            where: { addressKey, status: ProposalStatus.REVIEWED },
            select: { id: true, customerEmail: true, shareToken: true, presenterBroadcast: true },
        });

        if (!proposal) {
            return NextResponse.json(
                { error: "No reviewed proposal to share. Save the proposal first." },
                { status: 409 },
            );
        }
        if (shared && !proposal.customerEmail) {
            return NextResponse.json(
                { error: "Add a customer email to the proposal before sharing it." },
                { status: 400 },
            );
        }

        const updated = await prisma.proposal.update({
            where: { id: proposal.id },
            data: {
                sharedWithCustomerAt: shared ? new Date() : null,
                sharedWithCustomerById: shared ? userId : null,
                // Ensure a stable public token to build the share link from.
                shareToken: shared && !proposal.shareToken ? randomUUID() : undefined,
            },
            select: { shareToken: true },
        });

        return NextResponse.json({ ok: true, shared, shareToken: updated.shareToken });
    } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        if (msg === "UNAUTHORIZED") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        console.error("[POST /api/admin/proposals/:addressKey/share]", err);
        return NextResponse.json({ error: msg }, { status: 500 });
    }
}
