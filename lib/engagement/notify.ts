import { Resend } from "resend";
import { NotificationType } from "@prisma/client";
import { prisma } from "@/lib/prisma";

function escapeHtml(s: string): string {
    return s
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
}

export function absoluteUrl(path: string): string {
    const base = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ?? "";
    return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}

export interface NotifyInput {
    userId: string;
    engagementId?: string | null;
    type?: NotificationType;
    title: string;
    body?: string;
    /** Relative path; turned into an absolute link in the email. */
    linkPath?: string;
    /** When set and email is configured, also send an email notification. */
    emailTo?: string | null;
}

/**
 * Create an in-app notification and, when an email + Resend are configured,
 * fan out an email too. Email failures are swallowed (logged) so a notification
 * never blocks the workflow transition that triggered it.
 */
export async function notifyUser(input: NotifyInput): Promise<void> {
    await prisma.notification.create({
        data: {
            userId: input.userId,
            engagementId: input.engagementId ?? null,
            type: input.type ?? NotificationType.GENERIC,
            title: input.title,
            body: input.body,
            linkUrl: input.linkPath ? absoluteUrl(input.linkPath) : null,
        },
    });

    const from = process.env.NEXT_STEPS_FROM ?? process.env.SIGNUP_NOTIFY_FROM;
    if (input.emailTo && process.env.RESEND_API_KEY && from) {
        try {
            const resend = new Resend(process.env.RESEND_API_KEY);
            const link = input.linkPath
                ? `<p><a href="${absoluteUrl(input.linkPath)}">Open in Backyard Estates</a></p>`
                : "";
            await resend.emails.send({
                from,
                to: input.emailTo,
                subject: input.title,
                html: `<p>${escapeHtml(input.body ?? input.title)}</p>${link}`,
            });
        } catch (err) {
            console.error("[notify] email send failed", err);
        }
    }
}

/** Notify every ADMIN user (used for unmatched-payment / fallback alerts). */
export async function notifyAdmins(input: Omit<NotifyInput, "userId" | "emailTo">): Promise<void> {
    const admins = await prisma.user.findMany({
        where: { role: "ADMIN" },
        select: { id: true, email: true },
    });
    await Promise.all(
        admins.map((a) => notifyUser({ ...input, userId: a.id, emailTo: a.email })),
    );
}
