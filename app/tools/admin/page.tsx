import Link from "next/link";
import { prisma } from "@/lib/prisma";

export default async function AdminHome() {
    const items = await prisma.workItem.findMany({
        orderBy: { updatedAt: "desc" },
        include: { category: true },
    });

    return (
        <div>
            <h1>Work Items</h1>
            <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
                <Link href="/tools/admin/work-items/new">+ New Work Item</Link>
                <Link href="/tools/admin/categories">Manage Categories</Link>
            </div>

            <div style={{ display: "grid", gap: 10 }}>
                {items.map((wi) => (
                    <div key={wi.id} style={{ border: "1px solid #ddd", padding: 12, borderRadius: 8 }}>
                        <div style={{ display: "flex", justifyContent: "space-between" }}>
                            <div>
                                <strong>{wi.title}</strong>
                                <div style={{ opacity: 0.7 }}>{wi.category?.name}</div>
                            </div>
                            <div style={{ display: "flex", gap: 12 }}>
                                <Link href={`/tools/admin/work-items/${wi.id}`}>Edit</Link>
                            </div>
                        </div>
                        <div style={{ marginTop: 8, opacity: 0.85 }}>
                            Range: {wi.typicalMin ?? "—"} – {wi.typicalMax ?? "—"}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
