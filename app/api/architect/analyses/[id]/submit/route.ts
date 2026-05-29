import { NextResponse } from "next/server";
import {
    Role,
    AnalysisStatus,
    EngagementStage,
    EngagementEventType,
    NotificationType,
} from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { ensureProposalContext } from "@/lib/db/ensureProposalContext";
import { transitionEngagementStage } from "@/lib/engagement/stage";
import { notifyUser } from "@/lib/engagement/notify";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const FLAG_LABEL: Record<string, string> = {
    COST_ADDER: "cost-adder",
    CONCERN: "concern",
    QUESTION: "open question",
};

interface FlagEntry {
    flagType?: string;
}

function summarizeFlags(flagsJson: unknown): string {
    const flags = Array.isArray(flagsJson) ? (flagsJson as FlagEntry[]) : [];
    if (flags.length === 0) return "No flags raised";
    const counts: Record<string, number> = {};
    for (const f of flags) {
        const t = f.flagType ?? "";
        if (t) counts[t] = (counts[t] ?? 0) + 1;
    }
    const parts = Object.entries(counts).map(
        ([t, n]) => `${n} ${FLAG_LABEL[t] ?? t.toLowerCase()}${n === 1 ? "" : "s"}`,
    );
    return parts.length ? parts.join(", ") : "No flags raised";
}

// POST /api/architect/analyses/[id]/submit
// Finalize the analysis, advance the engagement to FPA_SUBMITTED, notify the rep.
export async function POST(
    _req: Request,
    { params }: { params: Promise<{ id: string }> },
) {
    try {
        const { userId, role } = await ensureProposalContext();
        const { id } = await params;

        const analysis = await prisma.formalAnalysis.findUnique({
            where: { id },
            include: {
                engagement: { select: { id: true, repId: true, customerName: true } },
            },
        });
        if (!analysis) {
            return NextResponse.json({ error: "Not found" }, { status: 404 });
        }
        if (role !== Role.ADMIN && analysis.architectId !== userId) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }
        if (analysis.status === AnalysisStatus.COMPLETE) {
            return NextResponse.json({ error: "Already submitted." }, { status: 409 });
        }

        const flagSummary = summarizeFlags(analysis.flagsJson);

        await prisma.formalAnalysis.update({
            where: { id },
            data: { status: AnalysisStatus.COMPLETE, completedAt: new Date() },
        });

        const engagement = analysis.engagement;
        if (engagement) {
            await transitionEngagementStage({
                engagementId: engagement.id,
                toStage: EngagementStage.FPA_SUBMITTED,
                actorId: userId,
                eventType: EngagementEventType.FPA_SUBMITTED,
                message: `Formal analysis submitted. ${flagSummary}.`,
            });

            if (engagement.repId) {
                const rep = await prisma.user.findUnique({
                    where: { id: engagement.repId },
                    select: { email: true },
                });
                await notifyUser({
                    userId: engagement.repId,
                    engagementId: engagement.id,
                    type: NotificationType.FPA_SUBMITTED,
                    title: `Ready to estimate: ${engagement.customerName ?? "customer"}`,
                    body: `The architect submitted the formal analysis. ${flagSummary}.`,
                    linkPath: `/tools/engagements/${engagement.id}`,
                    emailTo: rep?.email ?? null,
                });
            }
        }

        return NextResponse.json({ ok: true });
    } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        if (msg === "UNAUTHORIZED") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        console.error("[POST /api/architect/analyses/[id]/submit]", err);
        return NextResponse.json({ error: msg }, { status: 500 });
    }
}
