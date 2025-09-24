import { image } from "@cloudinary/url-gen/qualifiers/source";
import styles from "./ConstructionTimeline.module.css";
import { Camera, Instagram } from "lucide-react";
import Link from "next/link";
export const timelineData = [
    {
        week: 1,
        title: "Foundation & Framing",
        description: "Breaking ground and laying the foundation for your future home.",
        image: "/images/backyard-estates-OG.png"
    },
    {
        week: 2,
        title: "Electrical & Plumbing",
        description: "Installing essential systems and infrastructure.",
        image: "/images/backyard-estates-OG.png"

    },
    {
        week: 3,
        title: "Interior Finishes",
        description: "Adding the finishing touches that make it home.",
        image: "/images/backyard-estates-OG.png"

    },
    {
        week: 4,
        title: "Final Walkthrough",
        description: "Final inspections, walkthroughs, and move-in readiness.",
        image: "/images/backyard-estates-OG.png"

    }
];


export default function TimelineGrid() {
    return (
        <div>
            <div className={styles.headerSection}>
                <h2 className={styles.sectionTitle}>Construction Timeline</h2>
                <p className={styles.sectionSubtitle}>From groundbreaking to move-in ready in just {timelineData.length} weeks</p>
            </div>

            {timelineData.map((item) => {
                const isOdd = item.week % 2 !== 0;
                return (
                    <div className={styles.timelineContainer} key={item.week}>
                        <div className={`${styles.weekRow} ${isOdd ? styles.left : styles.right} `}>
                            <div className={`${styles.stageRow} ${isOdd ? "odd" : styles.even}`}>
                                <div className={styles.card}>
                                    <div className={styles.cardContent}>
                                        <div className={styles.cardMedia}>
                                            <div className={styles.mediaContent}>
                                                <img src={item.image} alt={item.title} className={styles.image} />
                                            </div>
                                        </div>
                                        <Link className={styles.button} href="https://www.instagram.com/backyardestates/" target="_blank" rel="noopener noreferrer">
                                            <Instagram />
                                            View Updates
                                        </Link>
                                    </div>

                                </div>
                                <div className={styles.textContent}>
                                    <h2>Week {item.week}</h2>
                                    <h3 className={styles.weekTitle}> {item.title}</h3>
                                    <p className={styles.weekDescription}>
                                        {item.description}</p>

                                </div>
                            </div>

                        </div>
                    </div>

                );
            })}
        </div>
    );
}
