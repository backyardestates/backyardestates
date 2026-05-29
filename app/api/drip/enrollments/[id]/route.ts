import { NextResponse } from "next/server";
import { DripStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireDripEnrollmentAccess, dripErrorResponse } from "@/lib/drip/access";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface PatchBody {
    status?: "ACTIVE" | "PAUSED";
}

// PATCH /api/drip/enrollments/[id]
// Pause or resume the whole sequence. Paused enrollments are skipped by the
// cron without cancelling them (cancel is a separate, terminal action).
export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ id: string }> },
) {
    try {
        const { id } = await params;
        const { enrollment } = await requireDripEnrollmentAccess(id);

        let body: PatchBody;
        try {
            body = (await req.json()) as PatchBody;
        } catch {
            return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
        }
        if (body.status !== "ACTIVE" && body.status !== "PAUSED") {
            return NextResponse.json(
                { error: "status must be ACTIVE or PAUSED." },
                { status: 400 },
            );
        }

        if (enrollment.status === DripStatus.CANCELLED) {
            return NextResponse.json(
                { error: "This drip was cancelled and can't be resumed." },
                { status: 409 },
            );
        }

        const updated = await prisma.dripEnrollment.update({
            where: { id },
            data: { status: body.status === "ACTIVE" ? DripStatus.ACTIVE : DripStatus.PAUSED },
            select: { id: true, status: true },
        });
        return NextResponse.json({ enrollment: updated });
    } catch (err) {
        const mapped = dripErrorResponse(err);
        if (mapped) return mapped;
        console.error("[PATCH /api/drip/enrollments/[id]]", err);
        return NextResponse.json(
            { error: err instanceof Error ? err.message : String(err) },
            { status: 500 },
        );
    }
}
