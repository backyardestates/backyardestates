import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/notifications — the current user's recent notifications + unread count.
export async function GET() {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ items: [], unreadCount: 0 });

    const [items, unreadCount] = await Promise.all([
        prisma.notification.findMany({
            where: { userId },
            orderBy: { createdAt: "desc" },
            take: 30,
        }),
        prisma.notification.count({ where: { userId, read: false } }),
    ]);

    return NextResponse.json({ items, unreadCount });
}
