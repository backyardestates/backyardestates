import { DripStatus, DripChannel, EngagementEventType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { client as sanity } from "@/sanity/client";
import { PRESENTER_STORIES_QUERY, PRESENTER_COMPLETED_PROPERTIES_QUERY } from "@/sanity/queries";
import { isAnthropicConfigured } from "@/lib/ai/claude";
import { generateDripPlan } from "@/lib/ai/dripPlan";
import { logEngagementEvent } from "@/lib/engagement/stage";

const DAY_MS = 86_400_000;

interface SanityStory {
    _id: string;
    names?: string;
    purpose?: string;
    quote?: string;
}
interface SanityProperty {
    _id: string;
    name?: string;
    sqft?: number;
    bed?: number;
    bath?: number;
}

/**
 * Enroll an engagement in a content-matched email drip. Best-effort and
 * idempotent (skips if an ACTIVE enrollment already exists). Throws on failure;
 * callers fire-and-forget with .catch().
 */
export async function enrollInDrip(engagementId: string): Promise<void> {
    if (!isAnthropicConfigured()) return;

    const existing = await prisma.dripEnrollment.findFirst({
        where: { engagementId, status: DripStatus.ACTIVE },
        select: { id: true },
    });
    if (existing) return;

    const engagement = await prisma.engagement.findUnique({
        where: { id: engagementId },
        select: { customerName: true },
    });
    if (!engagement) return;

    const consult = await prisma.consultation.findFirst({
        where: { engagementId },
        orderBy: { createdAt: "desc" },
        select: { aiSummaryJson: true },
    });
    const ai = (consult?.aiSummaryJson ?? null) as {
        bulletPoints?: string[];
        intent?: { primaryMotivation?: string; readiness?: string; concerns?: string[] };
    } | null;

    const [stories, properties] = await Promise.all([
        sanity.fetch<SanityStory[]>(PRESENTER_STORIES_QUERY).catch(() => []),
        sanity.fetch<SanityProperty[]>(PRESENTER_COMPLETED_PROPERTIES_QUERY).catch(() => []),
    ]);

    const plan = await generateDripPlan({
        customerName: engagement.customerName,
        motivation: ai?.intent?.primaryMotivation ?? null,
        readiness: ai?.intent?.readiness ?? null,
        concerns: ai?.intent?.concerns ?? [],
        bulletPoints: ai?.bulletPoints ?? [],
        stories: stories.slice(0, 12).map((s) => ({
            id: s._id,
            names: s.names,
            purpose: s.purpose,
            quote: s.quote,
        })),
        properties: properties.slice(0, 12).map((p) => ({
            id: p._id,
            name: p.name,
            sqft: p.sqft,
            bed: p.bed,
            bath: p.bath,
        })),
    });

    if (plan.messages.length === 0) return;

    const now = Date.now();
    await prisma.dripEnrollment.create({
        data: {
            engagementId,
            status: DripStatus.ACTIVE,
            messages: {
                create: plan.messages.map((m, i) => ({
                    stepIndex: i,
                    channel: DripChannel.EMAIL,
                    subject: m.subject,
                    body: m.body,
                    contentRef: m.contentRef ?? null,
                    scheduledFor: new Date(now + Math.max(0, m.dayOffset) * DAY_MS),
                })),
            },
        },
    });

    await logEngagementEvent({
        engagementId,
        type: EngagementEventType.NOTE,
        message: `Enrolled in a ${plan.messages.length}-touch follow-up drip.`,
    });
}
