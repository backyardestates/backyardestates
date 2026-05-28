import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import s from "../engagements/engagements.module.css";

export const dynamic = "force-dynamic";

export default async function NotificationsPage() {
    const { userId } = await auth();
    if (!userId) redirect("/sign-in");

    const items = await prisma.notification
        .findMany({ where: { userId }, orderBy: { createdAt: "desc" }, take: 100 })
        .catch(() => []);

    return (
        <div className={s.shell}>
            <header className={s.header}>
                <div>
                    <h1 className={s.title}>Notifications</h1>
                    <p className={s.subtitle}>Updates across your engagements and handoffs.</p>
                </div>
            </header>

            {items.length === 0 ? (
                <p className={s.empty}>Nothing yet.</p>
            ) : (
                <ul className={s.timeline}>
                    {items.map((n) => (
                        <li key={n.id} className={s.timelineItem}>
                            {n.linkUrl ? (
                                <a href={n.linkUrl} style={{ textDecoration: "none", color: "inherit" }}>
                                    <span className={s.timelineType}>{n.title}</span>
                                </a>
                            ) : (
                                <span className={s.timelineType}>{n.title}</span>
                            )}
                            {n.body && (
                                <span className={s.rowMuted} style={{ display: "block" }}>{n.body}</span>
                            )}
                            <span className={s.timelineWhen}>{n.createdAt.toLocaleString()}</span>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
