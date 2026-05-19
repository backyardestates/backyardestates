"use client";

import React, { useEffect, useState } from "react";
import {
    listProposals,
    listDrafts,
    deleteProposal,
    deleteDraft,
    getDraft,
    hasProposal,
    saveProposal,
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

export function SavedProposals({ open, onClose, onLoadProposal, onLoadDraft }: Props) {
    const [drafts, setDrafts] = useState<ProposalIndexEntry[]>([]);
    const [proposals, setProposals] = useState<ProposalIndexEntry[]>([]);

    function refresh() {
        setDrafts(listDrafts());
        setProposals(listProposals());
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

    function handleDeleteProposal(addressKey: string, address: string) {
        if (!window.confirm(`Delete saved proposal for "${address}"? This cannot be undone.`)) return;
        deleteProposal(addressKey);
        refresh();
    }

    function handleDeleteDraft(addressKey: string, address: string) {
        if (!window.confirm(`Delete draft for "${address}"? This cannot be undone.`)) return;
        deleteDraft(addressKey);
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

    function handlePromote(addressKey: string, address: string) {
        const snap = getDraft(addressKey);
        if (!snap) return;
        if (hasProposal(addressKey)) {
            const ok = window.confirm(
                `There is an existing proposal with the same address saved. Are you sure you want to override it and save this draft as a proposal?`
            );
            if (!ok) return;
        }
        saveProposal({ ...snap, savedAt: new Date().toISOString() });
        deleteDraft(addressKey);
        refresh();
    }

    if (!open) return null;

    const totalLabel = `${drafts.length + proposals.length} item${drafts.length + proposals.length === 1 ? "" : "s"} in this browser`;

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
                                                onClick={() => handlePromote(e.addressKey, e.address)}
                                                title="Save this draft as a proposal"
                                            >
                                                Save as Proposal
                                            </button>
                                            <button
                                                type="button"
                                                className={s.deleteBtn}
                                                onClick={() => handleDeleteDraft(e.addressKey, e.address)}
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
                                                onClick={() => handleDeleteProposal(e.addressKey, e.address)}
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
                    <span>Stored locally in this browser only.</span>
                    <span>Sharing across machines coming soon.</span>
                </div>
            </div>
        </div>
    );
}
