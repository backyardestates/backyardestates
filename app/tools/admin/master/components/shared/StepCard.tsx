"use client";

import React from "react";
import styles from "./StepCard.module.css";

export type StepKind = "data" | "review";

export interface StepCardProps {
    stepNumber: number;
    title: string;
    badge?: string;
    isComplete: boolean;
    isActive: boolean;
    isPending: boolean;
    completeSummary: string;
    onEdit: () => void;
    children: React.ReactNode;

    /** "data" steps may show a needs-input warning. "review" steps never do. */
    kind?: StepKind;

    /** True when required form data is still missing. Disables Done button. */
    needsInput?: boolean;

    /** Short hint shown next to the disabled Done button. */
    needsInputMessage?: string;

    /** Called when the user clicks the Done button at the bottom of the body. */
    onDone?: () => void;

    /** Override the Done button label (default: "Done" / "Mark Reviewed"). */
    doneLabel?: string;
}

export function StepCard({
    stepNumber,
    title,
    badge,
    isComplete,
    isActive,
    isPending,
    completeSummary,
    onEdit,
    children,
    kind = "data",
    needsInput = false,
    needsInputMessage,
    onDone,
    doneLabel,
}: StepCardProps) {
    const showBody = isActive;
    const isCollapsed = !isActive;
    const showCollapsed = isComplete && !isActive;

    // Review steps never expose a needs-input state.
    const effectiveNeedsInput = kind === "data" && needsInput;

    // Default Done button label
    const finalDoneLabel = doneLabel ?? (kind === "review" ? "Mark reviewed" : "Done");

    const cardClass = [
        styles.card,
        isActive ? styles.cardActive : "",
        // Removed `cardPending` opacity dimming when not active — every step
        // stays readable; status is conveyed via the dot + header chip instead.
        isComplete && !isActive ? styles.cardDone : "",
        effectiveNeedsInput && !isActive && !isComplete ? styles.cardNeedsInput : "",
    ]
        .filter(Boolean)
        .join(" ");

    const headerClass = [
        styles.header,
        showCollapsed ? styles.headerComplete : "",
        effectiveNeedsInput && isCollapsed && !isComplete ? styles.headerNeedsInput : "",
        !isComplete && !effectiveNeedsInput && isCollapsed ? styles.headerPending : "",
    ]
        .filter(Boolean)
        .join(" ");

    const dotClass = [
        styles.dot,
        isActive ? styles.dotActive : "",
        showCollapsed ? styles.dotComplete : "",
        effectiveNeedsInput && isCollapsed && !isComplete ? styles.dotNeedsInput : "",
        !isComplete && !effectiveNeedsInput && isCollapsed ? styles.dotPending : "",
    ]
        .filter(Boolean)
        .join(" ");

    const badgeClass = badge === "OPTIONAL"
        ? `${styles.badge} ${styles.badgeOptional}`
        : `${styles.badge} ${styles.badgeInternal}`;

    return (
        <section id={`step-${stepNumber}`} className={cardClass}>
            <div
                className={`${headerClass} ${isCollapsed ? styles.headerClickable : ""}`}
                onClick={isCollapsed ? onEdit : undefined}
                role={isCollapsed ? "button" : undefined}
                tabIndex={isCollapsed ? 0 : undefined}
                onKeyDown={isCollapsed ? (e) => { if (e.key === "Enter" || e.key === " ") onEdit(); } : undefined}
            >
                <span className={dotClass} aria-hidden>
                    {showCollapsed ? "✓" : effectiveNeedsInput && isCollapsed ? "!" : stepNumber}
                </span>
                <span className={styles.sep} aria-hidden>·</span>
                <span className={styles.title}>
                    {title}
                </span>

                {kind === "review" && (
                    <span className={`${styles.badge} ${styles.badgeReview}`}>REVIEW</span>
                )}
                {badge && <span className={badgeClass}>{badge}</span>}

                {/* Status chips on the right of a collapsed header */}
                {isCollapsed && (
                    <span className={styles.statusGroup}>
                        {showCollapsed ? (
                            <>
                                <span className={styles.summary}>{completeSummary}</span>
                                <span className={styles.statusChip + " " + styles.statusChipDone}>Reviewed</span>
                            </>
                        ) : effectiveNeedsInput ? (
                            <span className={styles.statusChip + " " + styles.statusChipNeeds}>
                                Needs input
                            </span>
                        ) : (
                            <span className={styles.statusChip + " " + styles.statusChipPending}>
                                Pending review
                            </span>
                        )}
                    </span>
                )}
            </div>

            {showBody && (
                <div className={styles.body}>
                    {children}

                    {onDone && (
                        <div className={styles.doneRow}>
                            {effectiveNeedsInput && needsInputMessage && (
                                <span className={styles.doneHint}>{needsInputMessage}</span>
                            )}
                            <button
                                type="button"
                                className={`${styles.doneBtn} ${kind === "review" ? styles.doneBtnReview : ""}`}
                                onClick={onDone}
                                disabled={effectiveNeedsInput}
                            >
                                {finalDoneLabel}
                            </button>
                        </div>
                    )}
                </div>
            )}
        </section>
    );
}
