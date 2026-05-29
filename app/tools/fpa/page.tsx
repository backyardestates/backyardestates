import Link from "next/link";
import { AnalysisStatus, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { guardPageAnyPermission, can } from "@/lib/rbac/getPermissions";
import { ensureProposalContext } from "@/lib/db/ensureProposalContext";
import s from "../engagements/engagements.module.css";

export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<string, string> = {
    PENDING: "To do",
    IN_PROGRESS: "In progress",
    COMPLETE: "Submitted",
};

type AnalysisRow = Prisma.FormalAnalysisGetPayload<{
    include: {
        engagement: {
            select: { id: true; customerName: true; addressLine1: true; city: true };
        };
    };
}>;

export default async function FpaListPage() {
    await guardPageAnyPermission(["fpa.view_assigned", "fpa.view_all"], "/tools/fpa");
    const { userId, role } = await ensureProposalContext();
    const viewAll = await can(role, "fpa.view_all");

    const analyses = await prisma.formalAnalysis
        .findMany({
            where: viewAll ? {} : { architectId: userId },
            orderBy: [{ status: "asc" }, { scheduledAt: "asc" }, { createdAt: "desc" }],
            include: {
                engagement: {
                    select: { id: true, customerName: true, addressLine1: true, city: true },
                },
            },
        })
        .catch((): AnalysisRow[] => []);

    const open = analyses.filter((a) => a.status !== AnalysisStatus.COMPLETE);
    const done = analyses.filter((a) => a.status === AnalysisStatus.COMPLETE);

    return (
        <div className={s.shell}>
            <header className={s.header}>
                <div>
                    <h1 className={s.title}>Formal property analyses</h1>
                    <p className={s.subtitle}>
                        On-site assessments assigned to you — fill in findings and flag anything
                        that adds cost, raises a concern, or needs an answer before a proposal.
                    </p>
                </div>
            </header>

            {analyses.length === 0 ? (
                <p className={s.empty}>No analyses assigned yet.</p>
            ) : (
                <div className={s.board}>
                    {[
                        { title: "Open", items: open },
                        { title: "Submitted", items: done },
                    ]
                        .filter((g) => g.items.length > 0)
                        .map((g) => (
                            <section key={g.title} className={s.stageGroup}>
                                <div className={s.stageHead}>
                                    <span className={s.stageName}>{g.title}</span>
                                    <span className={s.stageCount}>{g.items.length}</span>
                                </div>
                                <ul className={s.rows}>
                                    {g.items.map((a) => (
                                        <li key={a.id}>
                                            <Link href={`/tools/fpa/${a.id}`} className={s.row}>
                                                <span className={s.rowMain}>
                                                    <span className={s.rowName}>
                                                        {a.engagement?.customerName || "(no name)"}
                                                    </span>
                                                    <span className={s.rowMuted}>
                                                        {[a.engagement?.addressLine1, a.engagement?.city]
                                                            .filter(Boolean)
                                                            .join(", ") || "(no address)"}
                                                    </span>
                                                </span>
                                                <span className={s.rowMeta}>
                                                    <span className={s.chip}>
                                                        {STATUS_LABEL[a.status] ?? a.status}
                                                    </span>
                                                    {a.scheduledAt && (
                                                        <span>{a.scheduledAt.toLocaleDateString()}</span>
                                                    )}
                                                </span>
                                            </Link>
                                        </li>
                                    ))}
                                </ul>
                            </section>
                        ))}
                </div>
            )}
        </div>
    );
}
