"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import s from "../engagements.module.css";

const STAGES: { value: string; label: string }[] = [
    { value: "CONSULTATION", label: "Office consultation" },
    { value: "NEXT_STEPS_SENT", label: "Next-steps email sent" },
    { value: "FPA_PAID", label: "Formal analysis paid" },
    { value: "FPA_SCHEDULED", label: "Formal analysis scheduled" },
    { value: "FPA_IN_PROGRESS", label: "Formal analysis in progress" },
    { value: "FPA_SUBMITTED", label: "Formal analysis submitted" },
    { value: "ESTIMATING", label: "Estimating" },
    { value: "PROPOSAL_DRAFT", label: "Proposal in draft" },
    { value: "PROPOSAL_SENT", label: "Proposal sent" },
    { value: "AGREEMENT_SENT", label: "Agreement sent" },
    { value: "SIGNED", label: "Agreement signed" },
    { value: "LOST", label: "Lost" },
];

export function StageControl({
    engagementId,
    currentStage,
}: {
    engagementId: string;
    currentStage: string;
}) {
    const router = useRouter();
    const [stage, setStage] = useState(currentStage);
    const [note, setNote] = useState("");
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function save() {
        if (stage === currentStage && !note.trim()) return;
        setSaving(true);
        setError(null);
        try {
            const res = await fetch(`/api/engagements/${engagementId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ toStage: stage, message: note.trim() || undefined }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Update failed");
            setNote("");
            router.refresh();
        } catch (err) {
            setError(err instanceof Error ? err.message : String(err));
        } finally {
            setSaving(false);
        }
    }

    return (
        <div>
            <select
                className={s.select}
                value={stage}
                onChange={(e) => setStage(e.target.value)}
                disabled={saving}
            >
                {STAGES.map((o) => (
                    <option key={o.value} value={o.value}>
                        {o.label}
                    </option>
                ))}
            </select>
            <input
                className={s.searchInput}
                placeholder="Optional note (posted to Pipedrive)…"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                disabled={saving}
                style={{ marginBottom: 10 }}
            />
            <button
                className={s.primaryAction}
                onClick={save}
                disabled={saving || (stage === currentStage && !note.trim())}
            >
                {saving ? "Updating…" : "Update stage"}
            </button>
            {error && <p className={s.error}>{error}</p>}
        </div>
    );
}
