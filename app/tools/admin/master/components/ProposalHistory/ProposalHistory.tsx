"use client";

// Version-history modal — lists the automatic checkpoints (ProposalRevision
// rows) for the open proposal and lets the rep restore any of them. The
// checkpoints are written server-side on explicit Saves, promotions (the
// displaced canonical), and at most one autosave per 10 minutes.

import React, { useEffect, useState } from "react";
import type { ProposalSnapshot } from "@/lib/proposalSnapshot";
import s from "./ProposalHistory.module.css";

export interface RevisionEntry {
    id: string;
    kind: "SAVE" | "AUTOSAVE" | "PROMOTE" | "RESTORE";
    createdAt: string;
    authorEmail: string | null;
    proposalStatus: string;
}

interface Props {
    open: boolean;
    addressKey: string;
    onClose: () => void;
    /** Apply a restored snapshot to the form (caller runs applySnapshot + save). */
    onRestore: (snapshot: ProposalSnapshot) => void;
}

const KIND_LABEL: Record<RevisionEntry["kind"], string> = {
    SAVE: "Saved",
    AUTOSAVE: "Autosave checkpoint",
    PROMOTE: "Replaced version",
    RESTORE: "Restored",
};

function formatWhen(iso: string) {
    try {
        return new Date(iso).toLocaleString("en-US", {
            month: "short",
            day: "numeric",
            hour: "numeric",
            minute: "2-digit",
        });
    } catch {
        return iso;
    }
}

export function ProposalHistory({ open, addressKey, onClose, onRestore }: Props) {
    const [entries, setEntries] = useState<RevisionEntry[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [restoringId, setRestoringId] = useState<string | null>(null);

    useEffect(() => {
        if (!open || !addressKey) return;
        let cancelled = false;
        setLoading(true);
        setError(null);
        void (async () => {
            try {
                const res = await fetch(
                    `/api/admin/proposals/${encodeURIComponent(addressKey)}/revisions`,
                );
                const data = (await res.json().catch(() => ({}))) as {
                    revisions?: RevisionEntry[];
                    error?: string;
                };
                if (cancelled) return;
                if (!res.ok) {
                    setError(data.error || `Couldn't load history (HTTP ${res.status})`);
                    return;
                }
                setEntries(data.revisions ?? []);
            } catch (err) {
                if (!cancelled) setError(err instanceof Error ? err.message : "Couldn't load history");
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [open, addressKey]);

    useEffect(() => {
        if (!open) return;
        function onKey(e: KeyboardEvent) {
            if (e.key === "Escape") onClose();
        }
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [open, onClose]);

    async function handleRestore(entry: RevisionEntry) {
        const ok = window.confirm(
            `Restore the version from ${formatWhen(entry.createdAt)}? It will replace what's currently on screen and become your live draft.`,
        );
        if (!ok) return;
        setRestoringId(entry.id);
        try {
            const res = await fetch(`/api/admin/proposals/revision/${encodeURIComponent(entry.id)}`);
            const data = (await res.json().catch(() => ({}))) as {
                snapshot?: ProposalSnapshot;
                error?: string;
            };
            if (!res.ok || !data.snapshot) {
                window.alert(data.error || "Couldn't load that version. Try again.");
                return;
            }
            onRestore(data.snapshot);
            onClose();
        } catch (err) {
            window.alert(err instanceof Error ? err.message : "Couldn't load that version.");
        } finally {
            setRestoringId(null);
        }
    }

    if (!open) return null;

    return (
        <div className={s.overlay} onClick={onClose} role="dialog" aria-modal="true">
            <div className={s.modal} onClick={(e) => e.stopPropagation()}>
                <div className={s.header}>
                    <div>
                        <h2 className={s.title}>Version history</h2>
                        <div className={s.subtitle}>
                            Automatic checkpoints — restore any earlier version of this proposal.
                        </div>
                    </div>
                    <button type="button" className={s.closeBtn} onClick={onClose} aria-label="Close">
                        ×
                    </button>
                </div>

                <div className={s.body}>
                    {loading ? (
                        <div className={s.empty}>Loading history…</div>
                    ) : error ? (
                        <div className={s.empty}>{error}</div>
                    ) : entries.length === 0 ? (
                        <div className={s.empty}>
                            No checkpoints yet. Versions are recorded automatically as you save and edit.
                        </div>
                    ) : (
                        <ul className={s.list}>
                            {entries.map((e) => (
                                <li key={e.id} className={s.row}>
                                    <div className={s.rowMain}>
                                        <span className={s.rowTitle}>
                                            {KIND_LABEL[e.kind] ?? e.kind}
                                            <span
                                                className={`${s.kindBadge} ${
                                                    e.kind === "SAVE" || e.kind === "PROMOTE"
                                                        ? s.kindBadgeStrong
                                                        : ""
                                                }`}
                                            >
                                                {e.proposalStatus === "REVIEWED" ? "Saved proposal" : "Draft"}
                                            </span>
                                        </span>
                                        <span className={s.rowSub}>
                                            {formatWhen(e.createdAt)}
                                            {e.authorEmail ? ` · ${e.authorEmail}` : ""}
                                        </span>
                                    </div>
                                    <button
                                        type="button"
                                        className={s.restoreBtn}
                                        disabled={restoringId !== null}
                                        onClick={() => void handleRestore(e)}
                                    >
                                        {restoringId === e.id ? "Restoring…" : "Restore"}
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                <div className={s.footer}>
                    <span>Checkpoints: every Save, replaced versions, and autosaves every ~10 min.</span>
                    <span>Kept: last 20 per proposal.</span>
                </div>
            </div>
        </div>
    );
}
