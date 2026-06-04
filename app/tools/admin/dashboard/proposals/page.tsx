import Link from "next/link";
import { Role, ProposalStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { guardPageRole } from "@/lib/auth/guardPage";
import { ProposalRowMenu } from "../../../_components/ProposalRowMenu";
import s from "./proposals.module.css";

export const dynamic = "force-dynamic";

type RowKind = "canonical" | "draft-only";

type GroupedRow = {
    addressKey: string;
    customerName: string;
    customerEmail: string | null;
    address: string;
    // Canonical (REVIEWED) row info — null when the address has no canonical yet
    // (only drafts exist).
    canonical: {
        id: string;
        status: ProposalStatus;
        updatedAt: Date;
        createdById: string;
        createdByEmail: string | null;
        lineItems: number;
        discounts: number;
    } | null;
    drafts: Array<{
        userId: string;
        email: string | null;
        updatedAt: Date;
    }>;
    rowKind: RowKind;
    // The "last updated" we show in the column — newest of canonical or
    // any draft. Drives the default sort.
    lastUpdated: Date;
};

export default async function ProposalsListPage({
    searchParams: _searchParams,
}: {
    searchParams: Promise<{ status?: string }>;
}) {
    await guardPageRole([Role.ADMIN], "/tools/admin/dashboard/proposals");

    // Fetch all proposals (drafts + canonical) and group in memory by
    // addressKey. Prisma can't do "DISTINCT ON" + collected children directly,
    // so the JS pass is the cleanest path. With <500 proposals expected for
    // the foreseeable future this is plenty fast.
    const allRows = await prisma.proposal.findMany({
        where: { addressKey: { not: null } },
        orderBy: { updatedAt: "desc" },
        take: 300, // newest 300 rows — matches the API index cap
        select: {
            id: true,
            customerName: true,
            customerEmail: true,
            addressLine1: true,
            city: true,
            state: true,
            addressKey: true,
            status: true,
            updatedAt: true,
            createdById: true,
            createdBy: { select: { email: true } },
            _count: { select: { lineItems: true, discounts: true } },
        },
    });

    const groups = new Map<string, GroupedRow>();
    for (const p of allRows) {
        const key = p.addressKey!;
        const addr = [p.addressLine1, p.city, p.state].filter(Boolean).join(", ");
        const existing = groups.get(key) ?? {
            addressKey: key,
            customerName: p.customerName,
            customerEmail: p.customerEmail,
            address: addr,
            canonical: null,
            drafts: [],
            rowKind: "draft-only" as RowKind,
            lastUpdated: p.updatedAt,
        };

        // Most-recent customer name/address wins (in case rows drift).
        if (p.updatedAt > existing.lastUpdated) {
            existing.customerName = p.customerName;
            existing.customerEmail = p.customerEmail;
            existing.address = addr;
            existing.lastUpdated = p.updatedAt;
        }

        if (p.status === ProposalStatus.DRAFT) {
            existing.drafts.push({
                userId: p.createdById,
                email: p.createdBy?.email ?? null,
                updatedAt: p.updatedAt,
            });
        } else {
            // Take the most-recently-updated non-draft as canonical.
            if (!existing.canonical || p.updatedAt > existing.canonical.updatedAt) {
                existing.canonical = {
                    id: p.id,
                    status: p.status,
                    updatedAt: p.updatedAt,
                    createdById: p.createdById,
                    createdByEmail: p.createdBy?.email ?? null,
                    lineItems: p._count.lineItems,
                    discounts: p._count.discounts,
                };
                existing.rowKind = "canonical";
            }
        }

        groups.set(key, existing);
    }

    const grouped: GroupedRow[] = [...groups.values()].sort(
        (a, b) => b.lastUpdated.getTime() - a.lastUpdated.getTime(),
    );

    // Top-level counts.
    const totalAddresses = grouped.length;
    const addressesWithCanonical = grouped.filter((g) => g.canonical).length;
    const addressesDraftOnly = totalAddresses - addressesWithCanonical;
    const totalDrafts = grouped.reduce((acc, g) => acc + g.drafts.length, 0);

    return (
        <div className={s.shell}>
            <header className={s.header}>
                <div>
                    <Link href="/tools/admin/dashboard" className={s.backLink}>← Dashboard</Link>
                    <h1 className={s.title}>All <em>proposals</em></h1>
                    <p className={s.subtitle}>
                        {totalAddresses} address{totalAddresses === 1 ? "" : "es"} ·{" "}
                        {addressesWithCanonical} saved ·{" "}
                        {addressesDraftOnly} draft-only ·{" "}
                        {totalDrafts} in-flight draft{totalDrafts === 1 ? "" : "s"}
                    </p>
                </div>
                <Link href="/tools/admin/master" className={s.primaryAction}>+ New proposal</Link>
            </header>

            {grouped.length === 0 ? (
                <div className={s.empty}>
                    No proposals yet. <Link href="/tools/admin/master">Create the first one</Link>.
                </div>
            ) : (
                <div className={s.tableWrap}>
                    <table className={s.table}>
                        <colgroup>
                            <col className={s.colCustomer} />
                            <col className={s.colAddress} />
                            <col className={s.colCanonical} />
                            <col className={s.colItems} />
                            <col className={s.colDrafts} />
                            <col className={s.colUpdated} />
                            <col className={s.colActions} />
                        </colgroup>
                        <thead>
                            <tr>
                                <th>Customer</th>
                                <th>Address</th>
                                <th>Canonical</th>
                                <th className={s.numCol}>Items</th>
                                <th>Drafts in flight</th>
                                <th>Updated</th>
                                <th className={s.actionsHead}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {grouped.map((g) => (
                                <GroupRow key={g.addressKey} row={g} />
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

function GroupRow({ row: g }: { row: GroupedRow }) {
    return (
        <tr>
            <td>
                <div className={s.customerName}>{g.customerName || "(unnamed)"}</div>
                {g.customerEmail && <div className={s.muted}>{g.customerEmail}</div>}
            </td>
            <td className={s.addrCell}>{g.address || <span className={s.muted}>—</span>}</td>
            <td>
                {g.canonical ? (
                    <Link
                        href={`/tools/admin/master?address=${encodeURIComponent(g.addressKey)}`}
                        className={`${s.statusPill} ${s[`status_${g.canonical.status}`] ?? ""} ${s.statusLink}`}
                        title="Open canonical proposal"
                    >
                        {g.canonical.status}
                    </Link>
                ) : (
                    <span className={s.draftOnlyTag} title="No canonical version yet — only drafts">
                        DRAFT-ONLY
                    </span>
                )}
                {g.canonical?.createdByEmail && (
                    <div className={s.muted} style={{ marginTop: 4 }}>
                        by {g.canonical.createdByEmail}
                    </div>
                )}
            </td>
            <td className={s.numCol}>{g.canonical?.lineItems ?? "—"}</td>
            <td>
                {g.drafts.length === 0 ? (
                    <span className={s.muted}>—</span>
                ) : (
                    // One draft per user per address is the norm now; collapse
                    // anything beyond the first two behind a disclosure so a
                    // legacy fork pile can't flood the row.
                    <div className={s.chipsRow}>
                        {g.drafts.slice(0, 2).map((d) => (
                            <Link
                                key={d.userId}
                                href={`/tools/admin/master?address=${encodeURIComponent(g.addressKey)}&asDraftOf=${encodeURIComponent(d.userId)}`}
                                className={s.chip}
                                title={`Open ${d.email || "this rep"}'s draft (saved ${d.updatedAt.toLocaleString()})`}
                            >
                                <span className={s.chipAvatar}>{initials(d.email)}</span>
                                <span className={s.chipLabel}>{d.email || "Unknown"}</span>
                            </Link>
                        ))}
                        {g.drafts.length > 2 && (
                            <details className={s.chipMore}>
                                <summary className={s.chip} title="Show remaining drafts">
                                    +{g.drafts.length - 2} more
                                </summary>
                                <div className={s.chipsRow}>
                                    {g.drafts.slice(2).map((d) => (
                                        <Link
                                            key={d.userId}
                                            href={`/tools/admin/master?address=${encodeURIComponent(g.addressKey)}&asDraftOf=${encodeURIComponent(d.userId)}`}
                                            className={s.chip}
                                            title={`Open ${d.email || "this rep"}'s draft (saved ${d.updatedAt.toLocaleString()})`}
                                        >
                                            <span className={s.chipAvatar}>{initials(d.email)}</span>
                                            <span className={s.chipLabel}>{d.email || "Unknown"}</span>
                                        </Link>
                                    ))}
                                </div>
                            </details>
                        )}
                    </div>
                )}
            </td>
            <td className={s.muted}>{g.lastUpdated.toLocaleDateString()}</td>
            <td>
                <ProposalRowMenu
                    addressKey={g.addressKey}
                    customerName={g.customerName}
                />
            </td>
        </tr>
    );
}

function initials(email: string | null): string {
    if (!email) return "?";
    const local = email.split("@")[0] || "";
    const parts = local.split(/[._-]+/).filter(Boolean);
    if (parts.length >= 2) return (parts[0]![0] + parts[1]![0]).toUpperCase();
    return (local[0] ?? "?").toUpperCase();
}
