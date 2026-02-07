"use client";

import { useEffect, useMemo, useRef } from "react";
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
    const scrollerRef = useRef<HTMLDivElement | null>(null);

    const ordered = useMemo(
        () => steps.slice().sort((a, b) => a.index - b.index),
        [steps]
    );

    useEffect(() => {
        const scroller = scrollerRef.current;
        if (!scroller) return;

        const activeEl = scroller.querySelector<HTMLButtonElement>(
            `[data-step="${currentStep}"]`
        );
        if (!activeEl) return;

        // 1) put it on the left (start)
        activeEl.scrollIntoView({
            behavior: "smooth",
            block: "nearest",
            inline: "start",
        });

        // 2) add a little inset (optional polish)
        // Use rAF so it runs AFTER scrollIntoView updates scrollLeft.
        const inset = 10;
        requestAnimationFrame(() => {
            scroller.scrollLeft = Math.max(0, scroller.scrollLeft - inset);
        });
    }, [currentStep]);

    return (
        <div ref={scrollerRef} className={styles.scroller} aria-label="Steps scroller">
            <nav className={styles.nav} aria-label="Steps">
                {ordered.map((s) => {
                    const active = s.key === currentStep;
                    const Icon = s.Icon;

                    return (
                        <button
                            key={s.key}
                            data-step={s.key}
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
        </div>
    );
}
