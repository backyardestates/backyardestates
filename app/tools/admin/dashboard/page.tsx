import { Suspense } from "react";
import Link from "next/link";
import { Role, ProposalStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { guardPageRole } from "@/lib/auth/guardPage";
import { getMergedUsers } from "@/lib/users/getMergedUsers";
import { ProposalRowMenu } from "../../_components/ProposalRowMenu";
import { Skeleton } from "../../_components/Skeleton/Skeleton";
import s from "./dashboard.module.css";

export const dynamic = "force-dynamic";

type Tile = {
    label: string;
    href: string;
    description: string;
    badge?: string | number;
};

export default async function AdminDashboardPage() {
    await guardPageRole([Role.ADMIN], "/tools/admin/dashboard");

    // Fast Prisma queries run inline — collectively well under 100ms. The slow
    // bits (Clerk-backed user data) are wrapped in <Suspense> below so the
    // shell + Prisma-only sections render immediately and the user sections
    // stream in with their own focused skeletons.
    const [
        proposalsByStatus,
        siteWorkCount,
        discountCount,
        cityCount,
        inclusionCount,
        taxTopicCount,
        milestoneCount,
        recentProposals,
    ] = await Promise.all([
        prisma.proposal.groupBy({ by: ["status"], _count: { _all: true } }).catch(() => []),
        prisma.siteWorkPreset.count().catch(() => 0),
        prisma.discountPreset.count({ where: { active: true } }).catch(() => 0),
        prisma.city.count({ where: { active: true } }).catch(() => 0),
        prisma.inclusionRow.count({ where: { active: true } }).catch(() => 0),
        prisma.taxTopic.count({ where: { active: true } }).catch(() => 0),
        prisma.paymentMilestoneDef.count().catch(() => 0),
        prisma.proposal.findMany({
            orderBy: { updatedAt: "desc" },
            take: 5,
            select: {
                id: true,
                customerName: true,
                addressLine1: true,
                city: true,
                status: true,
                updatedAt: true,
                addressKey: true,
            },
        }).catch(() => []),
    ]);

    const proposalCountBy: Record<string, number> = {};
    for (const row of proposalsByStatus) proposalCountBy[row.status] = row._count._all;
    const totalProposals = Object.values(proposalCountBy).reduce((a, b) => a + b, 0);

    const catalogTiles: Tile[] = [
        { label: "Financial defaults", href: "/tools/admin/settings/financial-defaults", description: "Interest rate, term, ADU type defaults" },
        { label: "Cities & timelines", href: "/tools/admin/settings/cities", description: "Per-city permit/build durations", badge: cityCount },
        { label: "Site work catalog", href: "/tools/admin/settings/site-work", description: "Categories + presets used in Step 3", badge: siteWorkCount },
        { label: "Discounts", href: "/tools/admin/settings/discounts", description: "Preset discount amounts", badge: discountCount },
        { label: "What's included", href: "/tools/admin/settings/inclusions", description: "Slide 4 inclusion rows", badge: inclusionCount },
        { label: "Tax topics", href: "/tools/admin/settings/tax-topics", description: "Slide 12 write-off checklist", badge: taxTopicCount },
        { label: "Slide order", href: "/tools/admin/settings/slide-order", description: "Default presenter slide sequence" },
        { label: "Payment milestones", href: "/tools/admin/settings/payment-milestones", description: "Balloon schedule templates", badge: milestoneCount },
    ];

    return (
        <div className={s.shell}>
            <header className={s.header}>
                <div>
                    <h1 className={s.title}>Admin <em>dashboard</em></h1>
                    <p className={s.subtitle}>All proposal, user, and catalog controls in one place.</p>
                </div>
                <Link href="/tools/admin/master" className={s.primaryAction}>
                    + New proposal
                </Link>
            </header>

            {/* ── Overview tiles ─────────────────────────────────────────────── */}
            <section className={s.statsGrid}>
                <StatCard
                    label="Proposals"
                    value={totalProposals}
                    href="/tools/admin/dashboard/proposals"
                    breakdown={[
                        ["Draft", proposalCountBy[ProposalStatus.DRAFT] ?? 0],
                        ["Reviewed", proposalCountBy[ProposalStatus.REVIEWED] ?? 0],
                        ["Sent", proposalCountBy[ProposalStatus.SENT] ?? 0],
                        ["Signed", proposalCountBy[ProposalStatus.SIGNED] ?? 0],
                    ]}
                />
                <Suspense fallback={<UserStatCardSkeleton />}>
                    <UserStatCard />
                </Suspense>
                <StatCard
                    label="Site work presets"
                    value={siteWorkCount}
                    href="/tools/admin/settings/site-work"
                />
                <StatCard
                    label="Active discounts"
                    value={discountCount}
                    href="/tools/admin/settings/discounts"
                />
            </section>

            {/* ── Catalogs section ───────────────────────────────────────────── */}
            <section className={s.section}>
                <h2 className={s.sectionTitle}>Catalogs</h2>
                <div className={s.tileGrid}>
                    {catalogTiles.map((t) => (
                        <Link key={t.href} href={t.href} className={s.tile}>
                            <div className={s.tileLabel}>{t.label}</div>
                            <div className={s.tileDesc}>{t.description}</div>
                            {t.badge !== undefined && <div className={s.tileBadge}>{t.badge}</div>}
                        </Link>
                    ))}
                </div>
            </section>

            {/* ── Recent proposals (Prisma, fast — renders inline) ───────────── */}
            <section className={s.section}>
                <div className={s.sectionHead}>
                    <h2 className={s.sectionTitle}>Recent proposals</h2>
                    <Link href="/tools/admin/dashboard/proposals" className={s.sectionLink}>View all →</Link>
                </div>
                {recentProposals.length === 0 ? (
                    <p className={s.empty}>No proposals yet. <Link href="/tools/admin/master">Create the first one</Link>.</p>
                ) : (
                    <ul className={s.list}>
                        {recentProposals.map((p) => {
                            const inner = (
                                <>
                                    <div className={s.listMain}>
                                        <strong>{p.customerName || "(no name)"}</strong>
                                        <span className={s.listMuted}>{[p.addressLine1, p.city].filter(Boolean).join(", ") || "(no address)"}</span>
                                    </div>
                                    <div className={s.listMeta}>
                                        <span className={`${s.statusPill} ${s[`status_${p.status}`] ?? ""}`}>{p.status}</span>
                                        <span className={s.listMuted}>{p.updatedAt.toLocaleDateString()}</span>
                                    </div>
                                </>
                            );
                            return (
                                <li key={p.id} className={s.listRow}>
                                    {p.addressKey ? (
                                        <Link
                                            href={`/tools/admin/master?address=${encodeURIComponent(p.addressKey)}`}
                                            className={s.listLink}
                                        >
                                            {inner}
                                        </Link>
                                    ) : (
                                        inner
                                    )}
                                    <ProposalRowMenu
                                        addressKey={p.addressKey}
                                        customerName={p.customerName}
                                        className={s.listRowMenu}
                                    />
                                </li>
                            );
                        })}
                    </ul>
                )}
            </section>

            {/* ── Recent users (Clerk-backed — streams in via Suspense) ──────── */}
            <section className={s.section}>
                <div className={s.sectionHead}>
                    <h2 className={s.sectionTitle}>Recent users</h2>
                    <Link href="/tools/admin/dashboard/users" className={s.sectionLink}>View all →</Link>
                </div>
                <Suspense fallback={<RecentUsersListSkeleton />}>
                    <RecentUsersList />
                </Suspense>
            </section>
        </div>
    );
}

// ── Suspense-wrapped async server components ───────────────────────────────

async function UserStatCard() {
    const users = await getMergedUsers().catch(() => []);
    const countBy: Record<string, number> = {};
    for (const u of users) countBy[u.role] = (countBy[u.role] ?? 0) + 1;
    return (
        <StatCard
            label="Users"
            value={users.length}
            href="/tools/admin/dashboard/users"
            breakdown={[
                ["Admin", countBy[Role.ADMIN] ?? 0],
                ["Architect", countBy[Role.ARCHITECT] ?? 0],
                ["Customer", countBy[Role.CUSTOMER] ?? 0],
            ]}
        />
    );
}

async function RecentUsersList() {
    const users = await getMergedUsers().catch(() => []);
    const recent = users.slice(0, 5);

    if (recent.length === 0) {
        return <p className={s.empty}>No users yet.</p>;
    }

    return (
        <ul className={s.list}>
            {recent.map((u) => {
                const name = [u.firstName, u.lastName].filter(Boolean).join(" ").trim();
                const primary = name || u.email || u.id;
                return (
                    <li key={u.id} className={s.listRow}>
                        <div className={s.listMain}>
                            <strong>{primary}</strong>
                            {name && u.email && <span className={s.listMuted}>{u.email}</span>}
                        </div>
                        <div className={s.listMeta}>
                            <span className={`${s.rolePill} ${s[`role_${u.role}`] ?? ""}`}>{u.role}</span>
                            <span className={s.listMuted}>
                                {u.lastSignInAt ? u.lastSignInAt.toLocaleDateString() : "never"}
                            </span>
                        </div>
                    </li>
                );
            })}
        </ul>
    );
}

// ── Static components + Suspense fallbacks ─────────────────────────────────

function StatCard({
    label,
    value,
    href,
    breakdown,
}: {
    label: string;
    value: number;
    href: string;
    breakdown?: [string, number][];
}) {
    return (
        <Link href={href} className={s.statCard}>
            <div className={s.statLabel}>{label}</div>
            <div className={s.statValue}>{value}</div>
            {breakdown && (
                <div className={s.statBreakdown}>
                    {breakdown.map(([k, v]) => (
                        <span key={k} className={s.statBreakItem}>
                            <span>{k}</span>
                            <strong>{v}</strong>
                        </span>
                    ))}
                </div>
            )}
        </Link>
    );
}

function UserStatCardSkeleton() {
    return (
        <div className={s.statCard}>
            <Skeleton width={50} height={11} radius={4} style={{ marginBottom: 10 }} />
            <Skeleton width={50} height={32} radius={6} style={{ marginBottom: 16 }} />
            <div style={{ display: "flex", gap: 12 }}>
                <Skeleton width={50} height={12} radius={4} />
                <Skeleton width={60} height={12} radius={4} />
                <Skeleton width={60} height={12} radius={4} />
            </div>
        </div>
    );
}

function RecentUsersListSkeleton() {
    return (
        <ul className={s.list}>
            {Array.from({ length: 4 }, (_, i) => (
                <li key={i} className={s.listRow}>
                    <div className={s.listMain}>
                        <Skeleton width={200} height={14} radius={4} />
                    </div>
                    <div className={s.listMeta}>
                        <Skeleton width={70} height={18} radius={10} />
                        <Skeleton width={64} height={11} radius={4} />
                    </div>
                </li>
            ))}
        </ul>
    );
}
