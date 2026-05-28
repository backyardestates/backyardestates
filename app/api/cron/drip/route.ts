import { NextResponse } from "next/server";
import { Resend } from "resend";
import { DripStatus, DripMessageStatus, DripChannel } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function textToHtml(text: string): string {
    const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    return text
        .split(/\n{2,}/)
        .map((p) => `<p>${esc(p).replace(/\n/g, "<br/>")}</p>`)
        .join("\n");
}

// Sends due drip emails. Invoked by the Vercel cron (see vercel.json); Vercel
// sends `Authorization: Bearer $CRON_SECRET`. Also POST-able with the same header.
async function handle(req: Request) {
    const secret = process.env.CRON_SECRET;
    if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const from = process.env.NEXT_STEPS_FROM ?? process.env.SIGNUP_NOTIFY_FROM;
    if (!process.env.RESEND_API_KEY || !from) {
        return NextResponse.json({ error: "Email not configured" }, { status: 503 });
    }
    const resend = new Resend(process.env.RESEND_API_KEY);

    const due = await prisma.dripMessage.findMany({
        where: {
            status: DripMessageStatus.SCHEDULED,
            scheduledFor: { lte: new Date() },
            channel: DripChannel.EMAIL,
            enrollment: { status: DripStatus.ACTIVE },
        },
        orderBy: { scheduledFor: "asc" },
        take: 50,
        include: {
            enrollment: {
                select: { id: true, engagement: { select: { customerEmail: true } } },
            },
        },
    });

    let sent = 0;
    let failed = 0;
    let skipped = 0;
    const touchedEnrollments = new Set<string>();

    for (const m of due) {
        touchedEnrollments.add(m.enrollmentId);
        const to = m.enrollment.engagement?.customerEmail?.trim();
        if (!to) {
            await prisma.dripMessage.update({ where: { id: m.id }, data: { status: DripMessageStatus.SKIPPED } });
            skipped++;
            continue;
        }
        try {
            const { error } = await resend.emails.send({
                from,
                to,
                subject: m.subject,
                html: textToHtml(m.body),
            });
            if (error) throw new Error(typeof error === "string" ? error : error.message);
            await prisma.dripMessage.update({
                where: { id: m.id },
                data: { status: DripMessageStatus.SENT, sentAt: new Date() },
            });
            sent++;
        } catch (err) {
            console.error("[cron/drip] send failed", err);
            await prisma.dripMessage.update({ where: { id: m.id }, data: { status: DripMessageStatus.FAILED } });
            failed++;
        }
    }

    // Complete enrollments that have no SCHEDULED messages left.
    for (const enrollmentId of touchedEnrollments) {
        const remaining = await prisma.dripMessage.count({
            where: { enrollmentId, status: DripMessageStatus.SCHEDULED },
        });
        if (remaining === 0) {
            await prisma.dripEnrollment.update({
                where: { id: enrollmentId },
                data: { status: DripStatus.COMPLETED },
            });
        }
    }

    return NextResponse.json({ processed: due.length, sent, failed, skipped });
}

export async function GET(req: Request) {
    return handle(req);
}
export async function POST(req: Request) {
    return handle(req);
}
