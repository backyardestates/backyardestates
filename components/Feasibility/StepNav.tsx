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
        <nav className={styles.nav}>
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
                        >
                            <Icon />
                            <span>{s.title}</span>
                        </button>
                    );
                })}
        </nav>
    );
}
