import { useAnswersStore } from "@/lib/feasibility/stores/answers.store";
import styles from "../Motivation/Motivation.module.css";


interface ADUTypeProps {
    options: Array<{
        value: string,
        title: string,
        desc: string,
        meta: string,
    }>,
}

export default function ADUType({ options }: ADUTypeProps) {
    const aduType = useAnswersStore((s) => (s.answers.aduType));
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

        </section>
    );
}
