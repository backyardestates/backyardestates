import { NextResponse } from "next/server";
import { ConsultationStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { ensureProposalContext } from "@/lib/db/ensureProposalContext";
import { canAccessEngagement } from "@/lib/engagement/access";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface PatchBody {
    transcript?: string;
}

// PATCH /api/consultations/[id]
// Save/update the transcript on an existing consultation. Intentionally
// decoupled from analysis so the transcript persists even if AI generation
// later fails — callers save first, then generate.
export async function PATCH(
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

        let body: PatchBody;
        try {
            body = (await req.json()) as PatchBody;
        } catch {
            return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
        }
        if (typeof body.transcript !== "string") {
            return NextResponse.json({ error: "transcript is required" }, { status: 400 });
        }
        const transcript = body.transcript.trim();

        // Don't regress a consultation that's already been summarized or sent —
        // saving an edited transcript on those keeps their existing status.
        const terminal =
            consultation.status === ConsultationStatus.SUMMARIZED ||
            consultation.status === ConsultationStatus.SENT;

        const updated = await prisma.consultation.update({
            where: { id },
            data: {
                transcript: transcript || null,
                ...(terminal
                    ? {}
                    : {
                          status: transcript
                              ? ConsultationStatus.TRANSCRIBED
                              : ConsultationStatus.DRAFT,
                      }),
            },
            select: { id: true, transcript: true, status: true, updatedAt: true },
        });

        return NextResponse.json({ consultation: updated });
    } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        if (msg === "UNAUTHORIZED") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        console.error("[PATCH /api/consultations/[id]]", err);
        return NextResponse.json({ error: msg }, { status: 500 });
    }
}
