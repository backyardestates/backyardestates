import { NextResponse } from "next/server";
import { Resend } from "resend";
import { ConsultationStatus, EngagementStage, EngagementEventType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { ensureProposalContext } from "@/lib/db/ensureProposalContext";
import { canAccessEngagement } from "@/lib/engagement/access";
import { transitionEngagementStage, logEngagementEvent } from "@/lib/engagement/stage";
import { enrollInDrip } from "@/lib/drip/enroll";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function textToHtml(text: string): string {
    const esc = (s: string) =>
        s
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;");
    return text
        .split(/\n{2,}/)
        .map((p) => `<p>${esc(p).replace(/\n/g, "<br/>")}</p>`)
        .join("\n");
}

interface SendBody {
    to?: string;
    subject?: string;
    body?: string;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// POST /api/consultations/[id]/send-next-steps
// Sends the (rep-edited) next-steps email, marks the consultation sent, and
// advances the engagement to NEXT_STEPS_SENT (which posts a Pipedrive note).
export async function POST(
    req: Request,
    { params }: { params: Promise<{ id: string }> },
) {
    try {
        const { userId, role } = await ensureProposalContext();
        const { id } = await params;

        const consultation = await prisma.consultation.findUnique({
            where: { id },
            include: {
                engagement: {
                    select: {
                        id: true,
                        repId: true,
                        architectId: true,
                        customerEmail: true,
                        customerName: true,
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

        let body: SendBody;
        try {
            body = (await req.json()) as SendBody;
        } catch {
            return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
        }
        const subject = body.subject?.trim();
        const emailBody = body.body?.trim();
        if (!subject || !emailBody) {
            return NextResponse.json(
                { error: "Subject and body are required." },
                { status: 400 },
            );
        }

        // Prefer a rep-supplied recipient (e.g. when the engagement was started
        // from a Pipedrive deal with no email), falling back to the stored one.
        const to = body.to?.trim() || consultation.engagement.customerEmail?.trim() || "";
        if (!EMAIL_RE.test(to)) {
            return NextResponse.json(
                { error: "A valid recipient email is required." },
                { status: 400 },
            );
        }

        const from = process.env.NEXT_STEPS_FROM ?? process.env.SIGNUP_NOTIFY_FROM;
        if (!process.env.RESEND_API_KEY || !from) {
            return NextResponse.json(
                { error: "Email is not configured (RESEND_API_KEY / NEXT_STEPS_FROM)." },
                { status: 503 },
            );
        }

        const resend = new Resend(process.env.RESEND_API_KEY);
        const { error } = await resend.emails.send({
            from,
            to,
            subject,
            html: textToHtml(emailBody),
        });
        if (error) {
            return NextResponse.json(
                { error: typeof error === "string" ? error : error.message },
                { status: 502 },
            );
        }

        // Save a rep-supplied / corrected recipient so future sends have it.
        if (to !== consultation.engagement.customerEmail) {
            await prisma.engagement
                .update({
                    where: { id: consultation.engagementId },
                    data: { customerEmail: to },
                })
                .catch(() => {});
        }

        // First send vs. resend: only the first send advances the engagement
        // stage and kicks off the drip. A resend just delivers the (possibly
        // edited) email again and records the new draft.
        const isResend = consultation.status === ConsultationStatus.SENT;

        await prisma.consultation.update({
            where: { id },
            data: {
                status: ConsultationStatus.SENT,
                sentAt: new Date(),
                nextStepsEmailDraft: JSON.stringify({ subject, body: emailBody }),
            },
        });

        if (isResend) {
            await logEngagementEvent({
                engagementId: consultation.engagementId,
                type: EngagementEventType.NOTE,
                actorId: userId,
                message: `Next-steps email re-sent to ${consultation.engagement.customerName || to}.`,
            });
        } else {
            await transitionEngagementStage({
                engagementId: consultation.engagementId,
                toStage: EngagementStage.NEXT_STEPS_SENT,
                actorId: userId,
                eventType: EngagementEventType.NEXT_STEPS_SENT,
                message: `Next-steps email sent to ${consultation.engagement.customerName || to}.`,
            });

            // Enroll in a content-matched follow-up drip (best-effort, async).
            void enrollInDrip(consultation.engagementId).catch((err) =>
                console.error("[send-next-steps] drip enroll failed", err),
            );
        }

        return NextResponse.json({ ok: true, resent: isResend });
    } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        if (msg === "UNAUTHORIZED") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        console.error("[POST /api/consultations/[id]/send-next-steps]", err);
        return NextResponse.json({ error: msg }, { status: 500 });
    }
}
