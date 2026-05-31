import { NextResponse } from "next/server";
import { Prisma, ConsultationStatus, EngagementEventType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { ensureProposalContext } from "@/lib/db/ensureProposalContext";
import { canAccessEngagement } from "@/lib/engagement/access";
import { logEngagementEvent } from "@/lib/engagement/stage";
import { analyzeConsultation } from "@/lib/ai/consultationAnalysis";
import { isAnthropicConfigured } from "@/lib/ai/claude";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// The Claude analysis can run past the default serverless time limit. Without a
// raised budget the function is killed mid-request and returns a non-JSON error
// page, which surfaces on the client as an opaque JSON parse error.
export const maxDuration = 300;

// POST /api/consultations/[id]/analyze
// Runs the transcript through Claude and stores the structured notes, the
// next-steps email draft, and the marketing follow-up actions.
export async function POST(
    _req: Request,
    { params }: { params: Promise<{ id: string }> },
) {
    try {
        const { userId, role } = await ensureProposalContext();
        const { id } = await params;

        if (!isAnthropicConfigured()) {
            return NextResponse.json(
                { error: "ANTHROPIC_API_KEY is not configured on this server." },
                { status: 503 },
            );
        }

        const consultation = await prisma.consultation.findUnique({
            where: { id },
            include: {
                engagement: {
                    select: {
                        repId: true,
                        architectId: true,
                        customerName: true,
                        addressLine1: true,
                        city: true,
                        state: true,
                    },
                },
            },
        });
        if (!consultation) {
            return NextResponse.json({ error: "Not found" }, { status: 404 });
        }
        if (!canAccessEngagement(consultation.engagement, userId, role)) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }
        if (!consultation.transcript?.trim()) {
            return NextResponse.json(
                { error: "No transcript to analyze yet." },
                { status: 400 },
            );
        }

        const e = consultation.engagement;
        const address =
            [e.addressLine1, e.city, e.state].filter(Boolean).join(", ") || null;

        let analysis;
        try {
            analysis = await analyzeConsultation({
                transcript: consultation.transcript,
                customerName: e.customerName,
                address,
            });
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
            data: {
                status: ConsultationStatus.SUMMARIZED,
                summary: analysis.summary,
                aiSummaryJson: {
                    bulletPoints: analysis.bulletPoints,
                    actionItems: analysis.actionItems,
                    sentiment: analysis.sentiment,
                    intent: analysis.intent,
                } as unknown as Prisma.InputJsonValue,
                nextStepsEmailDraft: JSON.stringify(analysis.nextStepsEmail),
                marketingSuggestionsJson: analysis.marketingActions as unknown as Prisma.InputJsonValue,
            },
        });

        await logEngagementEvent({
            engagementId: consultation.engagementId,
            type: EngagementEventType.AI_SUMMARY_GENERATED,
            actorId: userId,
            message: "AI notes + next-steps draft generated",
        });

        return NextResponse.json({ consultation: updated, analysis });
    } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        if (msg === "UNAUTHORIZED") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        console.error("[POST /api/consultations/[id]/analyze]", err);
        return NextResponse.json({ error: msg }, { status: 500 });
    }
}
