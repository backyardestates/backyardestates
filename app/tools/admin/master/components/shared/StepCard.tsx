"use client";

import React from "react";
import styles from "./StepCard.module.css";

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
}: StepCardProps) {
    const showBody = isActive;
    const showCollapsed = isComplete && !isActive;

    const cardClass = [
        styles.card,
        isActive ? styles.cardActive : "",
        isPending ? styles.cardPending : "",
    ]
        .filter(Boolean)
        .join(" ");

    const headerClass = [
        styles.header,
        showCollapsed ? styles.headerComplete : "",
        isPending ? styles.headerPending : "",
    ]
        .filter(Boolean)
        .join(" ");

    const dotClass = [
        styles.dot,
        isActive ? styles.dotActive : "",
        showCollapsed ? styles.dotComplete : "",
        isPending ? styles.dotPending : "",
    ]
        .filter(Boolean)
        .join(" ");

    const badgeClass = badge === "OPTIONAL"
        ? `${styles.badge} ${styles.badgeOptional}`
        : `${styles.badge} ${styles.badgeInternal}`;

    return (
        <section id={`step-${stepNumber}`} className={cardClass}>
            <div
                className={headerClass}
                onClick={showCollapsed ? onEdit : undefined}
                role={showCollapsed ? "button" : undefined}
                tabIndex={showCollapsed ? 0 : undefined}
                onKeyDown={showCollapsed ? (e) => { if (e.key === "Enter" || e.key === " ") onEdit(); } : undefined}
            >
                <span className={dotClass} aria-hidden>
                    {showCollapsed ? "✓" : stepNumber}
                </span>
                <span className={styles.sep} aria-hidden>·</span>
                <span className={`${styles.title} ${isPending ? styles.titlePending : ""}`}>
                    {title}
                </span>

                {badge && <span className={badgeClass}>{badge}</span>}

                {showCollapsed && (
                    <>
                        <span className={styles.sep} aria-hidden>·</span>
                        <span className={styles.summary}>{completeSummary}</span>
                        <button
                            type="button"
                            className={styles.editBtn}
                            onClick={(e) => { e.stopPropagation(); onEdit(); }}
                        >
                            Edit
                        </button>
                    </>
                )}
            </div>

            {showBody && (
                <div className={styles.body}>
                    {children}
                </div>
            )}
        </section>
    );
}
