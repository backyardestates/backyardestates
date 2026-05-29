import { NextResponse } from "next/server";
import { DripMessageStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireDripMessageAccess, dripErrorResponse } from "@/lib/drip/access";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST /api/drip/messages/[id]/skip
// Stop just this one email (the rest of the sequence keeps going).
export async function POST(
    _req: Request,
    { params }: { params: Promise<{ id: string }> },
) {
    try {
        const { id } = await params;
        const { message } = await requireDripMessageAccess(id);

        if (message.status !== DripMessageStatus.SCHEDULED) {
            return NextResponse.json(
                { error: "Only a scheduled email can be skipped." },
                { status: 409 },
            );
        }

        const updated = await prisma.dripMessage.update({
            where: { id },
            data: { status: DripMessageStatus.SKIPPED },
            select: { id: true, status: true },
        });
        return NextResponse.json({ message: updated });
    } catch (err) {
        const mapped = dripErrorResponse(err);
        if (mapped) return mapped;
        console.error("[POST /api/drip/messages/[id]/skip]", err);
        return NextResponse.json(
            { error: err instanceof Error ? err.message : String(err) },
            { status: 500 },
        );
    }
}
