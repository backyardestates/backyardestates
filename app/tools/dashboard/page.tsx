import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, Inbox } from "lucide-react";
import { EngagementStage } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { ensureProposalContext } from "@/lib/db/ensureProposalContext";
import { getPermissions } from "@/lib/rbac/getPermissions";
import { stageLabel } from "@/lib/engagement/stage";
import { ROLE_LABELS } from "@/types/roles";
import {
    visibleSections,
    sectionByKey,
    hasAnyPermission,
    GROUP_ORDER,
    type DashboardSection,
} from "@/lib/dashboard/registry";
import { sectionIcon } from "@/lib/dashboard/icons";
import { loadGlances, type GlanceResult } from "@/lib/dashboard/loaders";
import { StartEngagement } from "../engagements/StartEngagement";
import { StartFpaFromDashboard, type ActiveEngagementOption } from "./StartFpaFromDashboard";
import s from "./dashboard.module.css";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
    const { userId, organizationId, role } = await ensureProposalContext();
    const perms = await getPermissions(role);
    const can = (k: string) => perms.has(k);

    const me = await prisma.user
        .findUnique({ where: { id: userId }, select: { email: true } })
        .catch(() => null);
    const email = me?.email ?? null;

    const tiles = visibleSections(perms).filter((sec) => sec.showAsTile);
    const glances = await loadGlances(
        tiles.map((t) => t.key),
        { userId, organizationId, can },
    );

    // Quick-action permissions + data.
    const canStartEngagement = can("engagements.start");
    const canStartFpa = can("fpa.create");

    // Active engagements to pick from when starting an FPA from the dashboard.
    const engScope = can("engagements.view_all")
        ? {}
        : { OR: [{ repId: userId }, { architectId: userId }] };
    const activeEngagements: ActiveEngagementOption[] = canStartFpa
        ? (
              await prisma.engagement
                  .findMany({
                      where: {
                          organizationId,
                          ...engScope,
                          stage: { notIn: [EngagementStage.SIGNED, EngagementStage.LOST] },
                      },
                      orderBy: { updatedAt: "desc" },
                      take: 50,
                      select: {
                          id: true,
                          customerName: true,
                          addressLine1: true,
                          city: true,
                          state: true,
                          stage: true,
                      },
                  })
                  .catch(() => [])
          ).map((e) => ({
              id: e.id,
              customerName: e.customerName || "(no name)",
              address: [e.addressLine1, e.city, e.state].filter(Boolean).join(", ") || "(no address)",
              stageLabel: stageLabel(e.stage),
          }))
        : [];

    // Proposals shared with this customer's email (admin-granted). Read-only
    // presentation only — never the internal builder, no internal costs.
    const sharedProposals = email
        ? await prisma.proposal
              .findMany({
                  where: {
                      customerEmail: { equals: email, mode: "insensitive" },
                      sharedWithCustomerAt: { not: null },
                  },
                  orderBy: { updatedAt: "desc" },
                  select: {
                      id: true,
                      shareToken: true,
                      customerName: true,
                      addressLine1: true,
                      city: true,
                      state: true,
                  },
              })
              .catch(() => [])
        : [];

    const greetName = email ? email.split("@")[0] : "there";
    const roleLabel = (ROLE_LABELS as Record<string, string>)[role] ?? role;
    const builderVisible = hasAnyPermission(perms, ["proposals.edit"]);
    const builderHref = sectionByKey("proposalBuilder")?.href ?? "/tools/admin/master";
    const isEmpty = tiles.length === 0 && sharedProposals.length === 0;

    return (
        <div className={s.page}>
            <header className={s.hero}>
                <div className={s.heroTop}>
                    <div>
                        <p className={s.eyebrow}>Dashboard</p>
                        <h1 className={s.title}>
                            Welcome back, <em>{greetName}</em>
                        </h1>
                        <p className={s.subtitle}>Jump straight to what needs you today.</p>
                    </div>
                    <span className={s.rolePill}>{roleLabel}</span>
                </div>
            </header>

            {GROUP_ORDER.map((group) => {
                const groupTiles = tiles.filter((t) => t.group === group);
                if (groupTiles.length === 0) return null;
                return (
                    <section key={group} className={s.group}>
                        <h2 className={s.groupTitle}>{group}</h2>
                        <div className={s.tileGrid}>
                            {groupTiles.map((sec) => {
                                let quickAction: ReactNode = null;
                                if (sec.key === "engagements" && canStartEngagement) {
                                    quickAction = (
                                        <StartEngagement
                                            label="Start new engagement"
                                            className={s.primaryAction}
                                        />
                                    );
                                } else if (sec.key === "fpa" && canStartFpa) {
                                    quickAction = (
                                        <StartFpaFromDashboard
                                            engagements={activeEngagements}
                                            allowNewEngagement={canStartEngagement}
                                            label="Start new Formal Property Analysis"
                                            className={s.primaryAction}
                                        />
                                    );
                                } else if (sec.key === "proposals" && builderVisible) {
                                    quickAction = (
                                        <Link href={builderHref} className={s.primaryAction}>
                                            + New proposal
                                        </Link>
                                    );
                                }
                                return (
                                    <Tile
                                        key={sec.key}
                                        section={sec}
                                        glance={glances[sec.key]}
                                        quickAction={quickAction}
                                    />
                                );
                            })}
                        </div>
                    </section>
                );
            })}

            {sharedProposals.length > 0 && (
                <section className={s.group}>
                    <h2 className={s.groupTitle}>Your proposal</h2>
                    <div className={s.tileGrid}>
                        {sharedProposals.map((p) => {
                            const addr =
                                [p.addressLine1, p.city, p.state].filter(Boolean).join(", ") ||
                                "Your ADU proposal";
                            return (
                                <article key={p.id} className={s.tile}>
                                    <div className={s.tileHead}>
                                        <span className={`${s.tileIcon} ${s.tileIconGold}`}>
                                            <ArrowUpRight size={20} strokeWidth={1.75} />
                                        </span>
                                        <div className={s.tileHeadText}>
                                            <h3 className={s.tileTitle}>{p.customerName || "Your proposal"}</h3>
                                            <p className={s.tileBlurb}>{addr}</p>
                                        </div>
                                    </div>
                                    <div className={s.tileFoot}>
                                        <Link
                                            href={`/present-v2/${p.shareToken ?? p.id}`}
                                            className={s.primaryAction}
                                        >
                                            View presentation <ArrowRight size={15} strokeWidth={2} />
                                        </Link>
                                    </div>
                                </article>
                            );
                        })}
                    </div>
                </section>
            )}

            {isEmpty && (
                <div className={s.welcome}>
                    <span className={s.welcomeIcon}>
                        <Inbox size={28} strokeWidth={1.5} />
                    </span>
                    <h2 className={s.welcomeTitle}>Welcome to Backyard Estates</h2>
                    <p className={s.welcomeText}>
                        Your tools will appear here as access is granted. If you&apos;re expecting a
                        proposal, your project lead will share it with you shortly.
                    </p>
                </div>
            )}
        </div>
    );
}

