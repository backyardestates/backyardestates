import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { guardPageAnyPermission, can } from "@/lib/rbac/getPermissions";
import { ensureProposalContext } from "@/lib/db/ensureProposalContext";
import { canAccessEngagement } from "@/lib/engagement/access";
import { EmailSender, AskBox } from "./ConsultationDetailClient";
import s from "../../../engagements.module.css";

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
        <div className={s.shell}>
            <Link href={`/tools/engagements/${id}`} className={s.backLink}>
                ← Back to engagement
            </Link>

            <header className={s.header}>
                <div>
                    <h1 className={s.title}>Consultation notes</h1>
                    <p className={s.subtitle}>
                        {consultation.engagement.customerName || "(no name)"} ·{" "}
                        {consultation.source} · {consultation.status} ·{" "}
                        {consultation.createdAt.toLocaleString()}
                        {consultation.sentAt &&
                            ` · email sent ${consultation.sentAt.toLocaleDateString()}`}
                    </p>
                </div>
            </header>

            {!hasNotes ? (
                <section className={s.panel}>
                    <p className={s.empty}>
                        {consultation.status === "FAILED"
                            ? "Analysis failed for this consultation. Record or paste it again to regenerate notes."
                            : "No AI notes have been generated for this consultation yet."}
                    </p>
                    <Link
                        className={s.primaryAction}
                        href={`/tools/engagements/${id}/consultation`}
                        style={{ marginTop: 12 }}
                    >
                        Record / generate notes
                    </Link>
                </section>
            ) : (
                <>
                    <section className={s.panel}>
                        <h2 className={s.panelTitle}>Summary</h2>
                        <p style={{ fontSize: 14, margin: 0 }}>
                            {consultation.summary || "—"}
                        </p>

                        {bulletPoints.length > 0 && (
                            <>
                                <h2 className={s.panelTitle} style={{ marginTop: 16 }}>
                                    Key points
                                </h2>
                                <ul className={s.aiList}>
                                    {bulletPoints.map((b, i) => (
                                        <li key={i}>{b}</li>
                                    ))}
                                </ul>
                            </>
                        )}

                        {actionItems.length > 0 && (
                            <>
                                <h2 className={s.panelTitle}>Action items</h2>
                                <ul className={s.aiList}>
                                    {actionItems.map((a, i) => (
                                        <li key={i}>
                                            {a.task} <span className={s.metaPill}>{a.owner}</span>{" "}
                                            <span className={s.metaPill}>{a.priority}</span>
                                        </li>
                                    ))}
                                </ul>
                            </>
                        )}

                        {(sentiment || intent) && (
                            <>
                                <h2 className={s.panelTitle}>Read</h2>
                                <div className={s.pillRow}>
                                    {sentiment && (
                                        <span className={s.metaPill}>
                                            sentiment: {sentiment.overall}
                                        </span>
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
                                    <p className={s.rowMuted}>
                                        Concerns: {intent.concerns.join("; ")}
                                    </p>
                                )}
                            </>
                        )}
                    </section>

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
                            <h2 className={s.panelTitle}>Marketing follow-up ideas</h2>
                            {marketing.map((m, i) => (
                                <div key={i} className={s.mktCard}>
                                    <div>
                                        <span className={s.mktTitle}>{m.title}</span>
                                        <span className={s.mktChannel}>{m.channel}</span>
                                    </div>
                                    <div className={s.mktDetail}>{m.detail}</div>
                                </div>
                            ))}
                        </section>
                    )}
                </>
            )}
        </div>
    );
}
