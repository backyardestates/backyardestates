"use client";

import { useCallback, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import s from "../engagements/engagements.module.css";

// Type-only — erased at compile time so the route's server code never lands in
// the client bundle.
import type {
    PipedriveSearchResult,
    PipedriveSearchPerson,
    PipedriveSearchDeal,
} from "@/app/api/pipedrive/search/route";

export interface ActiveEngagementOption {
    id: string;
    customerName: string;
    address: string;
    stageLabel: string;
}

/**
 * Dashboard quick-action: start a formal property analysis without first
 * navigating into an engagement. Two modes:
 *   • "pick" — choose from a breakdown of the user's active engagements and
 *     start the FPA on it in one click.
 *   • "new"  — search Pipedrive, create a fresh engagement, then chain straight
 *     into a new FPA on it (only offered when the user can start engagements).
 * Both land in the architect on-site tool (/tools/fpa/[id]). The analysis API
 * defaults the architect to the engagement's current architect (or unassigned).
 */
export function StartFpaFromDashboard({
    engagements,
    allowNewEngagement = false,
    label = "Start new Formal Property Analysis",
    className,
}: {
    engagements: ActiveEngagementOption[];
    allowNewEngagement?: boolean;
    label?: string;
    className?: string;
}) {
    const router = useRouter();
    const [open, setOpen] = useState(false);
    const [view, setView] = useState<"pick" | "new">("pick");
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Pipedrive search state (used only in "new" mode).
    const [q, setQ] = useState("");
    const [results, setResults] = useState<PipedriveSearchResult[]>([]);
    const [searching, setSearching] = useState(false);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    function close() {
        if (busy) return;
        setOpen(false);
        setView("pick");
        setError(null);
        setQ("");
        setResults([]);
    }

    async function createAnalysis(engagementId: string): Promise<void> {
        const res = await fetch("/api/architect/analyses", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ engagementId }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to start analysis");
        router.push(`/tools/fpa/${data.analysisId}`);
    }

    async function startOnExisting(engagementId: string) {
        setBusy(true);
        setError(null);
        try {
            await createAnalysis(engagementId);
        } catch (err) {
            setError(err instanceof Error ? err.message : String(err));
            setBusy(false);
        }
    }

    const runSearch = useCallback((term: string) => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        if (term.trim().length < 2) {
            setResults([]);
            return;
        }
        debounceRef.current = setTimeout(async () => {
            setSearching(true);
            setError(null);
            try {
                const res = await fetch(`/api/pipedrive/search?q=${encodeURIComponent(term.trim())}`);
                const data = await res.json();
                if (!res.ok) throw new Error(data.error || "Search failed");
                setResults(data.results ?? []);
            } catch (err) {
                setError(err instanceof Error ? err.message : String(err));
                setResults([]);
            } finally {
                setSearching(false);
            }
        }, 300);
    }, []);

    async function createEngagementThenAnalysis(r: PipedriveSearchResult) {
        setBusy(true);
        setError(null);
        try {
            const payload: Record<string, unknown> =
                r.type === "person"
                    ? {
                          pipedrivePersonId: String((r as PipedriveSearchPerson).id),
                          customerName: (r as PipedriveSearchPerson).name,
                          customerEmail: (r as PipedriveSearchPerson).email ?? undefined,
                          customerPhone: (r as PipedriveSearchPerson).phone ?? undefined,
                          address: (r as PipedriveSearchPerson).address ?? undefined,
                      }
                    : {
                          pipedriveDealId: String((r as PipedriveSearchDeal).id),
                          pipedrivePersonId: (r as PipedriveSearchDeal).personId
                              ? String((r as PipedriveSearchDeal).personId)
                              : undefined,
                          customerName: (r as PipedriveSearchDeal).personName ?? (r as PipedriveSearchDeal).title,
                      };
            const eRes = await fetch("/api/engagements", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            const eData = await eRes.json();
            if (!eRes.ok) throw new Error(eData.error || "Failed to create engagement");
            await createAnalysis(eData.engagement.id as string);
        } catch (err) {
            setError(err instanceof Error ? err.message : String(err));
            setBusy(false);
        }
    }

    return (
        <>
            <button className={className ?? s.primaryAction} onClick={() => setOpen(true)}>
                {label}
            </button>

            {open && (
                <div className={s.overlay} onClick={close}>
                    <div className={s.modal} onClick={(e) => e.stopPropagation()}>
                        {view === "pick" ? (
                            <>
                                <h2 className={s.modalTitle}>Start a formal property analysis</h2>
                                <p className={s.modalHint}>
                                    Pick an active engagement to start the on-site analysis
                                    {allowNewEngagement ? ", or start one from a new engagement." : "."}
                                </p>

                                {engagements.length === 0 ? (
                                    <p className={s.empty}>
                                        No active engagements yet
                                        {allowNewEngagement ? " — start one from a new engagement below." : "."}
                                    </p>
                                ) : (
                                    <ul className={s.results}>
                                        {engagements.map((e) => (
                                            <li key={e.id}>
                                                <button
                                                    className={s.resultItem}
                                                    disabled={busy}
                                                    onClick={() => startOnExisting(e.id)}
                                                >
                                                    <span className={s.rowMain}>
                                                        <span className={s.rowName}>{e.customerName}</span>
                                                        <span className={s.rowMuted}>{e.address}</span>
                                                    </span>
                                                    <span className={s.stageBadge}>{e.stageLabel}</span>
                                                </button>
                                            </li>
                                        ))}
                                    </ul>
                                )}

                                {error && <p className={s.error}>{error}</p>}

                                <div className={s.modalActions}>
                                    <button className={s.btnGhost} onClick={close} disabled={busy}>
                                        Cancel
                                    </button>
                                    {allowNewEngagement && (
                                        <button
                                            className={s.primaryAction}
                                            onClick={() => {
                                                setView("new");
                                                setError(null);
                                            }}
                                            disabled={busy}
                                        >
                                            + New engagement
                                        </button>
                                    )}
                                </div>
                            </>
                        ) : (
                            <>
                                <h2 className={s.modalTitle}>Start from a new engagement</h2>
                                <p className={s.modalHint}>
                                    Search Pipedrive for the person or deal — we&apos;ll create the
                                    engagement and open the analysis.
                                </p>
                                <input
                                    className={s.searchInput}
                                    autoFocus
                                    placeholder="Search by name, email, phone, or address…"
                                    value={q}
                                    disabled={busy}
                                    onChange={(e) => {
                                        setQ(e.target.value);
                                        runSearch(e.target.value);
                                    }}
                                />

                                {searching && <p className={s.modalHint}>Searching…</p>}
                                {error && <p className={s.error}>{error}</p>}

                                <ul className={s.results}>
                                    {results.map((r) => (
                                        <li key={`${r.type}-${r.id}`}>
                                            <button
                                                className={s.resultItem}
                                                disabled={busy}
                                                onClick={() => createEngagementThenAnalysis(r)}
                                            >
                                                <span className={s.rowMain}>
                                                    <span className={s.resultType}>{r.type}</span>
                                                    <span className={s.rowName}>
                                                        {r.type === "person"
                                                            ? (r as PipedriveSearchPerson).name
                                                            : (r as PipedriveSearchDeal).title}
                                                    </span>
                                                    <span className={s.rowMuted}>
                                                        {r.type === "person"
                                                            ? [
                                                                  (r as PipedriveSearchPerson).email,
                                                                  (r as PipedriveSearchPerson).address,
                                                              ]
                                                                  .filter(Boolean)
                                                                  .join(" · ")
                                                            : [
                                                                  (r as PipedriveSearchDeal).personName,
                                                                  (r as PipedriveSearchDeal).stageName,
                                                              ]
                                                                  .filter(Boolean)
                                                                  .join(" · ")}
                                                    </span>
                                                </span>
                                            </button>
                                        </li>
                                    ))}
                                </ul>

                                <div className={s.modalActions}>
                                    <button
                                        className={s.btnGhost}
                                        onClick={() => {
                                            setView("pick");
                                            setError(null);
                                        }}
                                        disabled={busy}
                                    >
                                        ← Back
                                    </button>
                                    <button className={s.btnGhost} onClick={close} disabled={busy}>
                                        Cancel
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}
        </>
    );
}
