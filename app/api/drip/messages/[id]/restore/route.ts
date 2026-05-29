import { NextResponse } from "next/server";
import { DripMessageStatus, DripStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireDripMessageAccess, dripErrorResponse } from "@/lib/drip/access";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST /api/drip/messages/[id]/restore
// Re-enable a skipped email. Also re-activates the enrollment if it had wound
// down, so the cron will actually pick the message back up.
export async function POST(
    _req: Request,
    { params }: { params: Promise<{ id: string }> },
) {
    try {
        const { id } = await params;
        const { message } = await requireDripMessageAccess(id);

        if (message.status !== DripMessageStatus.SKIPPED) {
            return NextResponse.json(
                { error: "Only a skipped email can be restored." },
                { status: 409 },
            );
        }

        const [updated] = await prisma.$transaction([
            prisma.dripMessage.update({
                where: { id },
                data: { status: DripMessageStatus.SCHEDULED },
                select: { id: true, status: true, scheduledFor: true },
            }),
            prisma.dripEnrollment.update({
                where: { id: message.enrollmentId },
                data: { status: DripStatus.ACTIVE },
            }),
        ]);
        return NextResponse.json({ message: updated });
    } catch (err) {
        const mapped = dripErrorResponse(err);
        if (mapped) return mapped;
        console.error("[POST /api/drip/messages/[id]/restore]", err);
        return NextResponse.json(
            { error: err instanceof Error ? err.message : String(err) },
            { status: 500 },
        );
    }
}
