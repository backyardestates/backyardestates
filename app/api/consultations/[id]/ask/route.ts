import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ensureProposalContext } from "@/lib/db/ensureProposalContext";
import { canAccessEngagement } from "@/lib/engagement/access";
import { askConsultation } from "@/lib/ai/consultationAnalysis";
import { isAnthropicConfigured } from "@/lib/ai/claude";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface AskBody {
    question?: string;
}

// POST /api/consultations/[id]/ask
// Answers a free-form question about the consultation, grounded only in its
// transcript — for anything the canned summary didn't surface.
export async function POST(
    req: Request,
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

        let body: AskBody;
        try {
            body = (await req.json()) as AskBody;
        } catch {
            return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
        }
        const question = body.question?.trim();
        if (!question) {
            return NextResponse.json({ error: "A question is required." }, { status: 400 });
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
                { error: "There's no transcript to search for this consultation." },
                { status: 400 },
            );
        }

        const e = consultation.engagement;
        const address = [e.addressLine1, e.city, e.state].filter(Boolean).join(", ") || null;

        let answer: string;
        try {
            answer = await askConsultation({
                transcript: consultation.transcript,
                question,
                customerName: e.customerName,
                address,
            });
        } catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            return NextResponse.json({ error: msg }, { status: 502 });
        }

        return NextResponse.json({ answer });
    } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        if (msg === "UNAUTHORIZED") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        console.error("[POST /api/consultations/[id]/ask]", err);
        return NextResponse.json({ error: msg }, { status: 500 });
    }
}
