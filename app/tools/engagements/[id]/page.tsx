import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { guardPageAnyPermission, can } from "@/lib/rbac/getPermissions";
import { ensureProposalContext } from "@/lib/db/ensureProposalContext";
import { stageLabel } from "@/lib/engagement/stage";
import { StageControl } from "./StageControl";
import { StartEstimateButton } from "./StartEstimateButton";
import { DripCancelButton } from "./DripCancelButton";
import s from "../engagements.module.css";

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
const money = (n: number) =>
    n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

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

    const engagement = await prisma.engagement.findUnique({
        where: { id },
        include: {
            consultations: { orderBy: { createdAt: "desc" } },
            formalAnalyses: { orderBy: { createdAt: "desc" } },
            proposals: {
                orderBy: { updatedAt: "desc" },
                select: {
                    id: true,
                    status: true,
                    addressKey: true,
                    totalPrice: true,
                    updatedAt: true,
                },
            },
            dripEnrollments: {
                orderBy: { createdAt: "desc" },
                include: { messages: { orderBy: { stepIndex: "asc" } } },
            },
            events: { orderBy: { createdAt: "desc" }, take: 100 },
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

    return (
        <div className={s.shell}>
            <Link href="/tools/engagements" className={s.backLink}>
                ← All engagements
            </Link>

            <header className={s.header}>
                <div>
                    <h1 className={s.title}>{engagement.customerName || "(no name)"}</h1>
                    <p className={s.subtitle}>{address}</p>
                </div>
                <span className={s.stageBadge}>{stageLabel(engagement.stage)}</span>
            </header>

            <div className={s.detailGrid}>
                {/* ── Left column: artifacts + timeline ───────────────────── */}
                <div>
                    <section className={s.panel}>
                        <h2 className={s.panelTitle}>Consultations</h2>
                        {canConsult && (
                            <Link
                                href={`/tools/engagements/${engagement.id}/consultation`}
                                className={s.primaryAction}
                                style={{ marginBottom: 12 }}
                            >
                                + Record / generate notes
                            </Link>
                        )}
                        {engagement.consultations.length === 0 ? (
                            <p className={s.empty} style={{ marginTop: 12 }}>
                                No consultation recorded yet.
                            </p>
                        ) : (
                            <ul className={s.timeline}>
                                {engagement.consultations.map((c) => (
                                    <li key={c.id} className={s.timelineItem}>
                                        <span className={s.timelineType}>
                                            {c.source} · {c.status}
                                        </span>
                                        <span className={s.timelineWhen}>
                                            {c.createdAt.toLocaleString()}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </section>

                    <section className={s.panel}>
                        <h2 className={s.panelTitle}>Formal analyses</h2>
                        {engagement.formalAnalyses.length === 0 ? (
                            <p className={s.empty}>No formal analysis yet.</p>
                        ) : (
                            <ul className={s.timeline}>
                                {engagement.formalAnalyses.map((f) => (
                                    <li key={f.id} className={s.timelineItem}>
                                        <Link href={`/tools/fpa/${f.id}`}>
                                            <span className={s.timelineType}>{f.status}</span>
                                        </Link>
                                        <span className={s.timelineWhen}>
                                            {f.createdAt.toLocaleString()}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </section>

                    {flags.length > 0 && (
                        <section className={s.panel}>
                            <h2 className={s.panelTitle}>Architect findings</h2>
                            {costTotal > 0 && (
                                <p className={s.rowMuted}>
                                    Cost-adders total: <strong>{money(costTotal)}</strong>
                                </p>
                            )}
                            <ul className={s.timeline}>
                                {flags.map((f, i) => (
                                    <li key={i} className={s.timelineItem}>
                                        <span className={s.metaPill}>
                                            {FLAG_LABEL[f.flagType ?? ""] ?? "Flag"}
                                        </span>{" "}
                                        <span className={s.timelineType}>
                                            {f.label || "(unlabeled)"}
                                        </span>
                                        {f.flagType === "COST_ADDER" && f.estCostImpact != null && (
                                            <span className={s.rowMuted}>
                                                {" "}· {money(Number(f.estCostImpact))}
                                            </span>
                                        )}
                                        {f.flagNote && (
                                            <span className={s.rowMuted}> — {f.flagNote}</span>
                                        )}
                                    </li>
                                ))}
                            </ul>
                        </section>
                    )}

                    <section className={s.panel}>
                        <h2 className={s.panelTitle}>Proposals</h2>
                        <StartEstimateButton
                            engagementId={engagement.id}
                            addressKey={engagement.addressKey}
                            currentStage={engagement.stage}
                        />
                        {engagement.proposals.length === 0 ? (
                            <p className={s.empty}>No proposal linked yet.</p>
                        ) : (
                            <ul className={s.timeline}>
                                {engagement.proposals.map((p) => (
                                    <li key={p.id} className={s.timelineItem}>
                                        <span className={s.timelineType}>{p.status}</span>
                                        <span className={s.rowMeta} style={{ marginLeft: 12 }}>
                                            {p.addressKey && (
                                                <Link
                                                    className={s.chip}
                                                    href={`/tools/admin/master?address=${encodeURIComponent(
                                                        p.addressKey,
                                                    )}`}
                                                >
                                                    Edit
                                                </Link>
                                            )}
                                            <Link className={s.chip} href={`/present-v2/${p.id}`}>
                                                Present
                                            </Link>
                                            <Link
                                                className={s.chip}
                                                href={`/tools/admin/master/agreement/${p.id}`}
                                            >
                                                Agreement
                                            </Link>
                                        </span>
                                        <span className={s.timelineWhen}>
                                            {p.updatedAt.toLocaleString()}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </section>

                    {drip && (
                        <section className={s.panel}>
                            <h2 className={s.panelTitle}>Follow-up drip</h2>
                            <p className={s.rowMuted} style={{ marginBottom: 8 }}>
                                Status: {drip.status}
                            </p>
                            <ul className={s.timeline}>
                                {drip.messages.map((m) => (
                                    <li key={m.id} className={s.timelineItem}>
                                        <span className={s.timelineType}>{m.subject}</span>
                                        <span className={s.rowMeta} style={{ marginLeft: 12 }}>
                                            <span className={s.chip}>{m.status}</span>
                                        </span>
                                        <span className={s.timelineWhen}>
                                            {m.status === "SENT" && m.sentAt
                                                ? `sent ${m.sentAt.toLocaleDateString()}`
                                                : m.scheduledFor.toLocaleDateString()}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                            {drip.status === "ACTIVE" && (
                                <div style={{ marginTop: 10 }}>
                                    <DripCancelButton engagementId={engagement.id} />
                                </div>
                            )}
                        </section>
                    )}

                    <section className={s.panel}>
                        <h2 className={s.panelTitle}>Activity</h2>
                        {engagement.events.length === 0 ? (
                            <p className={s.empty}>No activity yet.</p>
                        ) : (
                            <ul className={s.timeline}>
                                {engagement.events.map((ev) => (
                                    <li key={ev.id} className={s.timelineItem}>
                                        <span className={s.timelineType}>
                                            {ev.message || ev.type}
                                        </span>
                                        <span className={s.timelineWhen}>
                                            {ev.createdAt.toLocaleString()}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </section>
                </div>

                {/* ── Right column: details + stage control ───────────────── */}
                <aside>
                    <section className={s.panel}>
                        <h2 className={s.panelTitle}>Move stage</h2>
                        <StageControl
                            engagementId={engagement.id}
                            currentStage={engagement.stage}
                        />
                    </section>

                    <section className={s.panel}>
                        <h2 className={s.panelTitle}>Customer</h2>
                        <div className={s.kv}>
                            <span className={s.kvLabel}>Email</span>
                            <span>{engagement.customerEmail || "—"}</span>
                        </div>
                        <div className={s.kv}>
                            <span className={s.kvLabel}>Phone</span>
                            <span>{engagement.customerPhone || "—"}</span>
                        </div>
                        <div className={s.kv}>
                            <span className={s.kvLabel}>Pipedrive person</span>
                            <span>{engagement.pipedrivePersonId || "—"}</span>
                        </div>
                        <div className={s.kv}>
                            <span className={s.kvLabel}>Pipedrive deal</span>
                            <span>{engagement.pipedriveDealId || "—"}</span>
                        </div>
                    </section>
                </aside>
            </div>
        </div>
    );
}
