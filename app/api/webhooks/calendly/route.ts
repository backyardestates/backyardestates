import { NextResponse } from "next/server";
import {
    EngagementStage,
    EngagementEventType,
    AnalysisStatus,
    NotificationType,
    Role,
} from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { transitionEngagementStage } from "@/lib/engagement/stage";
import { notifyUser, notifyAdmins } from "@/lib/engagement/notify";
import { verifyCalendlySignature } from "@/lib/calendly/verify";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface CalendlyInvitee {
    email?: string;
    name?: string;
    uri?: string;
    payment?: { amount?: number; currency?: string; provider?: string } | null;
    scheduled_event?: { start_time?: string; end_time?: string; uri?: string };
}

// POST /api/webhooks/calendly
// Fires on a paid "formal property analysis" booking. Matches the invitee to an
// engagement, creates + assigns a FormalAnalysis, advances the stage, and
// notifies the architect. Unmatched payments route to the admin queue.
export async function POST(req: Request) {
    const raw = await req.text();

    if (
        !verifyCalendlySignature(
            raw,
            req.headers.get("Calendly-Webhook-Signature"),
            process.env.CALENDLY_WEBHOOK_SIGNING_KEY,
        )
    ) {
        return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    let body: { event?: string; payload?: CalendlyInvitee };
    try {
        body = JSON.parse(raw);
    } catch {
        return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    // Only paid invitee bookings drive the FPA handoff. Acknowledge everything
    // else with 200 so Calendly doesn't retry.
    if (body.event !== "invitee.created" || !body.payload?.payment) {
        return NextResponse.json({ ok: true, ignored: true });
    }

    const invitee = body.payload;
    const email = invitee.email?.trim().toLowerCase();
    const scheduledAt = invitee.scheduled_event?.start_time
        ? new Date(invitee.scheduled_event.start_time)
        : null;

    try {
        const engagement = email
            ? await prisma.engagement.findFirst({
                  where: {
                      customerEmail: { equals: email, mode: "insensitive" },
                      stage: { notIn: [EngagementStage.SIGNED, EngagementStage.LOST] },
                  },
                  orderBy: { updatedAt: "desc" },
              })
            : null;

        if (!engagement) {
            await notifyAdmins({
                type: NotificationType.FPA_PAID,
                title: "Unmatched formal-analysis payment",
                body: `A paid Calendly booking from ${invitee.name ?? email ?? "an unknown invitee"} couldn't be matched to an engagement. Link it manually.`,
            });
            return NextResponse.json({ ok: true, matched: false });
        }

        // Idempotency: Calendly retries. Don't fork a second open analysis.
        const open = await prisma.formalAnalysis.findFirst({
            where: {
                engagementId: engagement.id,
                status: { in: [AnalysisStatus.PENDING, AnalysisStatus.IN_PROGRESS] },
            },
            select: { id: true },
        });
        if (open) {
            return NextResponse.json({ ok: true, deduped: true });
        }

        // Assign an architect: keep the one already on the engagement, else the
        // first ARCHITECT user (round-robin/territory routing is a later refinement).
        let architectId = engagement.architectId;
        if (!architectId) {
            const architect = await prisma.user.findFirst({
                where: { role: Role.ARCHITECT },
                orderBy: { createdAt: "asc" },
                select: { id: true },
            });
            architectId = architect?.id ?? null;
            if (architectId) {
                await prisma.engagement.update({
                    where: { id: engagement.id },
                    data: { architectId },
                });
            }
        }

        const analysis = await prisma.formalAnalysis.create({
            data: {
                engagementId: engagement.id,
                status: AnalysisStatus.PENDING,
                scheduledAt,
                architectId,
            },
        });

        await transitionEngagementStage({
            engagementId: engagement.id,
            toStage: EngagementStage.FPA_SCHEDULED,
            eventType: EngagementEventType.FPA_PAID,
            message: `Formal property analysis paid${scheduledAt ? ` (scheduled ${scheduledAt.toLocaleString()})` : ""}.`,
            metadata: { calendlyInviteeUri: invitee.uri },
        });

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
                    `${engagement.customerName ?? "A customer"} paid for a formal property analysis.`,
                    scheduledAt ? `Scheduled: ${scheduledAt.toLocaleString()}.` : null,
                    latestConsult?.summary ? `Consultation summary: ${latestConsult.summary}` : null,
                ]
                    .filter(Boolean)
                    .join(" "),
                linkPath: `/tools/fpa/${analysis.id}`,
                emailTo: architect?.email ?? null,
            });
        } else {
            await notifyAdmins({
                type: NotificationType.FPA_PAID,
                title: "Formal analysis paid — no architect to assign",
                body: `${engagement.customerName ?? "A customer"} paid for an FPA but no ARCHITECT user exists to assign it to.`,
                engagementId: engagement.id,
            });
        }

        return NextResponse.json({ ok: true, matched: true, analysisId: analysis.id });
    } catch (err) {
        console.error("[POST /api/webhooks/calendly]", err);
        // 200 to avoid Calendly retry storms on a server bug; the error is logged.
        return NextResponse.json({ ok: false, error: "internal" });
    }
}
