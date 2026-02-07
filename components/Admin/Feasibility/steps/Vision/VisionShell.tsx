"use client";

import styles from "./Motivation.module.css";

type VisionTab = 0 | 1;

export default function VisionShell({
    active,
    onTab,
    title,
    helper,
    children,
}: {
    active: VisionTab;
    onTab: (i: VisionTab) => void;
    title: string;
    helper?: string;
    children: React.ReactNode;
}) {
    const items = [
        { num: 1, title: "ADU Purpose", meta: "Intended Use" },
        { num: 2, title: "ADU Type", meta: "e.g. Detached, Attached" },
    ] as const;

    return (
        <section className={styles.step}>
            {/* HERO */}
            <div className={styles.heroCard}>
                <div className={styles.heroTop}>
                    <div className={styles.heroLeft}>
                        <div className={styles.heroEyebrow}>Step 2</div>
                        <div className={styles.progressBar}>
                            {items.map((it, idx) => {
                                const isActive = idx === active;
                                return (
                                    <button
                                        key={it.num}
                                        type="button"
                                        className={`${styles.progressItem} ${isActive ? styles.progressItemActive : ""}`}
                                        onClick={() => onTab(idx as VisionTab)}
                                    >
                                        <span className={styles.progressTitle}>
                                            <span className={styles.progressNum}>{it.num}</span>
                                            {it.title}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                        <h2 className={styles.heroHeadline}>{title}</h2>
                        {helper ? <p className={styles.heroSubhead}>{helper}</p> : null}
                    </div>
                </div>
                {children}
            </div>
        </section>
    );
}
