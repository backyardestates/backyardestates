"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import s from "./detail.module.css";

export interface ArchitectOption {
    id: string;
    email: string | null;
}

// Admin-facing: manually start a formal analysis for this engagement and jump
// straight into the architect's on-site tool. Lets the admin pick which
// architect it's assigned to (defaults to the engagement's current architect).
export function StartFpaButton({
    engagementId,
    architects,
    defaultArchitectId,
}: {
    engagementId: string;
    architects: ArchitectOption[];
    defaultArchitectId: string | null;
}) {
    const router = useRouter();
    const [open, setOpen] = useState(false);
    const [architectId, setArchitectId] = useState(defaultArchitectId ?? "");
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function start() {
        setBusy(true);
        setError(null);
        try {
            const res = await fetch("/api/architect/analyses", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ engagementId, architectId: architectId || null }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Failed to start analysis");
            router.push(`/tools/fpa/${data.analysisId}`);
        } catch (err) {
            setError(err instanceof Error ? err.message : String(err));
            setBusy(false);
        }
    }

    return (
        <>
            <button
                className={s.primaryAction}
                style={{ marginBottom: 12 }}
                onClick={() => setOpen(true)}
            >
                + Start formal analysis
            </button>

            {open && (
                <div className={s.overlay} onClick={() => !busy && setOpen(false)}>
                    <div className={s.modal} onClick={(e) => e.stopPropagation()}>
                        <h2 className={s.modalTitle}>Start a formal analysis</h2>
                        <p className={s.modalHint}>
                            Creates the on-site analysis and opens the architect tool. The
                            assigned architect is notified.
                        </p>

                        <div className={s.field}>
                            <label className={s.label} htmlFor="fpa-architect">
                                Assign to architect
                            </label>
                            <select
                                id="fpa-architect"
                                className={s.select}
                                value={architectId}
                                onChange={(e) => setArchitectId(e.target.value)}
                                disabled={busy}
                            >
                                <option value="">Unassigned (I&apos;ll fill it in)</option>
                                {architects.map((a) => (
                                    <option key={a.id} value={a.id}>
                                        {a.email || a.id}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {error && <p className={s.error}>{error}</p>}

                        <div className={s.modalActions}>
                            <button
                                className={s.btnGhost}
                                onClick={() => setOpen(false)}
                                disabled={busy}
                            >
                                Cancel
                            </button>
                            <button className={s.primaryAction} onClick={start} disabled={busy}>
                                {busy ? "Starting…" : "Start & open tool"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
