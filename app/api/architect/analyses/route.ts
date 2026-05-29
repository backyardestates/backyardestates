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
import { requireApiPermission } from "@/lib/rbac/getPermissions";
import {
    transitionEngagementStage,
    logEngagementEvent,
    isForwardTransition,
} from "@/lib/engagement/stage";
import { notifyUser } from "@/lib/engagement/notify";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface CreateBody {
    engagementId?: string;
    /** Architect to assign. Falls back to the engagement's current architect. */
    architectId?: string | null;
}

// POST /api/architect/analyses
// Manually start a formal analysis for an engagement (the non-Calendly path).
// Creates a PENDING FormalAnalysis, optionally (re)assigns the architect,
// advances the engagement to FPA_SCHEDULED if it's earlier in the pipeline, and
// notifies the assigned architect. Returns the new analysis id so the caller can
// open the architect's on-site tool at /tools/fpa/[id].
export async function POST(req: Request) {
    const denied = await requireApiPermission("fpa.create");
    if (denied) return denied;

    try {
        const { userId } = await ensureProposalContext();

        let body: CreateBody;
        try {
            body = (await req.json()) as CreateBody;
        } catch {
            return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
        }

        const engagementId = body.engagementId?.trim();
        if (!engagementId) {
            return NextResponse.json({ error: "engagementId is required." }, { status: 400 });
        }

        const engagement = await prisma.engagement.findUnique({
            where: { id: engagementId },
            select: {
                id: true,
                stage: true,
                architectId: true,
                customerName: true,
            },
        });
        if (!engagement) {
            return NextResponse.json({ error: "Engagement not found." }, { status: 404 });
        }

        // Idempotency: don't fork a second open analysis. If one's already in
        // flight, return it so the caller lands on the existing tool.
        const open = await prisma.formalAnalysis.findFirst({
            where: {
                engagementId: engagement.id,
                status: { in: [AnalysisStatus.PENDING, AnalysisStatus.IN_PROGRESS] },
            },
            select: { id: true },
        });
        if (open) {
            return NextResponse.json({ ok: true, analysisId: open.id, deduped: true });
        }

        // Resolve the architect: an explicit pick wins, else the engagement's
        // current architect, else unassigned. Validate an explicit pick is real.
        let architectId: string | null = engagement.architectId;
        if (body.architectId !== undefined) {
            const picked = body.architectId?.trim() || null;
            if (picked) {
                const architect = await prisma.user.findFirst({
                    where: { id: picked, role: Role.ARCHITECT },
                    select: { id: true },
                });
                if (!architect) {
                    return NextResponse.json(
                        { error: "Selected architect not found." },
                        { status: 400 },
                    );
                }
            }
            architectId = picked;
        }

        // Keep the engagement's architect in sync with the assignment so the
        // estimate handoff and future analyses route to the same person.
        if (architectId !== engagement.architectId) {
            await prisma.engagement.update({
                where: { id: engagement.id },
                data: { architectId },
            });
        }

        const analysis = await prisma.formalAnalysis.create({
            data: {
                engagementId: engagement.id,
                status: AnalysisStatus.PENDING,
                architectId,
            },
        });

        // Advance the stage forward only — never move a deal backwards if the
        // admin starts an analysis on an engagement that's further along.
        if (isForwardTransition(engagement.stage, EngagementStage.FPA_SCHEDULED)) {
            await transitionEngagementStage({
                engagementId: engagement.id,
                toStage: EngagementStage.FPA_SCHEDULED,
                actorId: userId,
                eventType: EngagementEventType.FPA_ASSIGNED,
                message: "Formal analysis started manually.",
            });
        } else {
            await logEngagementEvent({
                engagementId: engagement.id,
                type: EngagementEventType.FPA_ASSIGNED,
                actorId: userId,
                message: "Formal analysis started manually.",
            });
        }

        if (architectId) {
            const latestConsult = await prisma.consultation.findFirst({
                where: { engagementId: engagement.id },
                orderBy: { createdAt: "desc" },
                select: { summary: true },
            });
            const architect = await prisma.user.findUnique({
                where: { id: architectId },
                select: { email: true },
            });
            await notifyUser({
                userId: architectId,
                engagementId: engagement.id,
                type: NotificationType.FPA_PAID,
                title: `New formal analysis: ${engagement.customerName ?? "customer"}`,
                body: [
                    `${engagement.customerName ?? "A customer"} has a formal property analysis to complete.`,
                    latestConsult?.summary ? `Consultation summary: ${latestConsult.summary}` : null,
                ]
                    .filter(Boolean)
                    .join(" "),
                linkPath: `/tools/fpa/${analysis.id}`,
                emailTo: architect?.email ?? null,
            });
        }

        return NextResponse.json({ ok: true, analysisId: analysis.id });
    } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        if (msg === "UNAUTHORIZED") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        console.error("[POST /api/architect/analyses]", err);
        return NextResponse.json({ error: msg }, { status: 500 });
    }
}
