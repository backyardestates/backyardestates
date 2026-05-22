
"use client";

import { useAnswersStore } from "@/lib/feasibility/stores/answers.store";
import styles from "./Motivation.module.css";
import VisionShell from "./VisionShell";


const MOTIVATION_OPTIONS = [
    { value: "family", title: "Housing for family", desc: "Support parents, adult kids, or multi-generational living." },
    { value: "rental", title: "Rental income", desc: "Offset mortgage or build long-term investment value." },
    { value: "office", title: "Home office / studio", desc: "Dedicated space for work, clients, or creative focus." },
    { value: "guest", title: "Guest housing", desc: "Comfortable space for visitors without disrupting the main home." },
    { value: "value", title: "Increase property value", desc: "Add functional square footage and flexibility for the future." },
    { value: "other", title: "Other", desc: "Tell us what you’re trying to achieve—we’ll map the best path." },
];
export default function Motivation({ onJump }: { onJump: (tab: 0 | 1) => void }) {
    const motivation = useAnswersStore((s) => (s.answers.motivation));
    const motivationOther = useAnswersStore((s) => (s.answers.motivationOther as string | undefined) ?? "");
    const setAnswer = useAnswersStore((s) => s.setAnswer);

    return (
        <VisionShell
            active={0}
            onTab={onJump}
            title="ADU Motivation"
            helper="Select your primary motivation for adding an ADU."
        >
            <div className={styles.card}>
                <div className={styles.cardGrid}>
                    {MOTIVATION_OPTIONS.map((m) => {
                        const active = motivation === m.value;
                        return (
                            <button
                                key={m.value}
                                type="button"
                                className={`${styles.choiceCard} ${active ? styles.choiceCardActive : ""
                                    }`}
                                onClick={() => {
                                    setAnswer("motivation", m.value as any);

                                    // clear "other" text unless "other" is selected
                                    if (m.value !== "other") {
                                        setAnswer("motivationOther", "");
                                    }
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

                {motivation === "other" && (
                    <div className={styles.mt1}>
                        <label className={styles.label}>
                            If “Other”, tell us what you’re aiming for
                        </label>
                        <textarea
                            className={styles.textarea}
                            value={motivationOther ?? ""}
                            placeholder="Example: short-term rental + a quiet office; or a future downsizing plan…"
                            onChange={(e) => setAnswer("motivationOther", e.target.value)}
                        />
                    </div>
                )}
            </div>

        </VisionShell>

    );
}
