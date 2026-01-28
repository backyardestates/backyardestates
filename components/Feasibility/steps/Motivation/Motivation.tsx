
"use client";

import { useAnswersStore } from "@/lib/feasibility/stores/answers.store";
import styles from "./Motivation.module.css";

interface MotivationProps {
    options: Array<{
        value: string,
        title: string,
        desc: string,
    }>,
}

export default function Motivation({ options }: MotivationProps) {
    const motivation = useAnswersStore((s) => (s.answers.motivation));
    const motivationOther = useAnswersStore((s) => (s.answers.motivationOther as string | undefined) ?? "");
    const setAnswer = useAnswersStore((s) => s.setAnswer);

    return (
        <section className={styles.step}>
            {/* MOTIVATION */}
            <div className={styles.card}>
                <h3 className={styles.sectionTitle}>What’s your primary motivation?</h3>
                <p className={styles.helperText}>
                    This helps us prioritize layout, privacy, and the best construction
                    approach.
                </p>

                <div className={styles.cardGrid}>
                    {options.map((m) => {
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

        </section>
    );
}
