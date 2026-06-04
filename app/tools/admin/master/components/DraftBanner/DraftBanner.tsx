"use client";

import React, { useState } from "react";
import s from "./DraftBanner.module.css";

export type LoadedBundle = {
    reviewed: { ownedBy: { id: string; email: string | null }; savedAt: string } | null;
    myDraft: { savedAt: string } | null;
    otherDrafts: Array<{ userId: string; email: string | null; savedAt: string }>;
};

export type CurrentView =
    | { kind: "my-draft"; savedAt: string }
    | { kind: "reviewed"; savedAt: string }
    | { kind: "other-draft"; userId: string; email: string | null; savedAt: string }
    | null;

interface Props {
    bundle: LoadedBundle | null;
    view: CurrentView;
    /** Has the form been edited since this view was applied? Drives the
     *  "you have unsaved changes" warning on switches. */
    hasUnsavedEdits: boolean;
    onSwitchToMyDraft: () => void;
    onSwitchToReviewed: () => void;
    onSwitchToOtherDraft: (userId: string) => void;
    onShowDiff: () => void;
}

function relTime(iso: string): string {
    const t = new Date(iso).getTime();
    const diff = Date.now() - t;
    if (Number.isNaN(diff)) return "";
    if (diff < 60_000) return "just now";
    if (diff < 3_600_000) return `${Math.floor(diff / 60_000)} min ago`;
    if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)} h ago`;
    return `${Math.floor(diff / 86_400_000)} d ago`;
}

function initialsFromEmail(email: string | null): string {
    if (!email) return "?";
    const local = email.split("@")[0] || "";
    const parts = local.split(/[._-]+/).filter(Boolean);
    if (parts.length >= 2) return (parts[0]![0] + parts[1]![0]).toUpperCase();
    return (local[0] ?? "?").toUpperCase();
}

/**
 * Sticky banner shown above the proposal builder when a saved address is
 * loaded. Tells the rep which version they're viewing and offers a clean
 * switch to the other (canonical ↔ their draft, or — for admins — another
 * person's draft). The diff button opens a side panel showing what's
 * different between the active view and the canonical.
 *
 * Hidden entirely when there's nothing useful to say — i.e. a brand new
 * proposal with no canonical and no draft yet.
 */
export function DraftBanner({
    bundle,
    view,
    hasUnsavedEdits,
    onSwitchToMyDraft,
    onSwitchToReviewed,
    onSwitchToOtherDraft,
    onShowDiff,
}: Props) {
    const [chipsOpen, setChipsOpen] = useState(false);
    if (!bundle || !view) return null;

    const hasCanonical = !!bundle.reviewed;
    const hasMyDraft = !!bundle.myDraft;
    const hasOtherDrafts = bundle.otherDrafts.length > 0;

    // No banner needed when this address is brand-new (no canonical, no
    // drafts elsewhere, and the caller is just starting fresh in their own
    // draft). The autosave indicator already covers that case.
    if (!hasCanonical && !hasOtherDrafts && view.kind === "my-draft") return null;

    function confirmSwitch(target: string, action: () => void) {
        if (!hasUnsavedEdits) { action(); return; }
        const ok = window.confirm(
            `You have unsaved changes in your current view. Switching to ${target} will load that snapshot — your in-flight edits stay in your own draft on the server. Continue?`,
        );
        if (ok) action();
    }

    const isViewingDraft = view.kind === "my-draft";
    const isViewingOther = view.kind === "other-draft";
    const isViewingCanonical = view.kind === "reviewed";

    // Multi-user guard: the rep is editing a draft that's OLDER than the
    // canonical someone else saved since. Without this warning, saving the
    // stale draft silently clobbers the newer work (it stays recoverable in
    // History, but the rep should know before it happens).
    const reviewedNewerThanDraft =
        isViewingDraft &&
        !!bundle.reviewed &&
        !!bundle.myDraft &&
        new Date(bundle.reviewed.savedAt).getTime() >
            new Date(bundle.myDraft.savedAt).getTime();

    return (
        <div className={`${s.banner} ${isViewingDraft ? s.bannerDraft : isViewingOther ? s.bannerOther : s.bannerCanonical}`}>
            <div className={s.left}>
                <span className={s.viewPill}>
                    {isViewingDraft && <>Editing <strong>your draft</strong></>}
                    {isViewingCanonical && <>Editing <strong>canonical proposal</strong></>}
                    {isViewingOther && view.kind === "other-draft" && (
                        <>
                            Viewing <strong>{view.email || "another rep"}&apos;s draft</strong>
                        </>
                    )}
                </span>
                <span className={s.savedAt}>saved {relTime(view.savedAt)}</span>
                {bundle.reviewed && isViewingCanonical && (
                    <span className={s.ownerNote}>
                        owned by {bundle.reviewed.ownedBy.email ?? "unknown"}
                    </span>
                )}
                {isViewingOther && (
                    <span className={s.ownerNote}>
                        your edits will save to <strong>your own draft</strong>, not theirs
                    </span>
                )}
                {reviewedNewerThanDraft && bundle.reviewed && (
                    <span className={s.staleWarning}>
                        ⚠ {bundle.reviewed.ownedBy.email ?? "Someone"} saved a newer
                        version {relTime(bundle.reviewed.savedAt)} — this draft is older
                    </span>
                )}
            </div>

            <div className={s.right}>
                {/* Toggle path 1: canonical → my draft */}
                {isViewingCanonical && hasMyDraft && (
                    <button
                        className={s.btn}
                        onClick={() => confirmSwitch("your draft", onSwitchToMyDraft)}
                    >
                        Resume my draft
                    </button>
                )}

                {/* Toggle path 2: my draft → canonical */}
                {isViewingDraft && hasCanonical && (
                    <button
                        className={s.btn}
                        onClick={() => confirmSwitch("the canonical", onSwitchToReviewed)}
                    >
                        View canonical
                    </button>
                )}

                {/* Toggle path 3: other-draft → canonical or my draft */}
                {isViewingOther && hasCanonical && (
                    <button
                        className={s.btn}
                        onClick={() => confirmSwitch("the canonical", onSwitchToReviewed)}
                    >
                        Canonical
                    </button>
                )}
                {isViewingOther && hasMyDraft && (
                    <button
                        className={s.btn}
                        onClick={() => confirmSwitch("your draft", onSwitchToMyDraft)}
                    >
                        My draft
                    </button>
                )}

                {/* Diff — only meaningful when there's a canonical to compare against */}
                {hasCanonical && !isViewingCanonical && (
                    <button className={s.btn} onClick={onShowDiff}>
                        See differences
                    </button>
                )}

                {/* Admin: chips for other people's drafts on this address */}
                {hasOtherDrafts && (
                    <div className={s.chipsWrap}>
                        <button
                            className={s.chipsToggle}
                            onClick={() => setChipsOpen((o) => !o)}
                            title={`${bundle.otherDrafts.length} other draft${bundle.otherDrafts.length === 1 ? "" : "s"}`}
                        >
                            {bundle.otherDrafts.length} other draft{bundle.otherDrafts.length === 1 ? "" : "s"}
                        </button>
                        {chipsOpen && (
                            <div className={s.chipsList}>
                                {bundle.otherDrafts.map((d) => (
                                    <button
                                        key={d.userId}
                                        className={s.chip}
                                        title={d.email ?? d.userId}
                                        onClick={() => {
                                            setChipsOpen(false);
                                            confirmSwitch(
                                                `${d.email || "this rep"}'s draft`,
                                                () => onSwitchToOtherDraft(d.userId),
                                            );
                                        }}
                                    >
                                        <span className={s.chipAvatar}>{initialsFromEmail(d.email)}</span>
                                        <span className={s.chipLabel}>
                                            <strong>{d.email ?? "Unknown rep"}</strong>
                                            <span className={s.chipMeta}>{relTime(d.savedAt)}</span>
                                        </span>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
