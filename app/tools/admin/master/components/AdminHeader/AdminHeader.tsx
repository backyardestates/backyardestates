"use client";

import React, { useEffect, useRef, useState } from "react";
import { SignOutButton } from "@clerk/nextjs";
import styles from "./AdminHeader.module.css";
import type { PresenterVariant } from "@/hooks/presentation/usePresentationWire";

export type DraftStatus =
    | { state: "idle"; message?: string }
    | { state: "pending" }
    | { state: "saved"; at: Date }
    | { state: "error"; message: string };

interface AdminHeaderProps {
    onOpenPresenter?: (variant: PresenterVariant) => void;
    onSave?: () => void;
    onOpenSaved?: () => void;
    onNew?: () => void;
    onExportPdf?: () => void;
    onGenerateAgreement?: () => void;
    /** Re-open the consultation→FPA AI prefill review for the current proposal. */
    onAiMatch?: () => void;
    aiMatchBusy?: boolean;
    saveDisabled?: boolean;
    exportDisabled?: boolean;
    agreementDisabled?: boolean;
    /** Drives the Save button affordance: spinner while saving, then a brief
     *  "Saved ✓" / "Save failed" confirmation before reverting to "Save". */
    saveStatus?: "idle" | "saving" | "saved" | "error";
    draftStatus?: DraftStatus;
}

function formatRelative(d: Date): string {
    const diffSec = Math.max(0, Math.floor((Date.now() - d.getTime()) / 1000));
    if (diffSec < 5) return "just now";
    if (diffSec < 60) return `${diffSec}s ago`;
    const min = Math.floor(diffSec / 60);
    if (min < 60) return `${min}m ago`;
    const h = Math.floor(min / 60);
    return `${h}h ago`;
}

function DraftIndicator({ status }: { status?: DraftStatus }) {
    const [, force] = useState(0);
    useEffect(() => {
        if (status?.state !== "saved") return;
        const t = setInterval(() => force((n) => n + 1), 15_000);
        return () => clearInterval(t);
    }, [status?.state]);

    if (!status) return null;
    if (status.state === "idle") {
        return (
            <span className={styles.draftStatus} title="Autosave">
                <span className={styles.draftDot} />
                {status.message ?? "Autosave idle"}
            </span>
        );
    }
    if (status.state === "pending") {
        return (
            <span className={styles.draftStatus} title="Autosaving draft">
                <span className={`${styles.draftDot} ${styles.draftDotPending}`} />
                Saving draft…
            </span>
        );
    }
    if (status.state === "saved") {
        return (
            <span className={styles.draftStatus} title={`Draft saved ${status.at.toLocaleTimeString()}`}>
                <span className={`${styles.draftDot} ${styles.draftDotSaved}`} />
                Draft saved {formatRelative(status.at)}
            </span>
        );
    }
    return (
        <span className={styles.draftStatus} title={status.message}>
            <span className={`${styles.draftDot} ${styles.draftDotError}`} />
            Draft save failed
        </span>
    );
}

