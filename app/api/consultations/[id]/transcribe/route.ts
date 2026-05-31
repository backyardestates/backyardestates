import { NextResponse } from "next/server";
import { ConsultationStatus, EngagementEventType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { ensureProposalContext } from "@/lib/db/ensureProposalContext";
import { canAccessEngagement } from "@/lib/engagement/access";
import { logEngagementEvent } from "@/lib/engagement/stage";
import { transcribeAudio } from "@/lib/ai/transcription";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// Audio transcription can run long; raise the serverless budget so the function
// isn't killed mid-request (which returns a non-JSON page the client can't parse).
export const maxDuration = 300;

// POST /api/consultations/[id]/transcribe
// Body: multipart/form-data with an `audio` file. Transcribes via the
// configured provider and stores the transcript on the consultation.
export async function POST(
    req: Request,
    { params }: { params: Promise<{ id: string }> },
) {
    try {
        const { userId, role } = await ensureProposalContext();
        const { id } = await params;

        const consultation = await prisma.consultation.findUnique({
            where: { id },
            include: { engagement: { select: { repId: true, architectId: true } } },
        });
        if (!consultation) {
            return NextResponse.json({ error: "Not found" }, { status: 404 });
        }
        if (!canAccessEngagement(consultation.engagement, userId, role)) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const form = await req.formData();
        const file = form.get("audio");
        if (!(file instanceof File)) {
            return NextResponse.json({ error: "Missing audio file" }, { status: 400 });
        }

        await prisma.consultation.update({
            where: { id },
            data: { status: ConsultationStatus.TRANSCRIBING },
        });

        let transcript: string;
        try {
            const buf = await file.arrayBuffer();
            transcript = await transcribeAudio(buf, file.type || "audio/webm");
        } catch (err) {
            await prisma.consultation.update({
                where: { id },
                data: { status: ConsultationStatus.FAILED },
            });
            const msg = err instanceof Error ? err.message : String(err);
            return NextResponse.json({ error: msg }, { status: 502 });
        }

        const updated = await prisma.consultation.update({
            where: { id },
            data: { transcript, status: ConsultationStatus.TRANSCRIBED },
        });

        await logEngagementEvent({
            engagementId: consultation.engagementId,
            type: EngagementEventType.CONSULTATION_TRANSCRIBED,
            actorId: userId,
            message: "Consultation transcribed",
        });

        return NextResponse.json({ consultation: updated });
    } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        if (msg === "UNAUTHORIZED") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        console.error("[POST /api/consultations/[id]/transcribe]", err);
        return NextResponse.json({ error: msg }, { status: 500 });
    }
}
