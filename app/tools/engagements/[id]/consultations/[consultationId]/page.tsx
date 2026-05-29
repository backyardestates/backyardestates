import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { guardPageAnyPermission, can } from "@/lib/rbac/getPermissions";
import { ensureProposalContext } from "@/lib/db/ensureProposalContext";
import { canAccessEngagement } from "@/lib/engagement/access";
import { EmailSender, AskBox } from "./ConsultationDetailClient";
import s from "../../detail.module.css";

export const dynamic = "force-dynamic";

interface ActionItem {
    task: string;
    owner: string;
    priority: string;
}
interface MarketingAction {
    title: string;
    detail: string;
    channel: string;
}
interface AiSummary {
    bulletPoints?: string[];
    actionItems?: ActionItem[];
    sentiment?: { overall: string; rationale: string };
    intent?: { readiness: string; primaryMotivation: string; concerns: string[] };
}

function parseEmailDraft(raw: string | null): { subject: string; body: string } | null {
    if (!raw) return null;
    try {
        const d = JSON.parse(raw);
        if (d && typeof d.subject === "string" && typeof d.body === "string") return d;
    } catch {
        /* not JSON — fall through */
    }
    return null;
}

// Consultation lifecycle → hero badge tone.
function statusBadgeClass(status: string, sent: boolean) {
    if (sent || status === "SENT" || status === "SUMMARIZED") return `${s.statusBadge} ${s.statusBadgeDone}`;
    if (status === "FAILED") return `${s.statusBadge} ${s.statusBadgeLost}`;
    return s.statusBadge;
}

export default async function ConsultationDetailPage({
    params,
}: {
    params: Promise<{ id: string; consultationId: string }>;
}) {
    await guardPageAnyPermission(
        ["engagements.view_own", "engagements.view_all"],
        "/tools/engagements",
    );
    const { userId, role } = await ensureProposalContext();
    const { id, consultationId } = await params;

    const consultation = await prisma.consultation.findUnique({
        where: { id: consultationId },
        include: {
            engagement: {
                select: {
                    id: true,
                    repId: true,
                    architectId: true,
                    customerName: true,
                    customerEmail: true,
                },
            },
        },
    });

    if (!consultation || consultation.engagementId !== id) notFound();
    if (
        !canAccessEngagement(consultation.engagement, userId, role) &&
        !(await can(role, "engagements.view_all"))
    ) {
        notFound();
    }

    const ai = (consultation.aiSummaryJson as AiSummary | null) ?? null;
    const bulletPoints = ai?.bulletPoints ?? [];
    const actionItems = ai?.actionItems ?? [];
    const sentiment = ai?.sentiment;
    const intent = ai?.intent;
    const email = parseEmailDraft(consultation.nextStepsEmailDraft);
    const marketing = (consultation.marketingSuggestionsJson as MarketingAction[] | null) ?? [];

    const hasNotes = consultation.status === "SUMMARIZED" || !!consultation.summary;
    const hasEmail = !!consultation.engagement.customerEmail;
    const hasTranscript = !!consultation.transcript?.trim();
    const alreadySent = consultation.status === "SENT" || !!consultation.sentAt;

    return (
        <div className={s.page}>
            <Link href={`/tools/engagements/${id}`} className={s.backLink}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M19 12H5M12 19l-7-7 7-7" />
                </svg>
                Back to engagement
            </Link>

            {/* ── Hero ─────────────────────────────────────────────────────── */}
            <header className={s.hero}>
                <div className={s.heroTop}>
                    <div>
                        <p className={s.eyebrow}>Consultation notes</p>
                        <h1 className={s.title}>
                            {consultation.engagement.customerName || "(no name)"}
                        </h1>
                        <p className={s.subtitle}>
                            {consultation.source} · {consultation.createdAt.toLocaleString()}
                            {consultation.sentAt &&
                                ` · email sent ${consultation.sentAt.toLocaleDateString()}`}
                        </p>
                    </div>
                    <span className={statusBadgeClass(consultation.status, alreadySent)}>
                        <span className={s.statusDot} />
                        {consultation.status}
                    </span>
                </div>
            </header>

            {!hasNotes ? (
                <section className={s.panel}>
                    <p className={s.empty} style={{ marginBottom: 14 }}>
                        {consultation.status === "FAILED"
                            ? "Analysis failed for this consultation. Record or paste it again to regenerate notes."
                            : "No AI notes have been generated for this consultation yet."}
                    </p>
                    <Link
                        className={s.primaryAction}
                        href={`/tools/engagements/${id}/consultation`}
                    >
                        Record / generate notes
                    </Link>
                </section>
            ) : (
                <div className={s.main}>
                    <section className={s.panel}>
                        <div className={s.panelHead}>
                            <h2 className={s.panelTitle}>Summary</h2>
                        </div>
                        <p className={s.lead}>{consultation.summary || "—"}</p>

                        {bulletPoints.length > 0 && (
                            <>
                                <p className={s.subhead}>Key points</p>
                                <ul className={s.aiList}>
                                    {bulletPoints.map((b, i) => (
                                        <li key={i}>{b}</li>
                                    ))}
                                </ul>
                            </>
                        )}
                    </section>

                    {actionItems.length > 0 && (
                        <section className={s.panel}>
                            <div className={s.panelHead}>
                                <h2 className={s.panelTitle}>Action items</h2>
                            </div>
                            {actionItems.map((a, i) => (
                                <div key={i} className={s.actionItem}>
                                    <span className={s.actionTask}>{a.task}</span>
                                    <span className={s.metaPill}>{a.owner}</span>
                                    <span className={s.metaPill}>{a.priority}</span>
                                </div>
                            ))}
                        </section>
                    )}

                    {(sentiment || intent) && (
                        <section className={s.panel}>
                            <div className={s.panelHead}>
                                <h2 className={s.panelTitle}>The read</h2>
                            </div>
                            <div className={s.pillRow}>
                                {sentiment && (
                                    <span className={s.metaPill}>sentiment: {sentiment.overall}</span>
                                )}
                                {intent && (
                                    <>
                                        <span className={s.metaPill}>
                                            readiness: {intent.readiness}
                                        </span>
                                        <span className={s.metaPill}>
                                            {intent.primaryMotivation}
                                        </span>
                                    </>
                                )}
                            </div>
                            {intent && intent.concerns.length > 0 && (
                                <p className={s.rowMuted} style={{ marginTop: 12 }}>
                                    Concerns: {intent.concerns.join("; ")}
                                </p>
                            )}
                        </section>
                    )}

                    {hasTranscript && <AskBox consultationId={consultation.id} />}

                    {email && (
                        <EmailSender
                            consultationId={consultation.id}
                            hasEmail={hasEmail}
                            alreadySent={alreadySent}
                            initialSubject={email.subject}
                            initialBody={email.body}
                        />
                    )}

                    {marketing.length > 0 && (
                        <section className={s.panel}>
                            <div className={s.panelHead}>
                                <h2 className={s.panelTitle}>Marketing follow-up ideas</h2>
                            </div>
                            <div className={s.mktGrid}>
                                {marketing.map((m, i) => (
                                    <div key={i} className={s.mktCard}>
                                        <div className={s.mktCardHead}>
                                            <span className={s.mktTitle}>{m.title}</span>
                                            <span className={s.mktChannel}>{m.channel}</span>
                                        </div>
                                        <div className={s.mktDetail}>{m.detail}</div>
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}
                </div>
            )}
        </div>
    );
}
