import { NextResponse } from "next/server";
import { DripStatus, DripMessageStatus, DripChannel } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { sendDripMessageNow, parseAttachments } from "@/lib/drip/send";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Sends due drip emails. Invoked by the Vercel cron (see vercel.json); Vercel
// sends `Authorization: Bearer $CRON_SECRET`. Also POST-able with the same header.
async function handle(req: Request) {
    const secret = process.env.CRON_SECRET;
    if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!process.env.RESEND_API_KEY || !(process.env.NEXT_STEPS_FROM ?? process.env.SIGNUP_NOTIFY_FROM)) {
        return NextResponse.json({ error: "Email not configured" }, { status: 503 });
    }

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
            await sendDripMessageNow({
                id: m.id,
                to,
                subject: m.subject,
                body: m.body,
                attachments: parseAttachments(m.attachmentsJson),
            });
            sent++;
        } catch (err) {
            console.error("[cron/drip] send failed", err);
            await prisma.dripMessage.update({ where: { id: m.id }, data: { status: DripMessageStatus.FAILED } });
            failed++;
        }
    }

    // Complete enrollments that have no SCHEDULED messages left.
    // One groupBy + one updateMany instead of a count+update per enrollment.
    const touched = [...touchedEnrollments];
    if (touched.length > 0) {
        const stillScheduled = await prisma.dripMessage.groupBy({
            by: ["enrollmentId"],
            where: {
                enrollmentId: { in: touched },
                status: DripMessageStatus.SCHEDULED,
            },
        });
        const stillActive = new Set(stillScheduled.map((g) => g.enrollmentId));
        const completed = touched.filter((id) => !stillActive.has(id));
        if (completed.length > 0) {
            await prisma.dripEnrollment.updateMany({
                where: { id: { in: completed }, status: DripStatus.ACTIVE },
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
