import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ensureProposalContext } from "@/lib/db/ensureProposalContext";
import { canAccessEngagement } from "@/lib/engagement/access";

// Shared auth for the per-message / per-enrollment drip endpoints. Each throws a
// sentinel ("UNAUTHORIZED" | "NOT_FOUND" | "FORBIDDEN") that dripErrorResponse
// maps to a status, so routes stay thin.

export async function requireDripMessageAccess(messageId: string) {
    const { userId, role } = await ensureProposalContext();
    const message = await prisma.dripMessage.findUnique({
        where: { id: messageId },
        include: {
            enrollment: {
                select: {
                    id: true,
                    status: true,
                    engagementId: true,
                    engagement: {
                        select: {
                            repId: true,
                            architectId: true,
                            customerName: true,
                            customerEmail: true,
                        },
                    },
                },
            },
        },
    });
    if (!message) throw new Error("NOT_FOUND");
    if (!canAccessEngagement(message.enrollment.engagement, userId, role)) {
        throw new Error("FORBIDDEN");
    }
    return { userId, role, message };
}

export async function requireDripEnrollmentAccess(enrollmentId: string) {
    const { userId, role } = await ensureProposalContext();
    const enrollment = await prisma.dripEnrollment.findUnique({
        where: { id: enrollmentId },
        select: {
            id: true,
            status: true,
            engagementId: true,
            engagement: { select: { repId: true, architectId: true } },
        },
    });
    if (!enrollment) throw new Error("NOT_FOUND");
    if (!canAccessEngagement(enrollment.engagement, userId, role)) {
        throw new Error("FORBIDDEN");
    }
    return { userId, role, enrollment };
}

/** Map a sentinel error to a Response, or null (caller returns 500). */
export function dripErrorResponse(err: unknown): NextResponse | null {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg === "UNAUTHORIZED") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (msg === "NOT_FOUND") return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (msg === "FORBIDDEN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    return null;
}
