"use client";

import React, { useEffect, useState } from "react";
import {
    listProposals,
    listDrafts,
    deleteProposal,
    deleteDraft,
    getDraft,
    saveProposal,
    fetchProposalIndex,
    fetchDraftFromServer,
    type ProposalIndexEntry,
} from "@/lib/proposalSnapshot";
import s from "./SavedProposals.module.css";

interface Props {
    open: boolean;
    onClose: () => void;
    /** Load a proposal (explicit save) into the form. */
    onLoadProposal: (addressKey: string) => void;
    /** Load an autosaved draft into the form. */
    onLoadDraft: (addressKey: string) => void;
}

function formatSavedAt(iso: string) {
    try {
        const d = new Date(iso);
        return d.toLocaleString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
            hour: "numeric",
            minute: "2-digit",
        });
    } catch {
        return iso;
    }
}

/** Server index wins; local-only entries (offline work the server hasn't seen)
 *  are appended. Sorted newest-first. */
function mergeIndex(
    server: ProposalIndexEntry[],
    local: ProposalIndexEntry[]
): ProposalIndexEntry[] {
    const seen = new Set(server.map((e) => e.addressKey));
    return [...server, ...local.filter((e) => !seen.has(e.addressKey))].sort(
        (a, b) => (a.savedAt < b.savedAt ? 1 : -1)
    );
}

