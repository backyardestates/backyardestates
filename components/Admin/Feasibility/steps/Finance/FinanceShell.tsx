"use client";

import styles from "./Finance.module.css";

type FinanceTab = 0 | 1 | 2;

export default function FinanceShell({
    active,
    onTab,
    title,
    helper,
    children,
}: {
    active: FinanceTab;
    onTab: (i: FinanceTab) => void;
    title: string;
    helper?: string;
    children: React.ReactNode;
}) {
    const items = [
        { num: 1, title: "Financing Status", meta: "Secured or exploring" },
        { num: 2, title: "Financing Path", meta: "Common options" },
        { num: 3, title: "Assumptions + Value", meta: "Simple inputs" },
    ] as const;

    return (
        <section className={styles.step}>
            <div className={styles.heroCard}>
                <div className={styles.heroTop}>
                    <div className={styles.heroLeft}>
                        <div className={styles.heroEyebrow}>Step 5</div>
                        <div className={styles.progressBar}>
                            {items.map((it, idx) => {
                                const isActive = idx === active;
                                return (
                                    <button
                                        key={it.num}
                                        type="button"
                                        className={`${styles.progressItem} ${isActive ? styles.progressItemActive : ""}`}
                                        onClick={() => onTab(idx as FinanceTab)}
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

                    <div className={styles.heroRight} />
                </div>

                {children}

            </div>

        </section>
    );
}
