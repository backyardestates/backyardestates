import styles from "./ConstructionTimeline.module.css";
import { Instagram } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

interface TimelineItem {
    week: number;
    milestone: string;
    description: string;
    imageUrl?: string;
    socialLink?: string;
}

interface ConstructionTimelineProps {
    timeline: TimelineItem[];
}

export default function ConstructionTimeline({ timeline }: ConstructionTimelineProps) {
    if (!timeline || timeline.length === 0) return null;

    return (
        <div>
            <div className={styles.headerSection}>
                <h2 className={styles.sectionTitle}>Construction Timeline</h2>
                <p className={styles.sectionSubtitle}>
                    From groundbreaking to move-in ready in just {timeline.length} weeks
                </p>
            </div>

            {timeline.map((item) => {
                const isOdd = item.week % 2 !== 0;
                return (
                    <div className={styles.timelineContainer} key={item.week}>
                        <div className={`${styles.weekRow} ${isOdd ? styles.left : styles.right}`}>
                            <div className={`${styles.stageRow} ${isOdd ? "odd" : styles.even}`}>
                                <div className={styles.card}>
                                    <div className={styles.cardContent}>
                                        {item.imageUrl && (
                                            <div className={styles.cardMedia}>
                                                <div className={styles.mediaContent}>
                                                    <Image src={item.imageUrl} alt={item.milestone} width={500} height={500} className={styles.image} />
                                                </div>
                                            </div>
                                        )}
                                        {item.socialLink && (
                                            <Link
                                                className={styles.button}
                                                href={item.socialLink}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                            >
                                                <Instagram />
                                                View Updates
                                            </Link>
                                        )}
                                    </div>
                                </div>

                                <div className={styles.textContent}>
                                    <h2>Week {item.week}</h2>
                                    <h3 className={styles.weekTitle}>{item.milestone}</h3>
                                    <p className={styles.weekDescription}>{item.description}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
