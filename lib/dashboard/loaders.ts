import "server-only";
import {
    AnalysisStatus,
    ConsultationStatus,
    DripStatus,
    EngagementStage,
    ProposalStatus,
} from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { stageLabel } from "@/lib/engagement/stage";

/**
 * Server-only live data for the launchpad. One loader per dashboard section
 * `key` (see registry.ts). Each returns a glance count + a short "needs
 * attention" queue (and optional secondary stats). Loaders are functions, so
 * this module must never be imported by the client nav — `import "server-only"`
 * enforces that at build time.
 *
 * Scope mirrors the list pages: `view_all` permissions widen a query to the
 * whole org; otherwise it's filtered to the user's own assignments.
 */

export interface QueueItem {
    id: string;
    title: string;
    subtitle?: string;
    href: string;
    /** Small right-aligned text (a stage, status, or date). */
    meta?: string;
}

export interface SecondaryStat {
    label: string;
    value: number;
    href: string;
}

export interface GlanceResult {
    count: number;
    queue: QueueItem[];
    secondary?: SecondaryStat[];
}

export interface DashboardCtx {
    userId: string;
    organizationId: string;
    can: (key: string) => boolean;
}

const EMPTY: GlanceResult = { count: 0, queue: [] };

function addressOf(p: { addressLine1?: string | null; city?: string | null }): string {
    return [p.addressLine1, p.city].filter(Boolean).join(", ") || "(no address)";
}

async function engagements(ctx: DashboardCtx): Promise<GlanceResult> {
    const viewAll = ctx.can("engagements.view_all");
    const scope = viewAll ? {} : { OR: [{ repId: ctx.userId }, { architectId: ctx.userId }] };
    const where = {
        organizationId: ctx.organizationId,
        ...scope,
        stage: { notIn: [EngagementStage.SIGNED, EngagementStage.LOST] },
    };

    const [count, rows, consultCount, dripCount] = await Promise.all([
        prisma.engagement.count({ where }),
        prisma.engagement.findMany({
            where,
            orderBy: { updatedAt: "desc" },
            take: 4,
            select: { id: true, customerName: true, addressLine1: true, city: true, stage: true },
        }),
        ctx.can("consultation.run")
            ? prisma.consultation.count({
                  where: {
                      status: { not: ConsultationStatus.SENT },
                      engagement: { organizationId: ctx.organizationId, ...scope },
                  },
              })
            : Promise.resolve(0),
        ctx.can("drip.manage")
            ? prisma.dripEnrollment.count({
                  where: {
                      status: DripStatus.ACTIVE,
                      engagement: { organizationId: ctx.organizationId, ...scope },
                  },
              })
            : Promise.resolve(0),
    ]);

    const secondary: SecondaryStat[] = [];
    if (ctx.can("consultation.run"))
        secondary.push({ label: "Consults to run", value: consultCount, href: "/tools/engagements" });
    if (ctx.can("drip.manage"))
        secondary.push({ label: "Active drips", value: dripCount, href: "/tools/engagements" });

    return {
        count,
        queue: rows.map((e) => ({
            id: e.id,
            title: e.customerName || "(no name)",
            subtitle: addressOf(e),
            href: `/tools/engagements/${e.id}`,
            meta: stageLabel(e.stage),
        })),
        secondary,
    };
}

const FPA_STATUS_LABEL: Record<string, string> = {
    PENDING: "To do",
    IN_PROGRESS: "In progress",
    COMPLETE: "Submitted",
};

async function fpa(ctx: DashboardCtx): Promise<GlanceResult> {
    const viewAll = ctx.can("fpa.view_all");
    const where = {
        ...(viewAll ? {} : { architectId: ctx.userId }),
        status: { not: AnalysisStatus.COMPLETE },
    };

    const [count, rows] = await Promise.all([
        prisma.formalAnalysis.count({ where }),
        prisma.formalAnalysis.findMany({
            where,
            orderBy: [{ scheduledAt: "asc" }, { createdAt: "desc" }],
            take: 4,
            select: {
                id: true,
                status: true,
                scheduledAt: true,
                engagement: { select: { customerName: true, addressLine1: true, city: true } },
            },
        }),
    ]);

    return {
        count,
        queue: rows.map((a) => ({
            id: a.id,
            title: a.engagement?.customerName || "(no name)",
            subtitle: a.engagement ? addressOf(a.engagement) : "(no address)",
            href: `/tools/fpa/${a.id}`,
            meta: FPA_STATUS_LABEL[a.status] ?? a.status,
        })),
    };
}

async function proposals(ctx: DashboardCtx): Promise<GlanceResult> {
    const viewAll = ctx.can("proposals.view_all");
    const canEdit = ctx.can("proposals.edit");
    const where = {
        ...(viewAll ? {} : { createdById: ctx.userId }),
        status: { in: [ProposalStatus.DRAFT, ProposalStatus.REVIEWED, ProposalStatus.SENT] },
    };

    const [count, rows] = await Promise.all([
        prisma.proposal.count({ where }),
        prisma.proposal.findMany({
            where,
            orderBy: { updatedAt: "desc" },
            take: 4,
            select: {
                id: true,
                customerName: true,
                addressLine1: true,
                city: true,
                status: true,
                addressKey: true,
            },
        }),
    ]);

    return {
        count,
        queue: rows.map((p) => ({
            id: p.id,
            title: p.customerName || "(no name)",
            subtitle: addressOf(p),
            href:
                canEdit && p.addressKey
                    ? `/tools/admin/master?address=${encodeURIComponent(p.addressKey)}`
                    : "/tools/proposals",
            meta: p.status,
        })),
    };
}

export const SECTION_LOADERS: Record<string, (ctx: DashboardCtx) => Promise<GlanceResult>> = {
    engagements,
    fpa,
    proposals,
};

/** Run the loaders for the given visible section keys, guarded so one failure
 *  never blanks the page. Returns a map keyed by section key. */
export async function loadGlances(
    keys: string[],
    ctx: DashboardCtx,
): Promise<Record<string, GlanceResult>> {
    const withLoaders = keys.filter((k) => SECTION_LOADERS[k]);
    const results = await Promise.all(
        withLoaders.map((k) => SECTION_LOADERS[k](ctx).catch((): GlanceResult => EMPTY)),
    );
    const out: Record<string, GlanceResult> = {};
    withLoaders.forEach((k, i) => {
        out[k] = results[i];
    });
    return out;
}