export function SavedProposals({ open, onClose, onLoadProposal, onLoadDraft }: Props) {
    const [drafts, setDrafts] = useState<ProposalIndexEntry[]>([]);
    const [proposals, setProposals] = useState<ProposalIndexEntry[]>([]);
    const [syncing, setSyncing] = useState(false);

    function refresh() {
        // Local cache renders instantly; the server index (metadata only, no
        // snapshot blobs) replaces it when it lands. Offline keeps the cache.
        setDrafts(listDrafts());
        setProposals(listProposals());
        setSyncing(true);
        void Promise.allSettled([
            fetchProposalIndex("SAVED"),
            fetchProposalIndex("DRAFT"),
        ]).then(([saved, draft]) => {
            if (saved.status === "fulfilled") {
                setProposals(mergeIndex(saved.value, listProposals()));
            }
            if (draft.status === "fulfilled") {
                setDrafts(mergeIndex(draft.value, listDrafts()));
            }
            setSyncing(false);
        });
    }

    useEffect(() => {
        if (open) refresh();
    }, [open]);

    useEffect(() => {
        if (!open) return;
        function onKey(e: KeyboardEvent) {
            if (e.key === "Escape") onClose();
        }
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [open, onClose]);

    async function handleDeleteProposal(addressKey: string, address: string) {
        if (!window.confirm(`Delete saved proposal for "${address}"? This cannot be undone.`)) return;
        // Drop the row immediately, then re-sync once the server delete lands
        // (refreshing earlier would race and resurrect the deleted entry).
        setProposals((prev) => prev.filter((p) => p.addressKey !== addressKey));
        await deleteProposal(addressKey);
        refresh();
    }

    async function handleDeleteDraft(addressKey: string, address: string) {
        if (!window.confirm(`Delete draft for "${address}"? This cannot be undone.`)) return;
        setDrafts((prev) => prev.filter((d) => d.addressKey !== addressKey));
        await deleteDraft(addressKey);
        refresh();
    }

    function handleLoadProposal(addressKey: string) {
        onLoadProposal(addressKey);
        onClose();
    }

    function handleLoadDraft(addressKey: string) {
        onLoadDraft(addressKey);
        onClose();
    }

    async function handlePromote(addressKey: string, address: string) {
        // The LS cache only holds drafts edited on this device — fall back to
        // the server copy so promotion also works for drafts from other devices.
        const snap = getDraft(addressKey)
            ?? (await fetchDraftFromServer(addressKey).catch(() => null));
        if (!snap) {
            window.alert(`Couldn't load the draft for "${address}". Check your connection and try again.`);
            return;
        }
        if (proposals.some((p) => p.addressKey === addressKey)) {
            const ok = window.confirm(
                `There is an existing proposal with the same address saved. Are you sure you want to override it and save this draft as a proposal?`
            );
            if (!ok) return;
        }
        setDrafts((prev) => prev.filter((d) => d.addressKey !== addressKey));
        await Promise.allSettled([
            saveProposal({ ...snap, savedAt: new Date().toISOString() }),
            deleteDraft(addressKey),
        ]);
        refresh();
    }

    if (!open) return null;

    const totalLabel = syncing
        ? "Syncing…"
        : `${drafts.length + proposals.length} item${drafts.length + proposals.length === 1 ? "" : "s"}`;

    return (
        <div className={s.overlay} onClick={onClose} role="dialog" aria-modal="true">
            <div className={s.modal} onClick={(e) => e.stopPropagation()}>
                <div className={s.header}>
                    <div>
                        <h2 className={s.title}>Saved & Drafts</h2>
                        <div className={s.subtitle}>{totalLabel}</div>
                    </div>
                    <button type="button" className={s.closeBtn} onClick={onClose} aria-label="Close">
                        ×
                    </button>
                </div>

                <div className={s.body}>
                    {/* Drafts section */}
                    <div className={s.section}>
                        <div className={s.sectionHead}>
                            <span className={s.sectionTitle}>Drafts (autosaved)</span>
                            <span className={s.sectionCount}>{drafts.length}</span>
                        </div>
                        {drafts.length === 0 ? (
                            <div className={s.sectionEmpty}>
                                No drafts yet. Drafts save automatically as you work.
                            </div>
                        ) : (
                            <div className={s.list}>
                                {drafts.map((e) => (
                                    <div key={e.addressKey} className={s.row}>
                                        <div className={s.rowMain}>
                                            <span className={s.rowAddress}>
                                                {e.address || "(no address)"}
                                                <span className={s.kindBadge}>Draft</span>
                                            </span>
                                            <div className={s.rowSub}>
                                                <span>{e.customerName || "Unnamed customer"}</span>
                                                <span className={s.rowDot} />
                                                <span>Updated {formatSavedAt(e.savedAt)}</span>
                                            </div>
                                        </div>
                                        <div className={s.rowActions}>
                                            <button
                                                type="button"
                                                className={s.loadBtn}
                                                onClick={() => handleLoadDraft(e.addressKey)}
                                            >
                                                Load
                                            </button>
                                            <button
                                                type="button"
                                                className={s.promoteBtn}
                                                onClick={() => void handlePromote(e.addressKey, e.address)}
                                                title="Save this draft as a proposal"
                                            >
                                                Save as Proposal
                                            </button>
                                            <button
                                                type="button"
                                                className={s.deleteBtn}
                                                onClick={() => void handleDeleteDraft(e.addressKey, e.address)}
                                                aria-label={`Delete draft ${e.address}`}
                                                title="Delete draft"
                                            >
                                                ×
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Proposals section */}
                    <div className={s.section}>
                        <div className={s.sectionHead}>
                            <span className={s.sectionTitle}>Saved Proposals</span>
                            <span className={s.sectionCount}>{proposals.length}</span>
                        </div>
                        {proposals.length === 0 ? (
                            <div className={s.sectionEmpty}>
                                No saved proposals yet. Use the Save button to store your progress.
                            </div>
                        ) : (
                            <div className={s.list}>
                                {proposals.map((e) => (
                                    <div key={e.addressKey} className={s.row}>
                                        <div className={s.rowMain}>
                                            <span className={s.rowAddress}>
                                                {e.address || "(no address)"}
                                                <span className={`${s.kindBadge} ${s.kindBadgeProposal}`}>Proposal</span>
                                            </span>
                                            <div className={s.rowSub}>
                                                <span>{e.customerName || "Unnamed customer"}</span>
                                                <span className={s.rowDot} />
                                                <span>Saved {formatSavedAt(e.savedAt)}</span>
                                            </div>
                                        </div>
                                        <div className={s.rowActions}>
                                            <button
                                                type="button"
                                                className={s.loadBtn}
                                                onClick={() => handleLoadProposal(e.addressKey)}
                                            >
                                                Load
                                            </button>
                                            <button
                                                type="button"
                                                className={s.deleteBtn}
                                                onClick={() => void handleDeleteProposal(e.addressKey, e.address)}
                                                aria-label={`Delete proposal ${e.address}`}
                                                title="Delete proposal"
                                            >
                                                ×
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <div className={s.footer}>
                    <span>Synced with your account.</span>
                    <span>Available on any device.</span>
                </div>
            </div>
        </div>
    );
}
