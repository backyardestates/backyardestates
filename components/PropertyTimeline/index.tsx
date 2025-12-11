import styles from "./PropertyTimeline.module.css";
import { PencilLine, FileCheck2, BrickWall } from "lucide-react";

interface PropertyTimeline {
    planning: number;
    permitting: number;
    construction: number;
}

export default function PropertyTimeline({ planning, permitting, construction }: PropertyTimeline) {
    const items = [
        { icon: PencilLine, label: "Planning", value: planning },
        { icon: FileCheck2, label: "Permitting", value: permitting },
        { icon: BrickWall, label: "Construction", value: construction },
    ];

    return (
        <section className={styles.section}>
            <div className={styles.inner}>
                <h2 className={styles.label}>Project Timeline Overview</h2>

                <div className={styles.timelineGrid}>
                    {items.map((item, i) => {
                        const Icon = item.icon;
                        return (
                            <div key={i} className={`${styles.item} fadeInUp`} style={{ animationDelay: `${i * 0.15}s` }}>
                                <Icon className={styles.icon} />

                                <p className={styles.value}>{item.value} weeks</p>
                                <span className={styles.caption}>{item.label}</span>

                                {/* Add Apple-style vertical divider except after last item */}
                                {i < items.length - 1 && <div className={styles.divider} />}
                            </div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}
