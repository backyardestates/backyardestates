import Link from "next/link";
import { notFound } from "next/navigation";
import { Role, EngagementStage } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { guardPageAnyPermission, can } from "@/lib/rbac/getPermissions";
import { ensureProposalContext } from "@/lib/db/ensureProposalContext";
import { STAGE_ORDER, stageLabel } from "@/lib/engagement/stage";
import { StageControl } from "./StageControl";
import { StartEstimateButton } from "./StartEstimateButton";
import { StartFpaButton } from "./StartFpaButton";
import { DripCancelButton } from "./DripCancelButton";
import { ResyncButton } from "./ResyncButton";
import s from "./detail.module.css";

export const dynamic = "force-dynamic";

interface Flag {
    label?: string;
    flagType?: string;
    flagNote?: string;
    estCostImpact?: number | null;
}
const FLAG_LABEL: Record<string, string> = {
    COST_ADDER: "Cost adder",
    CONCERN: "Concern",
    QUESTION: "Open question",
};
const flagToneClass = (type?: string) =>
    type === "COST_ADDER" ? s.tagCost : type === "QUESTION" ? s.tagQuestion : s.tagConcern;

const money = (n: number) =>
    n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

// Status → tag tone. Terminal/success states read gold/green; in-flight reads
// teal; not-yet-started reads muted.
function analysisTone(status: string) {
    if (status === "COMPLETE") return s.statusTagDone;
    if (status === "IN_PROGRESS") return s.statusTagGold;
    return s.statusTagMuted;
}
function proposalTone(status: string) {
    if (status === "SIGNED") return s.statusTagDone;
    if (status === "SENT" || status === "AGREEMENT_SENT") return s.statusTagGold;
    if (status === "DRAFT") return s.statusTagMuted;
    return s.statusTag;
}
function dripTone(status: string) {
    if (status === "ACTIVE") return s.statusTagDone;
    if (status === "SENT") return s.statusTagDone;
    return s.statusTagMuted;
}

const PinIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
        <circle cx="12" cy="10" r="3" />
    </svg>
);

