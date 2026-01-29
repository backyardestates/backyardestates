"use client";

import styles from "./SiteSpecificWork.module.css";

type SiteSpecificTab = 0 | 1 | 2;

export default function SiteSpecificShell({
    active,
    onTab,
    title,
    helper,
    children,
}: {
    active: SiteSpecificTab;
    onTab: (i: SiteSpecificTab) => void;
    title: string;
    helper?: string;
    children: React.ReactNode;
}) {
    const items = [
        { num: 1, title: "What’s Included", meta: "Base scope" },
        { num: 2, title: "Optional Upgrades", meta: "Nice-to-have add-ons" },
        { num: 3, title: "Additional Site-Specific Work", meta: "Property-dependent" },
    ] as const;

    return (
        <section className={styles.step}>
            {/* HERO */}
            <div className={styles.heroCard}>
                <div className={styles.heroTop}>
                    <div className={styles.heroLeft}>
                        <div className={styles.heroEyebrow}>Step 3</div>
                        <div className={styles.progressBar}>
                            {items.map((it, idx) => {
                                const isActive = idx === active;
                                return (
                                    <button
                                        key={it.num}
                                        type="button"
                                        className={`${styles.progressItem} ${isActive ? styles.progressItemActive : ""}`}
                                        onClick={() => onTab(idx as SiteSpecificTab)}
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