function Tile({
    section,
    glance,
    quickAction,
}: {
    section: DashboardSection;
    glance: GlanceResult | undefined;
    quickAction?: ReactNode;
}) {
    const Icon = sectionIcon(section.icon);
    const count = glance?.count ?? 0;
    const queue = glance?.queue ?? [];
    const secondary = glance?.secondary ?? [];

    return (
        <article className={s.tile}>
            <div className={s.tileHead}>
                <span className={s.tileIcon}>
                    <Icon size={20} strokeWidth={1.75} />
                </span>
                <div className={s.tileHeadText}>
                    <h3 className={s.tileTitle}>{section.label}</h3>
                    <p className={s.tileBlurb}>{section.blurb}</p>
                </div>
                {count > 0 && (
                    <span className={s.countBadge} aria-label={`${count} need attention`}>
                        {count}
                    </span>
                )}
            </div>

            {queue.length > 0 && (
                <ul className={s.queue}>
                    {queue.map((item) => (
                        <li key={item.id}>
                            <Link href={item.href} className={s.queueRow}>
                                <span className={s.queueMain}>
                                    <span className={s.queueTitle}>{item.title}</span>
                                    {item.subtitle && (
                                        <span className={s.queueSub}>{item.subtitle}</span>
                                    )}
                                </span>
                                {item.meta && <span className={s.queueMeta}>{item.meta}</span>}
                            </Link>
                        </li>
                    ))}
                </ul>
            )}

            {secondary.length > 0 && (
                <div className={s.secondaryRow}>
                    {secondary.map((stat) => (
                        <Link key={stat.label} href={stat.href} className={s.secondaryChip}>
                            <span className={s.secondaryValue}>{stat.value}</span>
                            <span className={s.secondaryLabel}>{stat.label}</span>
                        </Link>
                    ))}
                </div>
            )}

            <div className={s.tileFoot}>
                {quickAction}
                <Link href={section.href} className={s.tileOpen}>
                    Open {section.label} <ArrowRight size={15} strokeWidth={2} />
                </Link>
            </div>
        </article>
    );
}
