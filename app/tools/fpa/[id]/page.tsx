import Link from "next/link";
import { notFound } from "next/navigation";
import { Role, AnalysisStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { guardPageRole } from "@/lib/auth/guardPage";
import { ensureProposalContext } from "@/lib/db/ensureProposalContext";
import { listActiveWorkItemsByCategory } from "@/lib/db/workItems";
import { FpaForm, type InitialAnswer } from "./FpaForm";
import s from "../../engagements/engagements.module.css";

export const dynamic = "force-dynamic";

export default async function FpaDetailPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    await guardPageRole([Role.ADMIN, Role.ARCHITECT], "/tools/fpa");
    const { userId, role } = await ensureProposalContext();
    const { id } = await params;

    const analysis = await prisma.formalAnalysis.findUnique({
        where: { id },
        include: {
            engagement: {
                select: {
                    id: true,
                    customerName: true,
                    addressLine1: true,
                    city: true,
                    state: true,
                },
            },
            answers: {
                select: {
                    workItemId: true,
                    valueJson: true,
                    notes: true,
                    flagType: true,
                    flagNote: true,
                    estCostImpact: true,
                },
            },
        },
    });

    if (!analysis) notFound();
    if (role !== Role.ADMIN && analysis.architectId !== userId) notFound();

    const [categories, consultation] = await Promise.all([
        listActiveWorkItemsByCategory().catch(() => []),
        analysis.engagement
            ? prisma.consultation.findFirst({
                  where: { engagementId: analysis.engagement.id },
                  orderBy: { createdAt: "desc" },
                  select: { summary: true },
              })
            : null,
    ]);

    const initialAnswers: Record<string, InitialAnswer> = {};
    for (const a of analysis.answers) {
        const status = (a.valueJson as { status?: string } | null)?.status ?? "";
        initialAnswers[a.workItemId] = {
            status,
            notes: a.notes ?? "",
            flagType: a.flagType ?? "",
            flagNote: a.flagNote ?? "",
            estCostImpact: a.estCostImpact ?? null,
        };
    }

    const e = analysis.engagement;
    const address = [e?.addressLine1, e?.city, e?.state].filter(Boolean).join(", ") || "(no address)";
    const submitted = analysis.status === AnalysisStatus.COMPLETE;

    return (
        <div className={s.shell}>
            <Link href="/tools/fpa" className={s.backLink}>
                ← All analyses
            </Link>
            <header className={s.header}>
                <div>
                    <h1 className={s.title}>{e?.customerName || "(no name)"}</h1>
                    <p className={s.subtitle}>{address}</p>
                </div>
                <span className={s.stageBadge}>{submitted ? "Submitted" : "On-site analysis"}</span>
            </header>

            {consultation?.summary && (
                <section className={s.panel}>
                    <h2 className={s.panelTitle}>Consultation context</h2>
                    <p style={{ fontSize: 14, margin: 0 }}>{consultation.summary}</p>
                </section>
            )}

            <FpaForm
                analysisId={analysis.id}
                engagementId={e?.id ?? null}
                categories={categories}
                initialAnswers={initialAnswers}
                readOnly={submitted}
            />
        </div>
    );
}
