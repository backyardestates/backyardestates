import { image } from "@cloudinary/url-gen/qualifiers/source";
import styles from "./ConstructionTimeline.module.css";
import { Camera, Instagram } from "lucide-react";
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
        <div className={styles.timelineContainer}>
            {timelineData.map((item) => {
                const isOdd = item.week % 2 !== 0;
                return (
                    <div key={item.week}
                        className={`${styles.weekRow} ${isOdd ? "odd" : styles.even}`}>
                        <div className={styles.card}>
                            <div className={styles.cardContent}>
                                <div className={styles.cardMedia}>
                                    <div className={styles.mediaContent}>
                                        <img src={item.image} alt={item.title} className={styles.image} />
                                    </div>
                                </div>
                                <button className={styles.button}>
                                    <Instagram className="w-4 h-4 mr-2" />
                                    View Updates
                                </button>
                            </div>

                        </div>
                        <div className={styles.textContent}>
                            <h3 className={styles.weekTitle}>Week {item.week}</h3>
                            <p className={styles.weekDescription}>
                                {item.description}</p>

                        </div>
                    </div>
                );
            })}
        </div>
    );
}
