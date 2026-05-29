import { Resend } from "resend";
import { DripMessageStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { renderBrandedEmailFromBody } from "@/lib/email/template";

export interface DripAttachment {
    filename: string;
    url: string;
}

/** Validate the stored attachmentsJson into a clean list (https URLs only). */
export function parseAttachments(json: unknown): DripAttachment[] {
    if (!Array.isArray(json)) return [];
    const out: DripAttachment[] = [];
    for (const a of json) {
        if (a && typeof a === "object") {
            const filename = String((a as Record<string, unknown>).filename ?? "").trim();
            const url = String((a as Record<string, unknown>).url ?? "").trim();
            if (filename && /^https:\/\//i.test(url)) out.push({ filename, url });
        }
    }
    return out;
}

/** Send one drip email immediately (branded shell + attachments) and mark it
 *  SENT. Throws on misconfig or delivery failure so the caller can surface it
 *  and the message stays retryable. */
export async function sendDripMessageNow(opts: {
    id: string;
    to: string;
    subject: string;
    body: string;
    attachments?: DripAttachment[];
}): Promise<void> {
    const from = process.env.NEXT_STEPS_FROM ?? process.env.SIGNUP_NOTIFY_FROM;
    if (!process.env.RESEND_API_KEY || !from) {
        throw new Error("Email is not configured (RESEND_API_KEY / NEXT_STEPS_FROM).");
    }
    const resend = new Resend(process.env.RESEND_API_KEY);
    const { error } = await resend.emails.send({
        from,
        to: opts.to,
        subject: opts.subject,
        html: renderBrandedEmailFromBody(opts.body, opts.subject),
        attachments: opts.attachments?.length
            ? opts.attachments.map((a) => ({ filename: a.filename, path: a.url }))
            : undefined,
    });
    if (error) {
        throw new Error(typeof error === "string" ? error : error.message);
    }
    await prisma.dripMessage.update({
        where: { id: opts.id },
        data: { status: DripMessageStatus.SENT, sentAt: new Date() },
    });
}
