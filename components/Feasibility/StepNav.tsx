"use client";

import type { StepDef, StepKey } from "@/lib/feasibility/types";
import styles from "./StepNav.module.css";

export default function StepNav({
    steps,
    currentStep,
    onStepClick,
}: {
    steps: StepDef[];
    currentStep: StepKey;
    onStepClick: (step: StepKey) => void;
}) {
    return (
        <nav className={styles.nav} aria-label="Steps">
            {steps
                .slice()
                .sort((a, b) => a.index - b.index)
                .map((s) => {
                    const active = s.key === currentStep;
                    const Icon = s.Icon;

                    return (
                        <button
                            key={s.key}
                            type="button"
                            className={`${styles.stepBtn} ${active ? styles.active : ""}`}
                            onClick={() => onStepClick(s.key)}
                            aria-current={active ? "step" : undefined}
                        >
                            <span className={styles.iconWrap} aria-hidden="true">
                                <Icon />
                            </span>
                            <span className={styles.stepTitle}>{s.title}</span>
                        </button>
                    );
                })}
        </nav>
    );
}
