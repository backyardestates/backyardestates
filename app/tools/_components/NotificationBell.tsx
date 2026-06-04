"use client";

import { useEffect, useRef, useState } from "react";

interface Notification {
    id: string;
    title: string;
    body: string | null;
    linkUrl: string | null;
    read: boolean;
    createdAt: string;
}

export function NotificationBell() {
    const [items, setItems] = useState<Notification[]>([]);
    const [unread, setUnread] = useState(0);
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement | null>(null);

    async function load() {
        try {
            const res = await fetch("/api/notifications");
            if (!res.ok) return;
            const data = await res.json();
            setItems(data.items ?? []);
            setUnread(data.unreadCount ?? 0);
        } catch {
            /* ignore */
        }
    }

    // Poll only while the tab is visible — a backgrounded tab used to keep
    // hitting /api/notifications every 60s all day. On refocus, refresh
    // immediately and resume.
    useEffect(() => {
        let t: ReturnType<typeof setInterval> | null = null;
        const start = () => {
            if (!t) t = setInterval(load, 60_000);
        };
        const stop = () => {
            if (t) {
                clearInterval(t);
                t = null;
            }
        };
        const onVis = () => {
            if (document.hidden) {
                stop();
            } else {
                void load();
                start();
            }
        };
        void load();
        if (!document.hidden) start();
        document.addEventListener("visibilitychange", onVis);
        return () => {
            stop();
            document.removeEventListener("visibilitychange", onVis);
        };
    }, []);

    // Close on outside click.
    useEffect(() => {
        function onDoc(e: MouseEvent) {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
        }
        document.addEventListener("mousedown", onDoc);
        return () => document.removeEventListener("mousedown", onDoc);
    }, []);

    async function markAllRead() {
        await fetch("/api/notifications/read", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" }).catch(() => {});
        setUnread(0);
        setItems((prev) => prev.map((n) => ({ ...n, read: true })));
    }

    return (
        <div ref={ref} style={{ position: "relative" }}>
            <button
                type="button"
                onClick={() => setOpen((o) => !o)}
                aria-label="Notifications"
                style={{
                    position: "relative",
                    background: "transparent",
                    border: "none",
                    cursor: "pointer",
                    fontSize: 18,
                    lineHeight: 1,
                    padding: 6,
                }}
            >
                <span aria-hidden>🔔</span>
                {unread > 0 && (
                    <span
                        style={{
                            position: "absolute",
                            top: 0,
                            right: 0,
                            minWidth: 16,
                            height: 16,
                            padding: "0 4px",
                            borderRadius: 999,
                            background: "#b91c1c",
                            color: "#fff",
                            fontSize: 10,
                            fontWeight: 700,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                        }}
                    >
                        {unread > 9 ? "9+" : unread}
                    </span>
                )}
            </button>

            {open && (
                <div
                    style={{
                        position: "absolute",
                        right: 0,
                        top: "calc(100% + 8px)",
                        width: 340,
                        maxHeight: 420,
                        overflowY: "auto",
                        background: "#fff",
                        border: "1px solid #e5e7eb",
                        borderRadius: 12,
                        boxShadow: "0 16px 40px rgba(0,0,0,0.18)",
                        zIndex: 60,
                    }}
                >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", borderBottom: "1px solid #f1f5f9" }}>
                        <strong style={{ fontSize: 13 }}>Notifications</strong>
                        {unread > 0 && (
                            <button type="button" onClick={markAllRead} style={{ background: "transparent", border: "none", color: "#0f766e", cursor: "pointer", fontSize: 12 }}>
                                Mark all read
                            </button>
                        )}
                    </div>
                    {items.length === 0 ? (
                        <p style={{ padding: 16, color: "#9ca3af", fontSize: 13, margin: 0 }}>Nothing yet.</p>
                    ) : (
                        <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
                            {items.map((n) => {
                                const inner = (
                                    <>
                                        <div style={{ fontWeight: n.read ? 500 : 700, fontSize: 13 }}>{n.title}</div>
                                        {n.body && <div style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}>{n.body}</div>}
                                        <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 2 }}>{new Date(n.createdAt).toLocaleString()}</div>
                                    </>
                                );
                                return (
                                    <li key={n.id} style={{ padding: "10px 14px", borderBottom: "1px solid #f1f5f9", background: n.read ? "#fff" : "#f0fdfa" }}>
                                        {n.linkUrl ? (
                                            <a href={n.linkUrl} style={{ textDecoration: "none", color: "inherit" }}>{inner}</a>
                                        ) : (
                                            inner
                                        )}
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                    <div style={{ padding: "8px 14px", borderTop: "1px solid #f1f5f9", textAlign: "center" }}>
                        <a href="/tools/notifications" style={{ fontSize: 12, color: "#0f766e", textDecoration: "none" }}>View all</a>
                    </div>
                </div>
            )}
        </div>
    );
}
