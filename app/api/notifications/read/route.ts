import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST /api/notifications/read — mark notifications read.
// Body: { ids?: string[] } — omit `ids` to mark all of the user's unread.
export async function POST(req: Request) {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = (await req.json().catch(() => ({}))) as { ids?: unknown };
    const ids = Array.isArray(body.ids)
        ? body.ids.filter((x): x is string => typeof x === "string")
        : null;

    await prisma.notification.updateMany({
        where: { userId, ...(ids ? { id: { in: ids } } : { read: false }) },
        data: { read: true, readAt: new Date() },
    });

    return NextResponse.json({ ok: true });
}
