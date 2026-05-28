import { prisma } from "@/lib/prisma";
import {
    Prisma,
    EngagementStage,
    EngagementEventType,
    type Engagement,
} from "@prisma/client";
import { isPipedriveConfigured, pipedriveFetch } from "@/lib/pipedrive/client";

/**
 * Engagement stage state machine.
 *
 * The happy-path order of the pipeline. `LOST` is terminal and reachable from
 * any stage, so it lives outside this array. Transitions are not hard-enforced
 * (an admin can correct a stage), but `isForwardTransition` lets callers/UI
 * distinguish a normal advance from a manual correction.
 */
export const STAGE_ORDER: EngagementStage[] = [
    EngagementStage.CONSULTATION,
    EngagementStage.NEXT_STEPS_SENT,
    EngagementStage.FPA_PAID,
    EngagementStage.FPA_SCHEDULED,
    EngagementStage.FPA_IN_PROGRESS,
    EngagementStage.FPA_SUBMITTED,
    EngagementStage.ESTIMATING,
    EngagementStage.PROPOSAL_DRAFT,
    EngagementStage.PROPOSAL_SENT,
    EngagementStage.AGREEMENT_SENT,
    EngagementStage.SIGNED,
];

const STAGE_LABELS: Record<EngagementStage, string> = {
    CONSULTATION: "Office consultation",
    NEXT_STEPS_SENT: "Next-steps email sent",
    FPA_PAID: "Formal analysis paid",
    FPA_SCHEDULED: "Formal analysis scheduled",
    FPA_IN_PROGRESS: "Formal analysis in progress",
    FPA_SUBMITTED: "Formal analysis submitted",
    ESTIMATING: "Estimating",
    PROPOSAL_DRAFT: "Proposal in draft",
    PROPOSAL_SENT: "Proposal sent",
    AGREEMENT_SENT: "Agreement sent",
    SIGNED: "Agreement signed",
    LOST: "Lost",
};

export function stageLabel(stage: EngagementStage): string {
    return STAGE_LABELS[stage] ?? stage;
}

export function isForwardTransition(
    from: EngagementStage,
    to: EngagementStage,
): boolean {
    const fromIdx = STAGE_ORDER.indexOf(from);
    const toIdx = STAGE_ORDER.indexOf(to);
    if (fromIdx === -1 || toIdx === -1) return false;
    return toIdx > fromIdx;
}

export interface TransitionInput {
    engagementId: string;
    toStage: EngagementStage;
    /** Clerk/DB user id of whoever triggered this (null for system/webhook). */
    actorId?: string | null;
    /** Human-readable note for the audit log + Pipedrive. */
    message?: string;
    /** Defaults to STAGE_CHANGED. */
    eventType?: EngagementEventType;
    metadata?: Prisma.InputJsonValue;
    /** Post a note to the linked Pipedrive person/deal. Default true. */
    syncPipedrive?: boolean;
}

/**
 * Advance (or correct) an engagement's stage. Always does three things in one
 * call: (1) update the stage, (2) append an EngagementEvent to the audit log,
 * (3) best-effort post a note to the linked Pipedrive person/deal. Pipedrive
 * failures are logged but never block the transition — the app is the workflow
 * layer; Pipedrive is an eventually-consistent mirror.
 */
export async function transitionEngagementStage(
    input: TransitionInput,
): Promise<Engagement> {
    const engagement = await prisma.engagement.update({
        where: { id: input.engagementId },
        data: { stage: input.toStage },
    });

    await logEngagementEvent({
        engagementId: input.engagementId,
        type: input.eventType ?? EngagementEventType.STAGE_CHANGED,
        actorId: input.actorId ?? null,
        message: input.message ?? `Stage → ${stageLabel(input.toStage)}`,
        metadata: input.metadata,
    });

    if (input.syncPipedrive !== false) {
        try {
            await postStageNoteToPipedrive(engagement, input.message);
        } catch (err) {
            console.error("[engagement] Pipedrive stage-note sync failed", err);
        }
    }

    return engagement;
}

export interface LogEventInput {
    engagementId: string;
    type: EngagementEventType;
    actorId?: string | null;
    message?: string;
    metadata?: Prisma.InputJsonValue;
}

/** Append a row to the engagement's audit log. */
export async function logEngagementEvent(input: LogEventInput): Promise<void> {
    await prisma.engagementEvent.create({
        data: {
            engagementId: input.engagementId,
            type: input.type,
            actorId: input.actorId ?? null,
            message: input.message,
            ...(input.metadata !== undefined ? { metadata: input.metadata } : {}),
        },
    });
}

async function postStageNoteToPipedrive(
    engagement: Pick<Engagement, "pipedrivePersonId" | "pipedriveDealId" | "stage">,
    message?: string,
): Promise<void> {
    if (!isPipedriveConfigured()) return;

    const personId = engagement.pipedrivePersonId?.trim() || null;
    const dealId = engagement.pipedriveDealId?.trim() || null;
    if (!personId && !dealId) return;

    const content =
        message?.trim() ||
        `Backyard Estates pipeline: ${stageLabel(engagement.stage)}.`;

    const payload: Record<string, unknown> = { content };
    if (personId) payload.person_id = Number(personId);
    if (dealId) payload.deal_id = Number(dealId);

    await pipedriveFetch("notes", { method: "POST", body: payload });
}
