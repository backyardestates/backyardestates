import { NextResponse } from "next/server";
import { Role, EngagementStage } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { ensureProposalContext } from "@/lib/db/ensureProposalContext";
import { transitionEngagementStage } from "@/lib/engagement/stage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function canView(
    engagement: { repId: string | null; architectId: string | null },
    userId: string,
    role: Role,
): boolean {
    if (role === Role.ADMIN) return true;
    return engagement.repId === userId || engagement.architectId === userId;
}

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/engagements/[id]
// Full engagement detail: customer + assignment, consultations, formal
// analyses, linked proposals, and the audit-log timeline.
// ─────────────────────────────────────────────────────────────────────────────
export async function GET(
    _req: Request,
    { params }: { params: Promise<{ id: string }> },
) {
    try {
        const { userId, role } = await ensureProposalContext();
        const { id } = await params;

        const engagement = await prisma.engagement.findUnique({
            where: { id },
            include: {
                consultations: { orderBy: { createdAt: "desc" } },
                formalAnalyses: { orderBy: { createdAt: "desc" } },
                proposals: {
                    orderBy: { updatedAt: "desc" },
                    select: {
                        id: true,
                        status: true,
                        customerName: true,
                        addressKey: true,
                        totalPrice: true,
                        shareToken: true,
                        updatedAt: true,
                    },
                },
                events: { orderBy: { createdAt: "desc" }, take: 100 },
            },
        });

        if (!engagement) {
            return NextResponse.json({ error: "Not found" }, { status: 404 });
        }
        if (!canView(engagement, userId, role)) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        return NextResponse.json({ engagement });
    } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        if (msg === "UNAUTHORIZED") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        console.error("[GET /api/engagements/[id]]", err);
        return NextResponse.json({ error: msg }, { status: 500 });
    }
}

interface PatchBody {
    toStage?: string;
    repId?: string | null;
    architectId?: string | null;
    message?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/engagements/[id]
// Move the stage (writes an audit event + syncs a Pipedrive note) and/or
// reassign the rep/architect.
// ─────────────────────────────────────────────────────────────────────────────
export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ id: string }> },
) {
    try {
        const { userId, role } = await ensureProposalContext();
        const { id } = await params;

        const engagement = await prisma.engagement.findUnique({
            where: { id },
            select: { id: true, repId: true, architectId: true, stage: true },
        });
        if (!engagement) {
            return NextResponse.json({ error: "Not found" }, { status: 404 });
        }
        if (!canView(engagement, userId, role)) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        let body: PatchBody;
        try {
            body = (await req.json()) as PatchBody;
        } catch {
            return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
        }

        // Assignment changes (rep/architect) — admins only.
        const assignment: { repId?: string | null; architectId?: string | null } = {};
        if (body.repId !== undefined) assignment.repId = body.repId;
        if (body.architectId !== undefined) assignment.architectId = body.architectId;
        if (Object.keys(assignment).length > 0) {
            if (role !== Role.ADMIN) {
                return NextResponse.json(
                    { error: "Only admins can reassign engagements." },
                    { status: 403 },
                );
            }
            await prisma.engagement.update({ where: { id }, data: assignment });
        }

        // Stage change.
        if (body.toStage) {
            if (!(body.toStage in EngagementStage)) {
                return NextResponse.json(
                    { error: `Unknown stage: ${body.toStage}` },
                    { status: 400 },
                );
            }
            await transitionEngagementStage({
                engagementId: id,
                toStage: body.toStage as EngagementStage,
                actorId: userId,
                message: body.message,
            });
        }

        const updated = await prisma.engagement.findUnique({ where: { id } });
        return NextResponse.json({ engagement: updated });
    } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        if (msg === "UNAUTHORIZED") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        console.error("[PATCH /api/engagements/[id]]", err);
        return NextResponse.json({ error: msg }, { status: 500 });
    }
}