export function AdminHeader({
    onOpenPresenter,
    onSave,
    onOpenSaved,
    onNew,
    onExportPdf,
    onGenerateAgreement,
    onAiMatch,
    aiMatchBusy = false,
    saveDisabled = false,
    exportDisabled = false,
    agreementDisabled = false,
    saveStatus = "idle",
    draftStatus,
}: AdminHeaderProps) {
    const [open, setOpen] = useState(false);
    const wrapRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        if (!open) return;
        function onDocClick(e: MouseEvent) {
            if (!wrapRef.current) return;
            if (!wrapRef.current.contains(e.target as Node)) setOpen(false);
        }
        function onKey(e: KeyboardEvent) {
            if (e.key === "Escape") setOpen(false);
        }
        document.addEventListener("mousedown", onDocClick);
        document.addEventListener("keydown", onKey);
        return () => {
            document.removeEventListener("mousedown", onDocClick);
            document.removeEventListener("keydown", onKey);
        };
    }, [open]);

    function pick(variant: PresenterVariant) {
        setOpen(false);
        onOpenPresenter?.(variant);
    }

    return (
        <header className={styles.header}>
            <div className={styles.logoWrap}>
                <img
                    src="/images/logo-mobile.png"
                    alt="Backyard Estates"
                    className={styles.logo}
                />
                <span className={styles.wordmark}>Backyard Estates</span>
            </div>

            <div className={styles.center}>
                <span className={styles.toolLabel}>ADU Proposal Tool</span>
            </div>

            <div className={styles.actions}>
                <DraftIndicator status={draftStatus} />
                {onAiMatch && (
                    <button
                        type="button"
                        className={styles.aiBtn}
                        onClick={onAiMatch}
                        disabled={aiMatchBusy}
                        title="Review (or re-run) the AI matches from this customer's consultation & property analysis"
                    >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                            <path d="M12 2l1.9 5.1L19 9l-5.1 1.9L12 16l-1.9-5.1L5 9l5.1-1.9L12 2zM19 14l.9 2.6L22 17.5l-2.1.9L19 21l-.9-2.6L16 17.5l2.1-.9L19 14z" />
                        </svg>
                        {aiMatchBusy ? "Matching…" : "AI match"}
                    </button>
                )}
                {onNew && (
                    <button
                        type="button"
                        className={styles.ghostBtn}
                        onClick={onNew}
                        title="Start a fresh proposal"
                    >
                        + New
                    </button>
                )}
                {onOpenSaved && (
                    <button
                        type="button"
                        className={styles.ghostBtn}
                        onClick={onOpenSaved}
                        title="Browse saved proposals"
                    >
                        Saved
                    </button>
                )}
                {onSave && (
                    <button
                        type="button"
                        className={`${styles.saveBtn} ${
                            saveStatus === "saved" ? styles.saveBtnSaved : ""
                        } ${saveStatus === "error" ? styles.saveBtnError : ""}`}
                        onClick={onSave}
                        disabled={saveDisabled || saveStatus === "saving"}
                        aria-busy={saveStatus === "saving"}
                        title={
                            saveDisabled
                                ? "Enter an address to save"
                                : saveStatus === "error"
                                  ? "Save failed — click to retry"
                                  : "Save proposal"
                        }
                    >
                        {saveStatus === "saving" && (
                            <span className={styles.spinner} aria-hidden="true" />
                        )}
                        {saveStatus === "saving"
                            ? "Saving…"
                            : saveStatus === "saved"
                              ? "Saved ✓"
                              : saveStatus === "error"
                                ? "Save failed — retry"
                                : "Save"}
                    </button>
                )}
                {onExportPdf && (
                    <button
                        type="button"
                        className={styles.ghostBtn}
                        onClick={onExportPdf}
                        disabled={exportDisabled}
                        title={exportDisabled ? "Enter an address to export" : "Open the deck and save as PDF"}
                    >
                        Export PDF
                    </button>
                )}
                {onGenerateAgreement && (
                    <button
                        type="button"
                        className={styles.ghostBtn}
                        onClick={onGenerateAgreement}
                        disabled={agreementDisabled}
                        title={agreementDisabled ? "Complete the proposal first" : "Generate the contract .docx from this proposal"}
                    >
                        Edit Agreement
                    </button>
                )}
                {onOpenPresenter && (
                    <div className={styles.presentWrap} ref={wrapRef}>
                        <button
                            type="button"
                            className={styles.presentBtn}
                            onClick={() => setOpen((v) => !v)}
                            aria-haspopup="menu"
                            aria-expanded={open}
                        >
                            <span className={styles.presentIcon}>▶</span>
                            Present
                            <span className={styles.caret} aria-hidden>▾</span>
                        </button>

                        {open && (
                            <div className={styles.menu} role="menu">
                                <button
                                    type="button"
                                    role="menuitem"
                                    className={styles.menuItem}
                                    onClick={() => pick("original")}
                                >
                                    <span className={styles.menuLabel}>Original</span>
                                    <span className={styles.menuHint}>Proposal-style deck</span>
                                </button>
                                <button
                                    type="button"
                                    role="menuitem"
                                    className={styles.menuItem}
                                    onClick={() => pick("v2")}
                                >
                                    <span className={styles.menuLabel}>v.2</span>
                                    <span className={styles.menuHint}>Previous deck</span>
                                </button>
                            </div>
                        )}
                    </div>
                )}
                <SignOutButton>
                    <button className={styles.signOutBtn}>Sign out</button>
                </SignOutButton>
            </div>
        </header>
    );
}
