import styles from "./ADUSeminarTopics.module.css";
import Link from "next/link";
import Image from "next/image";
import {
    Home,
    LayoutGrid,
    Rocket,
    FastForward,
    TrendingUp,
    DollarSign,
    Calculator,
    PenTool,
    Settings,
    Key,
    Eye,
    Instagram,
} from "lucide-react";

const seminarTopics = [
    {
        id: 1,
        icon: '/images/adu-seminar/adu-seminar-1.png',
        title: "Find Your Perfect Fit",
        subtitle: "The ideal ADU layout for your property",
        description:
            "See exactly which ADU floor plans work for your backyard. No guesswork—leave knowing what’s possible for your space and lifestyle.",
    },
    {
        id: 2,
        icon: '/images/adu-seminar/adu-seminar-2.jpg',
        title: "Fast-Track Your Build",
        subtitle: "Skip the delays most homeowners face",
        description:
            "Learn the insider steps to get permits and approvals faster than the typical timeline in your city. Avoid the common mistakes that cost months.",
    },
    {
        id: 3,
        icon: '/images/adu-seminar/adu-seminar-3.png',
        title: "Unlock Hidden Value",
        subtitle: "Turn your backyard into a money-making asset",
        description:
            "Discover the real impact an ADU can have on your property value and potential rental income. Walk away knowing exactly how this investment pays off.",
    },
    {
        id: 4,
        icon: '/images/adu-seminar/adu-seminar-4.jpg',
        title: "Plan Your Investment",
        subtitle: "Know the numbers before you start",
        description:
            "We break down typical costs, financing strategies, and creative ways to fund your ADU so you can make smart decisions without surprises.",
    },
    {
        id: 5,
        icon: '/images/adu-seminar/adu-seminar-5.jpg',
        title: "Your ADU, Your Way",
        subtitle: "Design a space that fits your needs",
        description:
            "From layout tweaks to full custom options, learn how you can make your ADU truly yours while staying on budget and timeline.",
    },
    {
        id: 6,
        icon: '/images/adu-seminar/adu-seminar-6.jpg',
        title: "Don’t Miss Out",
        subtitle: "Secrets only top builders reveal",
        description:
            "Discover opportunities most homeowners overlook—from design tricks to value-boosting features—so your ADU delivers maximum benefit.",
    },
];

export default function ADUSeminarTopics() {
    return (
        <div>
            <div className={styles.headerSection}>
                <h2 className={styles.sectionTitle}>Get Expert Info</h2>
                <p className={styles.sectionSubtitle}>
                    Answers to the exact questions homeowners have
                </p>
            </div>

            {seminarTopics.map((topic, index) => {
                const isOdd = index % 2 !== 0;
                return (
                    <div className={styles.timelineContainer} key={topic.id}>
                        <div className={`${styles.weekRow} ${isOdd ? styles.left : styles.right}`}>
                            <div className={`${styles.stageRow} ${isOdd ? "odd" : styles.even}`}>
                                <div className={styles.card}>
                                    <div className={styles.cardContent}>
                                        <Image src={topic.icon} alt={topic.title} width={500} height={500} className={styles.cardImage} />
                                    </div>
                                </div>

                                <div className={styles.textContent}>
                                    <h3 className={styles.weekTitle}>{topic.title}</h3>
                                    <h4 className={styles.weekSubtitle}>{topic.subtitle}</h4>
                                    <p className={styles.weekDescription}>{topic.description}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
