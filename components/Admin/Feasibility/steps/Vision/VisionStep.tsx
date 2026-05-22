"use client";

import styles from "./Motivation.module.css";
import { useAnswersStore, MoneyRange } from "@/lib/feasibility/stores/answers.store";
import MotivationShell from "./VisionShell";
import VisionShell from "./VisionShell";


const ADU_TYPE_OPTIONS = [
    {
        value: "detachedNew",
        title: "Detached New Construction",
        desc: "Stand-alone unit with maximum privacy & layout flexibility.",
        meta: "Best for: rentals + multi-gen living",
    },
    {
        value: "attachedNew",
        title: "Attached New Construction",
        desc: "Connected to the main home—often efficient utilities + footprint.",
        meta: "Best for: family + cost control",
    },
    {
        value: "garageConversion",
        title: "Garage Conversion",
        desc: "Fastest path when the structure works (and zoning supports it).",
        meta: "Best for: speed + budget",
    },
    {
        value: "jadu",
        title: "JADU (≤ 500 sq ft)",
        desc: "Within the primary structure—small footprint, big impact.",
        meta: "Best for: simple living + family support",
    },
];

export default function VisionStep({ onJump }: { onJump: (tab: 0 | 1) => void }) {
    const aduType = useAnswersStore((s) => (s.answers.aduType));
    const setAnswer = useAnswersStore((s) => s.setAnswer);

    return (
        <VisionShell
            active={1}
            onTab={onJump}
            title="ADU Type"
            helper="Select what type of ADU you're interested in."
        >
            <div className={styles.card}>
                <div className={styles.cardGrid}>
                    {ADU_TYPE_OPTIONS.map((m) => {
                        const active = aduType === m.value;
                        return (
                            <button
                                key={m.value}
                                type="button"
                                className={`${styles.choiceCard} ${active ? styles.choiceCardActive : ""
                                    }`}
                                onClick={() => {
                                    setAnswer("aduType", m.value as any);

                                }}
                            >
                                <div className={styles.choiceTop}>
                                    <div className={styles.choiceTitle}>{m.title}</div>
                                    <div
                                        className={`${styles.choiceDot} ${active ? styles.choiceDotActive : ""
                                            }`}
                                        aria-hidden
                                    />
                                </div>
                                <div className={styles.choiceDesc}>{m.desc}</div>
                            </button>
                        );
                    })}
                </div>

            </div>
        </VisionShell>
    );
}
