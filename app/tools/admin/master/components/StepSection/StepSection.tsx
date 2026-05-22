"use client";

import React from "react";
import styles from "./StepSection.module.css";

export function StepSection({
    step,
    title,
    badge,
    children,
}: {
    step: number;
    title: string;
    badge?: string;
    children: React.ReactNode;
}) {
    return (
        <section id={`step-${step}`} className={styles.section}>
            <div className={styles.header}>
                <span className={styles.dot} aria-hidden>{step}</span>
                <span className={styles.separator} aria-hidden>·</span>
                <span className={styles.title}>{title}</span>
                {badge && <span className={styles.badge}>{badge}</span>}
            </div>
            <div className={styles.body}>{children}</div>
        </section>
    );
}
