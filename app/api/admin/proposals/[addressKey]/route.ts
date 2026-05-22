import { NextResponse } from "next/server";
import { ProposalStatus, Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { ensureProposalContext } from "@/lib/db/ensureProposalContext";
import { proposalToSnapshot } from "@/lib/db/proposalMapper";
import type { ProposalSnapshot } from "@/lib/proposalSnapshot";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function parseStatus(raw: string | null): ProposalStatus | null {
    if (!raw) return null;
    const norm = raw.toUpperCase();
    if (norm === "SAVED" || norm === "REVIEWED") return ProposalStatus.REVIEWED;
    if (norm === "DRAFT") return ProposalStatus.DRAFT;
    if (norm in ProposalStatus) {
        return ProposalStatus[norm as keyof typeof ProposalStatus];
    }
    return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/admin/proposals/[addressKey]
//
//   No query params:           Returns the bundle for this address:
//     { reviewed, myDraft, otherDrafts }
//     - reviewed:    the canonical REVIEWED snapshot (with owner) or null.
//     - myDraft:     the caller's DRAFT snapshot for this address or null.
//     - otherDrafts: metadata-only list of OTHER users' drafts on this
//                    address. Empty for architects (privacy), populated
//                    for admins.
//
//   ?status=REVIEWED:          Legacy — returns { proposal: <reviewed> | null }
//   ?status=DRAFT:             Returns the caller's own draft.
//   ?status=DRAFT&forUser=ID:  Admin-only. Returns ID's draft for this address.
// ─────────────────────────────────────────────────────────────────────────────
export async function GET(
    req: Request,
    { params }: { params: Promise<{ addressKey: string }> },
) {
    try {
        const { userId, role } = await ensureProposalContext();
        const { addressKey: rawAddressKey } = await params;
        const addressKey = decodeURIComponent(rawAddressKey);
        const url = new URL(req.url);
        const status = parseStatus(url.searchParams.get("status"));
        const forUser = url.searchParams.get("forUser");

        // ── Targeted reads ────────────────────────────────────────────────
        if (status === ProposalStatus.REVIEWED) {
            // Canonical is org-wide.
            const row = await prisma.proposal.findFirst({
                where: { addressKey, status: ProposalStatus.REVIEWED },
            });
            return NextResponse.json({ proposal: row ? proposalToSnapshot(row) : null });
        }
        if (status === ProposalStatus.DRAFT) {
            // forUser= is admin-only; otherwise default to the caller's own draft.
            const targetUserId = forUser ?? userId;
            if (forUser && forUser !== userId && role !== Role.ADMIN) {
                return NextResponse.json({ error: "Forbidden" }, { status: 403 });
            }
            const row = await prisma.proposal.findFirst({
                where: { addressKey, status: ProposalStatus.DRAFT, createdById: targetUserId },
            });
            return NextResponse.json({ proposal: row ? proposalToSnapshot(row) : null });
        }

        // ── Bundle read (no status param) ─────────────────────────────────
        const [reviewed, myDraft, otherDrafts] = await Promise.all([
            prisma.proposal.findFirst({
                where: { addressKey, status: ProposalStatus.REVIEWED },
                include: { createdBy: { select: { id: true, email: true } } },
            }),
            prisma.proposal.findFirst({
                where: { addressKey, status: ProposalStatus.DRAFT, createdById: userId },
            }),
            // Other users' drafts — admin only. Architects get an empty array
            // so they don't even see that other people have drafts on this
            // address (privacy boundary on intermediate work).
            role === Role.ADMIN
                ? prisma.proposal.findMany({
                    where: {
                        addressKey,
                        status: ProposalStatus.DRAFT,
                        NOT: { createdById: userId },
                    },
                    select: {
                        id: true,
                        updatedAt: true,
                        createdById: true,
                        createdBy: { select: { email: true } },
                    },
                    orderBy: { updatedAt: "desc" },
                })
                : Promise.resolve([] as Array<{
                    id: string;
                    updatedAt: Date;
                    createdById: string;
                    createdBy: { email: string | null } | null;
                }>),
        ]);

        return NextResponse.json({
            reviewed: reviewed
                ? {
                    snapshot: proposalToSnapshot(reviewed) as ProposalSnapshot | null,
                    ownedBy: {
                        id: reviewed.createdBy?.id ?? reviewed.createdById,
                        email: reviewed.createdBy?.email ?? null,
                    },
                    savedAt: reviewed.updatedAt.toISOString(),
                }
                : null,
            myDraft: myDraft
                ? {
                    snapshot: proposalToSnapshot(myDraft) as ProposalSnapshot | null,
                    savedAt: myDraft.updatedAt.toISOString(),
                }
                : null,
            otherDrafts: otherDrafts.map((d) => ({
                userId: d.createdById,
                email: d.createdBy?.email ?? null,
                savedAt: d.updatedAt.toISOString(),
            })),
        });
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
// DELETE /api/admin/proposals/[addressKey]?status=DRAFT|REVIEWED
//   DRAFT:    deletes the caller's own draft for this address.
//   REVIEWED: admin-only; deletes the canonical for this address.
// ─────────────────────────────────────────────────────────────────────────────
export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ addressKey: string }> },
) {
    try {
        const { userId, role } = await ensureProposalContext();
        const { addressKey: rawAddressKey } = await params;
        const addressKey = decodeURIComponent(rawAddressKey);
        const status = parseStatus(new URL(req.url).searchParams.get("status"))
            ?? ProposalStatus.REVIEWED;

        if (status === ProposalStatus.REVIEWED && role !== Role.ADMIN) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const result = await prisma.proposal.deleteMany({
            where: {
                ...(status === ProposalStatus.REVIEWED
                    ? {} // canonical: admin can delete regardless of creator
                    : { createdById: userId }), // draft: only own draft
                addressKey,
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
