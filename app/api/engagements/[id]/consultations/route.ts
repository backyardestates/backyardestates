import { NextResponse } from "next/server";
import { ConsultationSource, ConsultationStatus, EngagementEventType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { ensureProposalContext } from "@/lib/db/ensureProposalContext";
import { canAccessEngagement } from "@/lib/engagement/access";
import { logEngagementEvent } from "@/lib/engagement/stage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface CreateBody {
    source?: "RECORDED" | "UPLOADED" | "PASTED";
    transcript?: string;
    consentGiven?: boolean;
}

// POST /api/engagements/[id]/consultations
// Create a consultation for an engagement. A pasted/uploaded transcript can be
// supplied inline; recorded audio is sent to the transcribe endpoint after.
export async function POST(
    req: Request,
    { params }: { params: Promise<{ id: string }> },
) {
    try {
        const { userId, role } = await ensureProposalContext();
        const { id: engagementId } = await params;

        const engagement = await prisma.engagement.findUnique({
            where: { id: engagementId },
            select: { id: true, repId: true, architectId: true },
        });
        if (!engagement) {
            return NextResponse.json({ error: "Engagement not found" }, { status: 404 });
        }
        if (!canAccessEngagement(engagement, userId, role)) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        let body: CreateBody;
        try {
            body = (await req.json()) as CreateBody;
        } catch {
            return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
        }

        const source = (body.source ?? "RECORDED") as ConsultationSource;
        const transcript = body.transcript?.trim() || null;

        const consultation = await prisma.consultation.create({
            data: {
                engagementId,
                source,
                status: transcript ? ConsultationStatus.TRANSCRIBED : ConsultationStatus.DRAFT,
                consentGiven: !!body.consentGiven,
                consentAt: body.consentGiven ? new Date() : null,
                transcript,
                createdById: userId,
            },
        });

        await logEngagementEvent({
            engagementId,
            type: EngagementEventType.CONSULTATION_RECORDED,
            actorId: userId,
            message: `Consultation started (${source.toLowerCase()})`,
        });

        return NextResponse.json({ consultation });
    } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        if (msg === "UNAUTHORIZED") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        console.error("[POST /api/engagements/[id]/consultations]", err);
        return NextResponse.json({ error: msg }, { status: 500 });
    }
}
