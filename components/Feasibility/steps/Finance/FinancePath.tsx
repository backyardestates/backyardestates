"use client";

import FinanceShell from "./FinanceShell";
import styles from "./Finance.module.css";
import { useAnswersStore } from "@/lib/feasibility/stores/answers.store";
import type { FinanceData, FinancePath } from "@/lib/feasibility/types";

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

export default function FinancePathStep({
    onJump,
}: {
    onJump: (tab: 0 | 1 | 2) => void;
}) {
    const finance = useAnswersStore((s) => (s.answers.finance as FinanceData | undefined) ?? EMPTY_FINANCE);
    const setAnswer = useAnswersStore((s) => s.setAnswer);

    const update = (patch: Partial<FinanceData>) => {
        setAnswer("finance", { ...finance, ...patch });
    };

    const PATH_OPTIONS: Array<{ value: FinancePath; title: string; desc: string }> = [
        { value: "cash", title: "Cash / savings", desc: "Pay without borrowing." },
        { value: "heloc", title: "HELOC", desc: "Borrow against existing home equity." },
        { value: "cash_out_refi", title: "Cash-out refinance", desc: "Refinance and pull equity out." },
        { value: "construction_loan", title: "Construction / renovation loan", desc: "Loan designed for building costs." },
        { value: "personal_loan", title: "Personal loan", desc: "Less common for ADUs, but possible." },
        { value: "other", title: "Other / unsure", desc: "We’ll clarify later." },
    ];

    return (
        <FinanceShell
            active={1}
            onTab={onJump}
            title="Which financing path best describes you?"
            helper="This doesn’t lock you in — it just helps us tailor assumptions and wording in your report."
        >
            <div className={styles.questionGrid}>
                <CardSelect
                    value={finance.path}
                    options={PATH_OPTIONS}
                    onChange={(v) => update({ path: v })}
                />
            </div>
        </FinanceShell>
    );
}
