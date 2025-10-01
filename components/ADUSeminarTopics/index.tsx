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
        subtitle: "Which ADU layout will best suit me?",
        description:
            "Explore the layouts and designs that actually work for your backyard. Leave with a clear picture of what’s possible so you can plan your ADU with confidence.",
    },
    {
        id: 2,
        icon: '/images/adu-seminar/adu-seminar-2.jpg',
        title: "Fast-Track Your Build",
        subtitle: "How can I avoid the common delays most homeowners face?",
        description:
            "Learn insider strategies to speed up permits and approvals. Avoid costly delays and mistakes that slow most homeowners down.",
    },
    {
        id: 3,
        icon: '/images/adu-seminar/adu-seminar-3.png',
        title: "Unlock Hidden Value",
        subtitle: "How can my backyard become a profitable asset?",
        description:
            "Discover how an ADU can increase your property value and generate rental income. Walk away with a clear understanding of how this investment can pay for itself.",
    },
    {
        id: 4,
        icon: '/images/adu-seminar/adu-seminar-4.jpg',
        title: "Plan Your Investment",
        subtitle: "Which numbers and costs should I know before starting?",
        description:
            "Break down all the costs, financing options, and funding strategies. Make smart, confident decisions with a clear picture of your budget and ROI.",
    },
    {
        id: 5,
        icon: '/images/adu-seminar/adu-seminar-5.jpg',
        title: "Your ADU, Your Way",
        subtitle: "How can I create a space that perfectly fits my needs?",
        description:
            "Learn how to personalize every detail—from finishes to functional features—so your ADU reflects your style and meets your daily needs, all while staying on budget.",
    },
    {
        id: 6,
        icon: '/images/adu-seminar/adu-seminar-6.jpg',
        title: "Don’t Miss Out",
        subtitle: "What insider tips do top builders use that most homeowners miss?",
        description:
            "Uncover little-known strategies and features that maximize your ADU’s value. Learn what top builders know so your project stands out and performs at its best.",
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
