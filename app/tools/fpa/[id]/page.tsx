import Link from "next/link";
import { notFound } from "next/navigation";
import { AnalysisStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { guardPageAnyPermission, can } from "@/lib/rbac/getPermissions";
import { ensureProposalContext } from "@/lib/db/ensureProposalContext";
import { FPA_TEMPLATE } from "@/lib/fpa/template";
import { FpaForm, type DiscoveryContext, type FlagEntry } from "./FpaForm";
import s from "../../engagements/engagements.module.css";

export const dynamic = "force-dynamic";

export default async function FpaDetailPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    await guardPageAnyPermission(
        ["fpa.view_assigned", "fpa.view_all", "fpa.fill"],
        "/tools/fpa",
    );
    const { userId, role } = await ensureProposalContext();
    const { id } = await params;

    const analysis = await prisma.formalAnalysis.findUnique({
        where: { id },
        include: {
            engagement: {
                select: {
                    id: true,
                    customerName: true,
                    customerEmail: true,
                    customerPhone: true,
                    addressLine1: true,
                    city: true,
                    state: true,
                    zip: true,
                },
            },
        },
    });

    if (!analysis) notFound();
    if (!(await can(role, "fpa.view_all")) && analysis.architectId !== userId) notFound();

    const consultation = analysis.engagement
        ? await prisma.consultation.findFirst({
              where: { engagementId: analysis.engagement.id },
              orderBy: { createdAt: "desc" },
              select: { summary: true, aiSummaryJson: true },
          })
        : null;

    const e = analysis.engagement;
    const address =
        [e?.addressLine1, e?.city, e?.state, e?.zip].filter(Boolean).join(", ") || "(no address)";
    const submitted = analysis.status === AnalysisStatus.COMPLETE;

    const ai = (consultation?.aiSummaryJson ?? null) as {
        bulletPoints?: string[];
        intent?: { primaryMotivation?: string; readiness?: string; concerns?: string[] };
    } | null;
    const discovery: DiscoveryContext = {
        summary: consultation?.summary ?? null,
        bulletPoints: ai?.bulletPoints ?? [],
        motivation: ai?.intent?.primaryMotivation ?? null,
        readiness: ai?.intent?.readiness ?? null,
        concerns: ai?.intent?.concerns ?? [],
    };

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

            <FpaForm
                analysisId={analysis.id}
                engagementId={e?.id ?? null}
                template={FPA_TEMPLATE}
                contact={{
                    name: e?.customerName ?? null,
                    email: e?.customerEmail ?? null,
                    phone: e?.customerPhone ?? null,
                    address,
                }}
                discovery={discovery}
                initialSiteVisit={(analysis.siteVisitJson as Record<string, unknown> | null) ?? {}}
                initialCityInfo={(analysis.cityInfoJson as Record<string, unknown> | null) ?? {}}
                initialFlags={(analysis.flagsJson as FlagEntry[] | null) ?? []}
                readOnly={submitted}
            />
        </div>
    );
}
