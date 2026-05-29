import { NextResponse } from "next/server";
import { DripMessageStatus } from "@prisma/client";
import { requireDripMessageAccess, dripErrorResponse } from "@/lib/drip/access";
import { sendDripMessageNow, parseAttachments } from "@/lib/drip/send";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST /api/drip/messages/[id]/send-now
// Send a scheduled drip email immediately instead of waiting for the cron.
export async function POST(
    _req: Request,
    { params }: { params: Promise<{ id: string }> },
) {
    try {
        const { id } = await params;
        const { message } = await requireDripMessageAccess(id);

        if (message.status === DripMessageStatus.SENT) {
            return NextResponse.json({ error: "This email was already sent." }, { status: 409 });
        }
        const to = message.enrollment.engagement.customerEmail?.trim();
        if (!to) {
            return NextResponse.json(
                { error: "This engagement has no customer email on file." },
                { status: 400 },
            );
        }

        try {
            await sendDripMessageNow({
                id,
                to,
                subject: message.subject,
                body: message.body,
                attachments: parseAttachments(message.attachmentsJson),
            });
        } catch (sendErr) {
            return NextResponse.json(
                { error: sendErr instanceof Error ? sendErr.message : String(sendErr) },
                { status: 502 },
            );
        }

        return NextResponse.json({ ok: true });
    } catch (err) {
        const mapped = dripErrorResponse(err);
        if (mapped) return mapped;
        console.error("[POST /api/drip/messages/[id]/send-now]", err);
        return NextResponse.json(
            { error: err instanceof Error ? err.message : String(err) },
            { status: 500 },
        );
    }
}
