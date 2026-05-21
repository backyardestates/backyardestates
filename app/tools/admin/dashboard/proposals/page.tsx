import Link from "next/link";
import { Role, ProposalStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { guardPageRole } from "@/lib/auth/guardPage";
import { ProposalRowMenu } from "../../../_components/ProposalRowMenu";
import s from "./proposals.module.css";

export const dynamic = "force-dynamic";

const ALL_STATUSES = Object.values(ProposalStatus);

function parseStatusParam(raw: string | undefined): ProposalStatus | "ALL" {
    if (!raw || raw === "ALL") return "ALL";
    const upper = raw.toUpperCase();
    return (ALL_STATUSES as string[]).includes(upper) ? (upper as ProposalStatus) : "ALL";
}

export default async function ProposalsListPage({
    searchParams,
}: {
    searchParams: Promise<{ status?: string }>;
}) {
    await guardPageRole([Role.ADMIN], "/tools/admin/dashboard/proposals");

    const { status: rawStatus } = await searchParams;
    const filter = parseStatusParam(rawStatus);

    const [rows, counts] = await Promise.all([
        prisma.proposal.findMany({
            where: filter === "ALL" ? {} : { status: filter },
            orderBy: { updatedAt: "desc" },
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
                createdAt: true,
                createdBy: { select: { email: true } },
                _count: { select: { lineItems: true, discounts: true } },
            },
        }),
        prisma.proposal.groupBy({ by: ["status"], _count: { _all: true } }),
    ]);

    const countBy: Record<string, number> = {};
    for (const c of counts) countBy[c.status] = c._count._all;
    const total = Object.values(countBy).reduce((a, b) => a + b, 0);

    return (
        <div className={s.shell}>
            <header className={s.header}>
                <div>
                    <Link href="/tools/admin/dashboard" className={s.backLink}>← Dashboard</Link>
                    <h1 className={s.title}>All <em>proposals</em></h1>
                    <p className={s.subtitle}>
                        {rows.length} {rows.length === 1 ? "row" : "rows"}{filter !== "ALL" ? ` · ${filter}` : ""}
                    </p>
                </div>
                <Link href="/tools/admin/master" className={s.primaryAction}>+ New proposal</Link>
            </header>

            {/* ── Filter tabs ───────────────────────────────────────────────── */}
            <nav className={s.filterTabs}>
                <FilterTab label={`All (${total})`} value="ALL" active={filter === "ALL"} />
                {ALL_STATUSES.map((st) => (
                    <FilterTab
                        key={st}
                        label={`${st} (${countBy[st] ?? 0})`}
                        value={st}
                        active={filter === st}
                    />
                ))}
            </nav>

            {/* ── Table ─────────────────────────────────────────────────────── */}
            {rows.length === 0 ? (
                <div className={s.empty}>
                    No proposals match this filter.{" "}
                    {filter !== "ALL" && <Link href="/tools/admin/dashboard/proposals">Show all</Link>}
                </div>
            ) : (
                <div className={s.tableWrap}>
                    <table className={s.table}>
                        <thead>
                            <tr>
                                <th>Customer</th>
                                <th>Address</th>
                                <th>Status</th>
                                <th className={s.numCol}>Items</th>
                                <th className={s.numCol}>Discounts</th>
                                <th>Created by</th>
                                <th>Updated</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {rows.map((p) => {
                                const addr = [p.addressLine1, p.city, p.state].filter(Boolean).join(", ");
                                return (
                                    <tr key={p.id}>
                                        <td>
                                            <div className={s.customerName}>{p.customerName || "(unnamed)"}</div>
                                            {p.customerEmail && (
                                                <div className={s.muted}>{p.customerEmail}</div>
                                            )}
                                        </td>
                                        <td className={s.addrCell}>{addr || <span className={s.muted}>—</span>}</td>
                                        <td>
                                            <span className={`${s.statusPill} ${s[`status_${p.status}`] ?? ""}`}>
                                                {p.status}
                                            </span>
                                        </td>
                                        <td className={s.numCol}>{p._count.lineItems}</td>
                                        <td className={s.numCol}>{p._count.discounts}</td>
                                        <td className={s.muted}>{p.createdBy?.email ?? "—"}</td>
                                        <td className={s.muted}>{p.updatedAt.toLocaleDateString()}</td>
                                        <td>
                                            <ProposalRowMenu
                                                addressKey={p.addressKey}
                                                customerName={p.customerName}
                                            />
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

function FilterTab({ label, value, active }: { label: string; value: string; active: boolean }) {
    return (
        <Link
            href={value === "ALL" ? "/tools/admin/dashboard/proposals" : `/tools/admin/dashboard/proposals?status=${value}`}
            className={`${s.filterTab} ${active ? s.filterTabActive : ""}`}
        >
            {label}
        </Link>
    );
}
