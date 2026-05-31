"use client";

import React from "react";
import styles from "./StepSidebar.module.css";

const STEPS = [
    { n: 1,  label: "Who & Where",        kind: "data"   as const },
    { n: 2,  label: "Units",              kind: "data"   as const },
    { n: 3,  label: "Site Photo",         kind: "data"   as const },
    { n: 4,  label: "Estimate the Job",   kind: "data"   as const },
    { n: 5,  label: "Discounts",          kind: "data"   as const },
    { n: 6,  label: "Rental Market",      kind: "review" as const },
    { n: 7,  label: "Project Timeline",   kind: "data"   as const },
    { n: 8,  label: "Payment Schedule",   kind: "data"   as const },
    { n: 9,  label: "Feature Builds",     kind: "data"   as const },
    { n: 10, label: "Feature Stories",    kind: "data"   as const },
    { n: 11, label: "Slide Order",        kind: "data"   as const },
];

export function StepSidebar({
    activeStep,
    completedSteps,
    needsInputSteps = [],
    onStepClick,
    onReviewClick,
}: {
    activeStep: number;
    completedSteps: number[];
    needsInputSteps?: number[];
    onStepClick: (n: number) => void;
    /** Opens/scrolls to the Review & Generate control panel (not a numbered
     *  step — it's a live control surface that can be opened anytime). */
    onReviewClick?: () => void;
}) {
    function goTo(n: number) {
        onStepClick(n);
    }

    return (
        <nav className={styles.sidebar} aria-label="Workflow steps">
            <div className={styles.inner}>
                <div className={styles.sectionLabel}>Workflow</div>

                {STEPS.map((step) => {
                    const isActive = step.n === activeStep;
                    const isDone = completedSteps.includes(step.n);
                    const needsInput = !isDone && !isActive && needsInputSteps.includes(step.n);
                    const isReview = step.kind === "review";

                    return (
                        <button
                            key={step.n}
                            className={[
                                styles.step,
                                isActive ? styles.stepActive : "",
                                isDone ? styles.stepDone : "",
                                needsInput ? styles.stepNeedsInput : "",
                            ]
                                .filter(Boolean)
                                .join(" ")}
                            onClick={() => goTo(step.n)}
                            aria-current={isActive ? "step" : undefined}
                        >
                            <span
                                className={[
                                    styles.stepNum,
                                    isActive ? styles.stepNumActive : "",
                                    isDone ? styles.stepNumDone : "",
                                    needsInput ? styles.stepNumNeedsInput : "",
                                ]
                                    .filter(Boolean)
                                    .join(" ")}
                                aria-hidden
                            >
                                {isDone ? "✓" : needsInput ? "!" : step.n}
                            </span>
                            <span className={styles.stepLabel}>{step.label}</span>
                            {isReview && !isDone && (
                                <span className={styles.reviewTag} aria-hidden>review</span>
                            )}
                        </button>
                    );
                })}

                {/* Review & Generate is a control panel, not a sequential step —
                    pin it below a divider so it's reachable from anywhere. */}
                {onReviewClick && (
                    <>
                        <hr className={styles.divider} />
                        <button
                            type="button"
                            className={`${styles.step} ${styles.pinnedStep}`}
                            onClick={onReviewClick}
                        >
                            <span className={`${styles.stepNum} ${styles.pinnedIcon}`} aria-hidden>
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="12" cy="12" r="3" />
                                    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
                                </svg>
                            </span>
                            <span className={styles.stepLabel}>Proposal Controls</span>
                            <span className={styles.reviewTag} aria-hidden>panel</span>
                        </button>
                    </>
                )}
            </div>
        </nav>
    );
}
