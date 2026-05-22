import Link from "next/link";
import { redirect } from "next/navigation";
import { Role, ProposalStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getDbUser } from "@/lib/auth";
import { ProposalRowMenu } from "../_components/ProposalRowMenu";
import s from "./dashboard.module.css";

export const dynamic = "force-dynamic";

export default async function UserDashboard({
    searchParams,
}: {
    searchParams: Promise<{ status?: string }>;
}) {
    let me;
    try {
        me = await getDbUser();
    } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        if (msg === "UNAUTHORIZED") redirect("/sign-in?redirect_url=/tools/dashboard");
        throw err;
    }

    const { status: rawStatus } = await searchParams;
    const filter = rawStatus && (Object.values(ProposalStatus) as string[]).includes(rawStatus.toUpperCase())
        ? (rawStatus.toUpperCase() as ProposalStatus)
        : null;

    const [proposals, statusCounts] = await Promise.all([
        prisma.proposal.findMany({
            where: {
                createdById: me.id,
                ...(filter ? { status: filter } : {}),
            },
            orderBy: { updatedAt: "desc" },
            select: {
                id: true,
                customerName: true,
                addressLine1: true,
                city: true,
                state: true,
                addressKey: true,
                status: true,
                updatedAt: true,
                _count: { select: { lineItems: true, discounts: true } },
            },
        }),
        prisma.proposal.groupBy({
            by: ["status"],
            where: { createdById: me.id },
            _count: { _all: true },
        }),
    ]);

    const countBy: Record<string, number> = {};
    for (const c of statusCounts) countBy[c.status] = c._count._all;
    const total = Object.values(countBy).reduce((a, b) => a + b, 0);

    const canBuild = me.role === Role.ARCHITECT || me.role === Role.ADMIN;
    const displayName = me.email || me.id;

    return (
        <div className={s.shell}>
            <header className={s.header}>
                <div>
                    <div className={s.eyebrow}>Signed in as <strong>{displayName}</strong> · {me.role}</div>
                    <h1 className={s.title}>Your <em>proposals</em></h1>
                    <p className={s.subtitle}>
                        {total} {total === 1 ? "proposal" : "proposals"} created by you
                    </p>
                </div>
                {canBuild && (
                    <Link href="/tools/admin/master" className={s.primaryAction}>
                        + New proposal
                    </Link>
                )}
            </header>

            {/* Filter tabs (only show if there are any proposals) */}
            {total > 0 && (
                <nav className={s.filterTabs}>
                    <FilterTab label={`All (${total})`} value={null} active={filter === null} />
                    {Object.values(ProposalStatus).map((st) => (
                        <FilterTab
                            key={st}
                            label={`${st} (${countBy[st] ?? 0})`}
                            value={st}
                            active={filter === st}
                        />
                    ))}
                </nav>
            )}

            {proposals.length === 0 ? (
                <div className={s.empty}>
                    {total === 0 ? (
                        canBuild ? (
                            <>
                                <p>You haven&apos;t created any proposals yet.</p>
                                <Link href="/tools/admin/master" className={s.primaryAction}>
                                    Create your first proposal
                                </Link>
                            </>
                        ) : (
                            <p>You don&apos;t have any proposals yet. Ask an admin if you should have access to the proposal builder.</p>
                        )
                    ) : (
                        <p>
                            No proposals match this filter.{" "}
                            <Link href="/tools/dashboard">Show all</Link>
                        </p>
                    )}
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
                                <th>Updated</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {proposals.map((p) => {
                                const addr = [p.addressLine1, p.city, p.state].filter(Boolean).join(", ");
                                return (
                                    <tr key={p.id}>
                                        <td className={s.customerName}>{p.customerName || "(unnamed)"}</td>
                                        <td className={s.addrCell}>{addr || <span className={s.muted}>—</span>}</td>
                                        <td>
                                            <span className={`${s.statusPill} ${s[`status_${p.status}`] ?? ""}`}>
                                                {p.status}
                                            </span>
                                        </td>
                                        <td className={s.numCol}>{p._count.lineItems}</td>
                                        <td className={s.numCol}>{p._count.discounts}</td>
                                        <td className={s.muted}>{p.updatedAt.toLocaleDateString()}</td>
                                        <td>
                                            <ProposalRowMenu
                                                addressKey={p.addressKey}
                                                customerName={p.customerName}
                                                canBuild={canBuild}
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

function FilterTab({ label, value, active }: { label: string; value: ProposalStatus | null; active: boolean }) {
    return (
        <Link
            href={value === null ? "/tools/dashboard" : `/tools/dashboard?status=${value}`}
            className={`${s.filterTab} ${active ? s.filterTabActive : ""}`}
        >
            {label}
        </Link>
    );
}
