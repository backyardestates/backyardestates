"use client";

import FinanceShell from "./FinanceShell";
import styles from "./Finance.module.css";
import { useAnswersStore } from "@/lib/feasibility/stores/answers.store";
import type { FinanceData, FinanceStatus } from "@/lib/feasibility/types";

const EMPTY_FINANCE: FinanceData = {};

function CardSelect<T extends string>({
    value,
    options,
    onChange,
}: {
    value: T | undefined;
    options: Array<{ value: T; title: string; desc?: string }>;
    onChange: (v: T) => void;
}) {
    return (
        <div className={styles.cardGrid}>
            {options.map((o) => {
                const active = value === o.value;
                return (
                    <button
                        key={o.value}
                        type="button"
                        className={`${styles.choiceCard} ${active ? styles.choiceCardActive : ""}`}
                        onClick={() => onChange(o.value)}
                    >
                        <div className={styles.choiceTop}>
                            <div className={styles.choiceTitle}>{o.title}</div>
                            <div className={`${styles.choiceDot} ${active ? styles.choiceDotActive : ""}`} aria-hidden />
                        </div>
                        {o.desc ? <div className={styles.choiceDesc}>{o.desc}</div> : null}
                    </button>
                );
            })}
        </div>
    );
}

export default function FinanceStatusStep({
    onJump,
}: {
    onJump: (tab: 0 | 1 | 2) => void;
}) {
    const finance = useAnswersStore((s) => (s.answers.finance as FinanceData | undefined) ?? EMPTY_FINANCE);
    const setAnswer = useAnswersStore((s) => s.setAnswer);

    const update = (patch: Partial<FinanceData>) => {
        setAnswer("finance", { ...finance, ...patch });
    };

    const STATUS_OPTIONS: Array<{ value: FinanceStatus; title: string; desc: string }> = [
        { value: "secured", title: "Financing is secured", desc: "You already have cash or a lending path lined up." },
        { value: "exploring", title: "I’m exploring options", desc: "You want help understanding the most common paths." },
        { value: "not_sure", title: "Not sure yet", desc: "Totally fine — we’ll keep this simple for now." },
    ];

    return (
        <FinanceShell
            active={0}
            onTab={onJump}
            title="Do you already have financing secured?"
            helper="This helps us tailor the feasibility report language and next steps."
        >
            <div className={styles.questionGrid}>
                <CardSelect
                    value={finance.status}
                    options={STATUS_OPTIONS}
                    onChange={(v) => update({ status: v })}
                />
            </div>
        </FinanceShell>
    );
}
