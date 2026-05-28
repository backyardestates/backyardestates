import { NextResponse } from "next/server";
import {
    Role,
    AnalysisStatus,
    EngagementStage,
    EngagementEventType,
    NotificationType,
    FlagType,
} from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { ensureProposalContext } from "@/lib/db/ensureProposalContext";
import { transitionEngagementStage } from "@/lib/engagement/stage";
import { notifyUser } from "@/lib/engagement/notify";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const FLAG_LABEL: Record<FlagType, string> = {
    COST_ADDER: "cost-adder",
    CONCERN: "concern",
    QUESTION: "open question",
};

// POST /api/architect/analyses/[id]/submit
// Finalize the analysis, advance the engagement to FPA_SUBMITTED, and notify
// the rep that it's ready to estimate.
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

        const flagCounts = await prisma.formalAnswer.groupBy({
            by: ["flagType"],
            where: { formalAnalysisId: id, flagType: { not: null } },
            _count: { _all: true },
        });
        const flagSummary =
            flagCounts.length === 0
                ? "No flags raised."
                : flagCounts
                      .map((f) => `${f._count._all} ${FLAG_LABEL[f.flagType as FlagType]}`)
                      .join(", ");

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
                    emailTo: rep.email ?? null,
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
