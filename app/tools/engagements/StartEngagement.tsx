"use client";

import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import s from "./engagements.module.css";

// Type-only imports from the route module — erased at compile time so the
// route's server code never lands in the client bundle.
import type {
    PipedriveSearchResult,
    PipedriveSearchPerson,
    PipedriveSearchDeal,
} from "@/app/api/pipedrive/search/route";

export function StartEngagement() {
    const router = useRouter();
    const [open, setOpen] = useState(false);
    const [q, setQ] = useState("");
    const [results, setResults] = useState<PipedriveSearchResult[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [creating, setCreating] = useState(false);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const runSearch = useCallback((term: string) => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        if (term.trim().length < 2) {
            setResults([]);
            return;
        }
        debounceRef.current = setTimeout(async () => {
            setLoading(true);
            setError(null);
            try {
                const res = await fetch(
                    `/api/pipedrive/search?q=${encodeURIComponent(term.trim())}`,
                );
                const data = await res.json();
                if (!res.ok) throw new Error(data.error || "Search failed");
                setResults(data.results ?? []);
            } catch (err) {
                setError(err instanceof Error ? err.message : String(err));
                setResults([]);
            } finally {
                setLoading(false);
            }
        }, 300);
    }, []);

    async function create(payload: Record<string, unknown>) {
        setCreating(true);
        setError(null);
        try {
            const res = await fetch("/api/engagements", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Failed to create engagement");
            router.push(`/tools/engagements/${data.engagement.id}`);
        } catch (err) {
            setError(err instanceof Error ? err.message : String(err));
            setCreating(false);
        }
    }

    function selectResult(r: PipedriveSearchResult) {
        if (r.type === "person") {
            const p = r as PipedriveSearchPerson;
            void create({
                pipedrivePersonId: String(p.id),
                customerName: p.name,
                customerEmail: p.email ?? undefined,
                customerPhone: p.phone ?? undefined,
                address: p.address ?? undefined,
            });
        } else {
            const d = r as PipedriveSearchDeal;
            void create({
                pipedriveDealId: String(d.id),
                pipedrivePersonId: d.personId ? String(d.personId) : undefined,
                customerName: d.personName ?? d.title,
            });
        }
    }

    return (
        <>
            <button className={s.primaryAction} onClick={() => setOpen(true)}>
                + Start engagement
            </button>

            {open && (
                <div className={s.overlay} onClick={() => !creating && setOpen(false)}>
                    <div className={s.modal} onClick={(e) => e.stopPropagation()}>
                        <h2 className={s.modalTitle}>Start a new engagement</h2>
                        <p className={s.modalHint}>
                            Search Pipedrive for the person or deal you&apos;re meeting with.
                        </p>
                        <input
                            className={s.searchInput}
                            autoFocus
                            placeholder="Search by name, email, phone, or address…"
                            value={q}
                            onChange={(e) => {
                                setQ(e.target.value);
                                runSearch(e.target.value);
                            }}
                            disabled={creating}
                        />

                        {loading && <p className={s.modalHint}>Searching…</p>}
                        {error && <p className={s.error}>{error}</p>}

                        <ul className={s.results}>
                            {results.map((r) => (
                                <li key={`${r.type}-${r.id}`}>
                                    <button
                                        className={s.resultItem}
                                        onClick={() => selectResult(r)}
                                        disabled={creating}
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
                                onClick={() => setOpen(false)}
                                disabled={creating}
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