export default async function EngagementDetailPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    await guardPageAnyPermission(
        ["engagements.view_own", "engagements.view_all"],
        "/tools/engagements",
    );
    const { userId, role } = await ensureProposalContext();
    const { id } = await params;

    // Select only what this page renders — the full rows carry large Json
    // blobs (consultation transcripts/AI summaries, FPA siteVisit/cityInfo,
    // drip message bodies) that made this query slow for active engagements.
    const engagement = await prisma.engagement.findUnique({
        where: { id },
        include: {
            consultations: {
                orderBy: { createdAt: "desc" },
                take: 50,
                select: { id: true, source: true, status: true, createdAt: true },
            },
            formalAnalyses: {
                orderBy: { createdAt: "desc" },
                take: 50,
                // flagsJson stays — the "Architect findings" panel + cost-adder
                // total below read it.
                select: { id: true, status: true, createdAt: true, flagsJson: true },
            },
            proposals: {
                orderBy: { updatedAt: "desc" },
                select: {
                    id: true,
                    status: true,
                    addressKey: true,
                    totalPrice: true,
                    updatedAt: true,
                    pdfUrl: true,
                    pdfGeneratedAt: true,
                },
            },
            dripEnrollments: {
                orderBy: { createdAt: "desc" },
                take: 1, // only the latest enrollment is rendered
                select: {
                    id: true,
                    status: true,
                    messages: {
                        orderBy: { stepIndex: "asc" },
                        select: {
                            id: true,
                            subject: true,
                            status: true,
                            sentAt: true,
                            scheduledFor: true,
                        },
                    },
                },
            },
            events: {
                orderBy: { createdAt: "desc" },
                take: 50,
                select: { id: true, message: true, type: true, createdAt: true },
            },
        },
    });

    if (!engagement) notFound();
    const visible =
        (await can(role, "engagements.view_all")) ||
        engagement.repId === userId ||
        engagement.architectId === userId;
    if (!visible) notFound();

    const address =
        [engagement.addressLine1, engagement.city, engagement.state, engagement.zip]
            .filter(Boolean)
            .join(", ") || "(no address yet)";

    const latestComplete = engagement.formalAnalyses.find((f) => f.status === "COMPLETE");
    const flags: Flag[] = Array.isArray(latestComplete?.flagsJson)
        ? (latestComplete!.flagsJson as Flag[])
        : [];
    const costTotal = flags
        .filter((f) => f.flagType === "COST_ADDER")
        .reduce((sum, f) => sum + (Number(f.estCostImpact) || 0), 0);

    const drip = engagement.dripEnrollments[0];
    const canConsult = await can(role, "consultation.run");
    const hasOpenAnalysis = engagement.formalAnalyses.some(
        (f) => f.status === "PENDING" || f.status === "IN_PROGRESS",
    );
    const canStartFpa = await can(role, "fpa.create");
    const architects = canStartFpa
        ? await prisma.user.findMany({
              where: { role: Role.ARCHITECT },
              orderBy: { createdAt: "asc" },
              select: { id: true, email: true },
          })
        : [];

    // Pipeline progress (LOST is terminal/off-pipeline).
    const isLost = engagement.stage === EngagementStage.LOST;
    const isSigned = engagement.stage === EngagementStage.SIGNED;
    const stageIdx = STAGE_ORDER.indexOf(engagement.stage);
    const totalSteps = STAGE_ORDER.length;
    const stepNum = stageIdx >= 0 ? stageIdx + 1 : 0;
    const progressPct = isLost ? 100 : stageIdx >= 0 ? Math.round((stepNum / totalSteps) * 100) : 0;

    const badgeClass = isSigned
        ? `${s.statusBadge} ${s.statusBadgeDone}`
        : isLost
          ? `${s.statusBadge} ${s.statusBadgeLost}`
          : s.statusBadge;

    return (
        <div className={s.page}>
            <Link href="/tools/engagements" className={s.backLink}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M19 12H5M12 19l-7-7 7-7" />
                </svg>
                All engagements
            </Link>

            {/* ── Hero ─────────────────────────────────────────────────────── */}
            <header className={s.hero}>
                <div className={s.heroTop}>
                    <div>
                        <p className={s.eyebrow}>Engagement</p>
                        <h1 className={s.title}>{engagement.customerName || "(no name)"}</h1>
                        <p className={s.subtitle}>
                            <PinIcon />
                            {address}
                        </p>
                    </div>
                    <span className={badgeClass}>
                        <span className={s.statusDot} />
                        {stageLabel(engagement.stage)}
                    </span>
                </div>

                <div className={s.heroProgress}>
                    <div className={s.progressMeta}>
                        <span className={s.progressStage}>
                            {isLost ? "Marked lost" : stageLabel(engagement.stage)}
                        </span>
                        <span className={s.progressStep}>
                            {isLost ? "Off pipeline" : `Step ${stepNum} of ${totalSteps}`}
                        </span>
                    </div>
                    <div className={s.progressTrack}>
                        <div
                            className={`${s.progressFill} ${isLost ? s.progressFillLost : ""}`}
                            style={{ width: `${progressPct}%` }}
                        />
                    </div>
                </div>
            </header>

            {/* ── KPI strip ────────────────────────────────────────────────── */}
            <div className={s.statStrip}>
                <div className={s.statCard}>
                    <p className={s.statLabel}>Consultations</p>
                    <div className={s.statValue}>{engagement.consultations.length}</div>
                    <span className={s.statSub}>recorded</span>
                </div>
                <div className={s.statCard}>
                    <p className={s.statLabel}>Formal analyses</p>
                    <div className={s.statValue}>{engagement.formalAnalyses.length}</div>
                    <span className={s.statSub}>{hasOpenAnalysis ? "1 in progress" : "on file"}</span>
                </div>
                <div className={s.statCard}>
                    <p className={s.statLabel}>Proposals</p>
                    <div className={s.statValue}>{engagement.proposals.length}</div>
                    <span className={s.statSub}>linked</span>
                </div>
                <div className={s.statCard}>
                    <p className={s.statLabel}>Cost-adders</p>
                    <div className={`${s.statValue} ${s.statValueGold}`}>{money(costTotal)}</div>
                    <span className={s.statSub}>from FPA flags</span>
                </div>
            </div>

            <div className={s.detailGrid}>
                {/* ── Left column: artifacts + timeline ───────────────────── */}
                <div className={s.main}>
                    <section className={s.panel}>
                        <div className={s.panelHead}>
                            <h2 className={s.panelTitle}>Consultations</h2>
                        </div>
                        {canConsult && (
                            <div className={s.panelActions}>
                                <Link
                                    href={`/tools/engagements/${engagement.id}/consultation`}
                                    className={s.primaryAction}
                                >
                                    + Record / generate notes
                                </Link>
                            </div>
                        )}
                        {engagement.consultations.length === 0 ? (
                            <p className={s.empty}>No consultation recorded yet.</p>
                        ) : (
                            <ul className={s.timeline}>
                                {engagement.consultations.map((c) => (
                                    <li key={c.id} className={s.timelineItem}>
                                        <div className={s.timelineRow}>
                                            <Link
                                                href={`/tools/engagements/${engagement.id}/consultations/${c.id}`}
                                                className={s.timelineType}
                                            >
                                                {c.source} · {c.status}
                                            </Link>
                                            <span className={s.timelineWhen}>
                                                {c.createdAt.toLocaleString()}
                                            </span>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </section>

                    <section className={s.panel}>
                        <div className={s.panelHead}>
                            <h2 className={s.panelTitle}>Formal analyses</h2>
                        </div>
                        {canStartFpa && !hasOpenAnalysis && (
                            <div className={s.panelActions}>
                                <StartFpaButton
                                    engagementId={engagement.id}
                                    architects={architects}
                                    defaultArchitectId={engagement.architectId}
                                />
                            </div>
                        )}
                        {engagement.formalAnalyses.length === 0 ? (
                            <p className={s.empty}>No formal analysis yet.</p>
                        ) : (
                            <ul className={s.timeline}>
                                {engagement.formalAnalyses.map((f) => (
                                    <li key={f.id} className={s.timelineItem}>
                                        <div className={s.timelineRow}>
                                            <Link href={`/tools/fpa/${f.id}`} className={s.timelineType}>
                                                Site analysis
                                            </Link>
                                            <span className={s.timelineWhen}>
                                                {f.createdAt.toLocaleString()}
                                            </span>
                                        </div>
                                        <div className={s.timelineMeta}>
                                            <span className={`${s.statusTag} ${analysisTone(f.status)}`}>
                                                {f.status.replace("_", " ")}
                                            </span>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </section>

                    {flags.length > 0 && (
                        <section className={s.panel}>
                            <div className={s.panelHead}>
                                <h2 className={s.panelTitle}>Architect findings</h2>
                            </div>
                            {costTotal > 0 && (
                                <p className={s.findingsTotal}>
                                    Cost-adders total <strong>{money(costTotal)}</strong>
                                </p>
                            )}
                            <div className={s.flagList}>
                                {flags.map((f, i) => (
                                    <div key={i} className={s.flagItem}>
                                        <span className={`${s.tag} ${flagToneClass(f.flagType)}`}>
                                            {FLAG_LABEL[f.flagType ?? ""] ?? "Flag"}
                                        </span>
                                        <span className={s.flagWhat}>{f.label || "(unlabeled)"}</span>
                                        {f.flagType === "COST_ADDER" && f.estCostImpact != null && (
                                            <span className={s.flagMoney}>
                                                {money(Number(f.estCostImpact))}
                                            </span>
                                        )}
                                        {f.flagNote && <p className={s.flagBody}>{f.flagNote}</p>}
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}

                    <section className={s.panel}>
                        <div className={s.panelHead}>
                            <h2 className={s.panelTitle}>Proposals</h2>
                        </div>
                        <div className={s.panelActions}>
                            <StartEstimateButton
                                engagementId={engagement.id}
                                addressKey={engagement.addressKey}
                            />
                        </div>
                        {engagement.proposals.length === 0 ? (
                            <p className={s.empty}>No proposal linked yet.</p>
                        ) : (
                            <ul className={s.timeline}>
                                {engagement.proposals.map((p) => (
                                    <li key={p.id} className={s.timelineItem}>
                                        <div className={s.timelineRow}>
                                            <span className={`${s.statusTag} ${proposalTone(p.status)}`}>
                                                {p.status.replace(/_/g, " ")}
                                            </span>
                                            <span className={s.timelineWhen}>
                                                {p.updatedAt.toLocaleString()}
                                            </span>
                                        </div>
                                        <div className={s.timelineMeta}>
                                            <Link
                                                className={s.chip}
                                                href={`/tools/admin/master?proposalId=${encodeURIComponent(
                                                    p.id,
                                                )}${
                                                    p.addressKey
                                                        ? `&address=${encodeURIComponent(p.addressKey)}`
                                                        : ""
                                                }`}
                                            >
                                                {p.status === "DRAFT" ? "Open draft" : "Edit"}
                                            </Link>
                                            <Link className={s.chip} href={`/present-v2/${p.id}`}>
                                                Present
                                            </Link>
                                            <Link
                                                className={s.chip}
                                                href={`/tools/admin/master/agreement/${p.id}`}
                                            >
                                                Agreement
                                            </Link>
                                            {p.pdfUrl && (
                                                <a
                                                    className={s.chip}
                                                    href={p.pdfUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    title={
                                                        p.pdfGeneratedAt
                                                            ? `Saved agreement PDF · ${p.pdfGeneratedAt.toLocaleDateString()}`
                                                            : "Saved agreement PDF"
                                                    }
                                                >
                                                    PDF
                                                    {p.pdfGeneratedAt
                                                        ? ` · ${p.pdfGeneratedAt.toLocaleDateString()}`
                                                        : ""}
                                                </a>
                                            )}
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </section>

                    {drip && (
                        <section className={s.panel}>
                            <div className={s.panelHead}>
                                <h2 className={s.panelTitle}>Follow-up drip</h2>
                                <span className={`${s.statusTag} ${dripTone(drip.status)}`}>
                                    {drip.status}
                                </span>
                            </div>
                            <ul className={s.timeline}>
                                {drip.messages.map((m) => (
                                    <li key={m.id} className={s.timelineItem}>
                                        <div className={s.timelineRow}>
                                            <span className={s.timelineType}>{m.subject}</span>
                                            <span className={s.timelineWhen}>
                                                {m.status === "SENT" && m.sentAt
                                                    ? `sent ${m.sentAt.toLocaleDateString()}`
                                                    : m.scheduledFor.toLocaleDateString()}
                                            </span>
                                        </div>
                                        <div className={s.timelineMeta}>
                                            <span className={`${s.statusTag} ${dripTone(m.status)}`}>
                                                {m.status}
                                            </span>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                            <div className={s.panelActions} style={{ marginTop: 14 }}>
                                <Link
                                    href={`/tools/engagements/${engagement.id}/drip`}
                                    className={s.primaryAction}
                                >
                                    Manage drip
                                </Link>
                                {drip.status === "ACTIVE" && (
                                    <DripCancelButton engagementId={engagement.id} />
                                )}
                            </div>
                        </section>
                    )}

                    <section className={s.panel}>
                        <div className={s.panelHead}>
                            <h2 className={s.panelTitle}>Activity</h2>
                        </div>
                        {engagement.events.length === 0 ? (
                            <p className={s.empty}>No activity yet.</p>
                        ) : (
                            <ul className={s.timeline}>
                                {engagement.events.map((ev) => (
                                    <li key={ev.id} className={s.timelineItem}>
                                        <div className={s.timelineRow}>
                                            <span className={s.timelineType}>
                                                {ev.message || ev.type}
                                            </span>
                                            <span className={s.timelineWhen}>
                                                {ev.createdAt.toLocaleString()}
                                            </span>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </section>
                </div>

                {/* ── Right column: stage control + customer ──────────────── */}
                <aside className={s.aside}>
                    <section className={s.panel}>
                        <div className={s.panelHead}>
                            <h2 className={s.panelTitle}>Move stage</h2>
                        </div>
                        <StageControl engagementId={engagement.id} currentStage={engagement.stage} />
                    </section>

                    <section className={s.panel}>
                        <div className={s.panelHead}>
                            <h2 className={s.panelTitle}>Customer</h2>
                        </div>
                        <div className={s.kv}>
                            <span className={s.kvLabel}>Email</span>
                            <span className={s.kvVal}>{engagement.customerEmail || "—"}</span>
                        </div>
                        <div className={s.kv}>
                            <span className={s.kvLabel}>Phone</span>
                            <span className={s.kvVal}>{engagement.customerPhone || "—"}</span>
                        </div>
                        <div className={s.kv}>
                            <span className={s.kvLabel}>Pipedrive person</span>
                            <span className={s.kvVal}>{engagement.pipedrivePersonId || "—"}</span>
                        </div>
                        <div className={s.kv}>
                            <span className={s.kvLabel}>Pipedrive deal</span>
                            <span className={s.kvVal}>{engagement.pipedriveDealId || "—"}</span>
                        </div>
                        {(engagement.pipedrivePersonId || engagement.pipedriveDealId) && (
                            <ResyncButton engagementId={engagement.id} />
                        )}
                    </section>
                </aside>
            </div>
        </div>
    );
}
