import Link from "next/link";
import { EngagementStage, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { guardPageAnyPermission, can } from "@/lib/rbac/getPermissions";
import { ensureProposalContext } from "@/lib/db/ensureProposalContext";
import { STAGE_ORDER, stageLabel } from "@/lib/engagement/stage";
import { StartEngagement } from "./StartEngagement";
import s from "./engagements.module.css";

export const dynamic = "force-dynamic";

type EngagementRow = Prisma.EngagementGetPayload<{
    include: {
        _count: {
            select: { consultations: true; formalAnalyses: true; proposals: true };
        };
    };
}>;

export default async function EngagementsPage() {
    await guardPageAnyPermission(
        ["engagements.view_own", "engagements.view_all"],
        "/tools/engagements",
    );
    const { userId, organizationId, role } = await ensureProposalContext();
    const viewAll = await can(role, "engagements.view_all");

    const engagements = await prisma.engagement
        .findMany({
            where: {
                organizationId,
                ...(viewAll ? {} : { OR: [{ repId: userId }, { architectId: userId }] }),
            },
            orderBy: { updatedAt: "desc" },
            include: {
                _count: {
                    select: { consultations: true, formalAnalyses: true, proposals: true },
                },
            },
        })
        .catch((): EngagementRow[] => []);

    // Group by stage, preserving the pipeline order (+ LOST at the end).
    const orderedStages: EngagementStage[] = [...STAGE_ORDER, EngagementStage.LOST];
    const byStage = new Map<EngagementStage, typeof engagements>();
    for (const stage of orderedStages) byStage.set(stage, []);
    for (const e of engagements) {
        byStage.get(e.stage)?.push(e);
    }

    return (
        <div className={s.shell}>
            <header className={s.header}>
                <div>
                    <h1 className={s.title}>Engagements</h1>
                    <p className={s.subtitle}>
                        Every prospect from office consultation through to a signed agreement.
                    </p>
                </div>
                <StartEngagement />
            </header>

            {engagements.length === 0 ? (
                <p className={s.empty}>
                    No engagements yet. Click “Start engagement” to pull a prospect from
                    Pipedrive.
                </p>
            ) : (
                <div className={s.board}>
                    {orderedStages
                        .filter((stage) => (byStage.get(stage)?.length ?? 0) > 0)
                        .map((stage) => {
                            const items = byStage.get(stage) ?? [];
                            return (
                                <section key={stage} className={s.stageGroup}>
                                    <div className={s.stageHead}>
                                        <span className={s.stageName}>{stageLabel(stage)}</span>
                                        <span className={s.stageCount}>{items.length}</span>
                                    </div>
                                    <ul className={s.rows}>
                                        {items.map((e) => (
                                            <li key={e.id}>
                                                <Link
                                                    href={`/tools/engagements/${e.id}`}
                                                    className={s.row}
                                                >
                                                    <span className={s.rowMain}>
                                                        <span className={s.rowName}>
                                                            {e.customerName || "(no name)"}
                                                        </span>
                                                        <span className={s.rowMuted}>
                                                            {[e.addressLine1, e.city]
                                                                .filter(Boolean)
                                                                .join(", ") || "(no address)"}
                                                        </span>
                                                    </span>
                                                    <span className={s.rowMeta}>
                                                        {e._count.consultations > 0 && (
                                                            <span className={s.chip}>
                                                                {e._count.consultations} consult
                                                            </span>
                                                        )}
                                                        {e._count.proposals > 0 && (
                                                            <span className={s.chip}>
                                                                {e._count.proposals} proposal
                                                            </span>
                                                        )}
                                                        <span>
                                                            {e.updatedAt.toLocaleDateString()}
                                                        </span>
                                                    </span>
                                                </Link>
                                            </li>
                                        ))}
                                    </ul>
                                </section>
                            );
                        })}
                </div>
            )}
        </div>
    );
}
