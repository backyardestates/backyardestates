"use client";

import React from "react";
import styles from "./StepSidebar.module.css";

const STEPS = [
    { n: 1, label: "Who & Where",       kind: "data"   as const },
    { n: 2, label: "Choose Units",      kind: "data"   as const },
    { n: 3, label: "Estimate the Job",  kind: "data"   as const },
    { n: 4, label: "Discounts",         kind: "data"   as const },
    { n: 5, label: "Rental Market",     kind: "review" as const },
    { n: 6, label: "Review & Generate", kind: "review" as const },
];

export function StepSidebar({
    activeStep,
    completedSteps,
    needsInputSteps = [],
    onStepClick,
}: {
    activeStep: number;
    completedSteps: number[];
    needsInputSteps?: number[];
    onStepClick: (n: number) => void;
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
            </div>
        </nav>
    );
}
