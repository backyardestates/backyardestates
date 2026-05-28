import { NextResponse } from "next/server";
import { DripStatus, DripMessageStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { ensureProposalContext } from "@/lib/db/ensureProposalContext";
import { canAccessEngagement } from "@/lib/engagement/access";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST /api/engagements/[id]/drip/cancel
// Stops the drip: cancels active enrollments and skips their pending messages.
export async function POST(
    _req: Request,
    { params }: { params: Promise<{ id: string }> },
) {
    try {
        const { userId, role } = await ensureProposalContext();
        const { id } = await params;

        const engagement = await prisma.engagement.findUnique({
            where: { id },
            select: { id: true, repId: true, architectId: true },
        });
        if (!engagement) {
            return NextResponse.json({ error: "Not found" }, { status: 404 });
        }
        if (!canAccessEngagement(engagement, userId, role)) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const enrollments = await prisma.dripEnrollment.findMany({
            where: { engagementId: id, status: DripStatus.ACTIVE },
            select: { id: true },
        });
        const ids = enrollments.map((e) => e.id);

        if (ids.length > 0) {
            await prisma.$transaction([
                prisma.dripMessage.updateMany({
                    where: { enrollmentId: { in: ids }, status: DripMessageStatus.SCHEDULED },
                    data: { status: DripMessageStatus.SKIPPED },
                }),
                prisma.dripEnrollment.updateMany({
                    where: { id: { in: ids } },
                    data: { status: DripStatus.CANCELLED },
                }),
            ]);
        }

        return NextResponse.json({ ok: true, cancelled: ids.length });
    } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        if (msg === "UNAUTHORIZED") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        console.error("[POST /api/engagements/[id]/drip/cancel]", err);
        return NextResponse.json({ error: msg }, { status: 500 });
    }
}
