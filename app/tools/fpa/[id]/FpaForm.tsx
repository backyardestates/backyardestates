"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import s from "../../engagements/engagements.module.css";

export interface InitialAnswer {
    status: string;
    notes: string;
    flagType: string;
    flagNote: string;
    estCostImpact: number | null;
}

interface WorkItemDTO {
    id: string;
    title: string;
    overview: string | null;
    whyItMatters: string | null;
}
interface CategoryDTO {
    id: string;
    name: string;
    workItems: WorkItemDTO[];
}

const STATUS_OPTIONS = [
    { value: "", label: "—" },
    { value: "ok", label: "OK / not present" },
    { value: "attention", label: "Needs attention" },
    { value: "na", label: "N/A" },
];

const FLAG_OPTIONS = [
    { value: "", label: "No flag" },
    { value: "COST_ADDER", label: "Cost adder" },
    { value: "CONCERN", label: "Concern" },
    { value: "QUESTION", label: "Open question" },
];

const EMPTY: InitialAnswer = {
    status: "",
    notes: "",
    flagType: "",
    flagNote: "",
    estCostImpact: null,
};

export function FpaForm({
    analysisId,
    engagementId,
    categories,
    initialAnswers,
    readOnly,
}: {
    analysisId: string;
    engagementId: string | null;
    categories: CategoryDTO[];
    initialAnswers: Record<string, InitialAnswer>;
    readOnly: boolean;
}) {
    const router = useRouter();
    const [answers, setAnswers] = useState<Record<string, InitialAnswer>>(initialAnswers);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [savedAt, setSavedAt] = useState<string | null>(null);

    function update(workItemId: string, patch: Partial<InitialAnswer>) {
        setAnswers((prev) => ({
            ...prev,
            [workItemId]: { ...(prev[workItemId] ?? EMPTY), ...patch },
        }));
    }

    function touched(a: InitialAnswer): boolean {
        return !!(a.status || a.notes.trim() || a.flagType || a.flagNote.trim() || a.estCostImpact != null);
    }

    function payloadAnswers() {
        return Object.entries(answers)
            .filter(([, a]) => touched(a))
            .map(([workItemId, a]) => ({
                workItemId,
                status: a.status || undefined,
                notes: a.notes || undefined,
                flagType: a.flagType || null,
                flagNote: a.flagNote || undefined,
                estCostImpact: a.flagType === "COST_ADDER" ? a.estCostImpact : null,
            }));
    }

    async function save(): Promise<boolean> {
        setError(null);
        const res = await fetch(`/api/architect/analyses/${analysisId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ answers: payloadAnswers() }),
        });
        const data = await res.json();
        if (!res.ok) {
            setError(data.error || "Save failed");
            return false;
        }
        setSavedAt(new Date().toLocaleTimeString());
        return true;
    }

    async function onSave() {
        setBusy(true);
        await save();
        setBusy(false);
    }

    async function onSubmit() {
        if (!window.confirm("Submit this analysis? The sales team will be notified and you won't be able to edit it after.")) {
            return;
        }
        setBusy(true);
        setError(null);
        try {
            if (!(await save())) {
                setBusy(false);
                return;
            }
            const res = await fetch(`/api/architect/analyses/${analysisId}/submit`, {
                method: "POST",
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Submit failed");
            if (engagementId) router.push(`/tools/engagements/${engagementId}`);
            else router.push("/tools/fpa");
        } catch (err) {
            setError(err instanceof Error ? err.message : String(err));
            setBusy(false);
        }
    }

    if (categories.length === 0) {
        return (
            <section className={s.panel}>
                <p className={s.empty}>
                    No work-item catalog found. Seed the work items first (admin → work items).
                </p>
            </section>
        );
    }

    return (
        <div>
            {categories
                .filter((c) => c.workItems.length > 0)
                .map((cat) => (
                    <section key={cat.id} className={s.panel}>
                        <h2 className={s.panelTitle}>{cat.name}</h2>
                        {cat.workItems.map((wi) => {
                            const a = answers[wi.id] ?? EMPTY;
                            return (
                                <div key={wi.id} className={s.mktCard}>
                                    <div className={s.mktTitle}>{wi.title}</div>
                                    {wi.overview && <div className={s.mktDetail}>{wi.overview}</div>}

                                    <div className={s.field} style={{ marginTop: 8 }}>
                                        <label className={s.label}>Finding</label>
                                        <select
                                            className={s.select}
                                            value={a.status}
                                            disabled={readOnly}
                                            onChange={(e) => update(wi.id, { status: e.target.value })}
                                        >
                                            {STATUS_OPTIONS.map((o) => (
                                                <option key={o.value} value={o.value}>{o.label}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className={s.field}>
                                        <label className={s.label}>Notes</label>
                                        <textarea
                                            className={s.textarea}
                                            style={{ minHeight: 70 }}
                                            value={a.notes}
                                            disabled={readOnly}
                                            onChange={(e) => update(wi.id, { notes: e.target.value })}
                                        />
                                    </div>

                                    <div className={s.field}>
                                        <label className={s.label}>Flag</label>
                                        <select
                                            className={s.select}
                                            value={a.flagType}
                                            disabled={readOnly}
                                            onChange={(e) => update(wi.id, { flagType: e.target.value })}
                                        >
                                            {FLAG_OPTIONS.map((o) => (
                                                <option key={o.value} value={o.value}>{o.label}</option>
                                            ))}
                                        </select>
                                    </div>

                                    {a.flagType === "COST_ADDER" && (
                                        <div className={s.field}>
                                            <label className={s.label}>Estimated cost impact ($)</label>
                                            <input
                                                className={s.input}
                                                type="number"
                                                value={a.estCostImpact ?? ""}
                                                disabled={readOnly}
                                                onChange={(e) =>
                                                    update(wi.id, {
                                                        estCostImpact: e.target.value === "" ? null : Number(e.target.value),
                                                    })
                                                }
                                            />
                                        </div>
                                    )}

                                    {a.flagType && (
                                        <div className={s.field}>
                                            <label className={s.label}>Flag note</label>
                                            <input
                                                className={s.input}
                                                value={a.flagNote}
                                                disabled={readOnly}
                                                onChange={(e) => update(wi.id, { flagNote: e.target.value })}
                                            />
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </section>
                ))}

            {!readOnly && (
                <section className={s.panel}>
                    <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                        <button className={s.btnGhost} onClick={onSave} disabled={busy}>
                            {busy ? "Saving…" : "Save progress"}
                        </button>
                        <button className={s.primaryAction} onClick={onSubmit} disabled={busy}>
                            Submit analysis
                        </button>
                        {savedAt && <span className={s.rowMuted}>Saved {savedAt}</span>}
                    </div>
                    {error && <p className={s.error}>{error}</p>}
                </section>
            )}
        </div>
    );
}
