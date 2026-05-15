"use client";

import React from "react";
import styles from "./StepSidebar.module.css";

const STEPS = [
    { n: 1, label: "Who & Where" },
    { n: 2, label: "Choose Units" },
    { n: 3, label: "Estimate the Job" },
    { n: 4, label: "Discounts" },
    { n: 5, label: "Rental Market" },
    { n: 6, label: "Review & Generate" },
] as const;

export function StepSidebar({
    activeStep,
    completedSteps,
    onStepClick,
}: {
    activeStep: number;
    completedSteps: number[];
    onStepClick: (n: number) => void;
}) {
    function goTo(n: number) {
        onStepClick(n);
        const el = document.getElementById(`step-${n}`);
        if (el) {
            el.scrollIntoView({ behavior: "smooth", block: "start" });
        }
    }

    return (
        <nav className={styles.sidebar} aria-label="Workflow steps">
            <div className={styles.inner}>
                <div className={styles.sectionLabel}>Workflow</div>

                {STEPS.map((step, idx) => {
                    const isActive = step.n === activeStep;
                    const isDone = completedSteps.includes(step.n);
                    const showDivider = false;

                    return (
                        <React.Fragment key={step.n}>
                            {showDivider && <hr className={styles.divider} />}
                            <button
                                className={[
                                    styles.step,
                                    isActive ? styles.stepActive : "",
                                    isDone ? styles.stepDone : "",
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
                                    ]
                                        .filter(Boolean)
                                        .join(" ")}
                                    aria-hidden
                                >
                                    {isDone ? "✓" : step.n}
                                </span>
                                <span className={styles.stepLabel}>{step.label}</span>
                            </button>
                        </React.Fragment>
                    );
                })}
            </div>
        </nav>
    );
}
