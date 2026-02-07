"use client";

import { useMemo } from "react";
import { useAnswersStore } from "@/lib/feasibility/stores/answers.store";
import type { FinanceData, FinancePath, FinanceStatus } from "@/lib/feasibility/types";
import { toNumberOrUndefined } from "@/lib/feasibility/utils/number";

// If you have an existing css module for step layout, import it.
// Otherwise create FinanceStep.module.css later.
import styles from "./Finance.module.css";

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

function YesNo({
    value,
    onChange,
    yesLabel = "Yes",
    noLabel = "No",
}: {
    value: "yes" | "no" | undefined;
    onChange: (v: "yes" | "no") => void;
    yesLabel?: string;
    noLabel?: string;
}) {
    return (
        <div className={styles.pillRow}>
            <button
                type="button"
                className={`${styles.pill} ${value === "yes" ? styles.pillActive : ""}`}
                onClick={() => onChange("yes")}
            >
                {yesLabel}
            </button>
            <button
                type="button"
                className={`${styles.pill} ${value === "no" ? styles.pillActive : ""}`}
                onClick={() => onChange("no")}
            >
                {noLabel}
            </button>
        </div>
    );
}

export default function FinanceStep() {
    const finance = useAnswersStore(
        (s) => (s.answers.finance as FinanceData | undefined) ?? EMPTY_FINANCE
    );

    const setAnswer = useAnswersStore((s) => s.setAnswer);

    const update = (patch: Partial<FinanceData>) => {
        setAnswer("finance", { ...finance, ...patch });
    };

    const STATUS_OPTIONS: Array<{ value: FinanceStatus; title: string; desc: string }> = [
        {
            value: "secured",
            title: "Financing is secured",
            desc: "You already have cash or a lending path lined up.",
        },
        {
            value: "exploring",
            title: "I’m exploring financing options",
            desc: "You want help understanding the most common paths.",
        },
        {
            value: "not_sure",
            title: "Not sure yet",
            desc: "Totally fine — we’ll keep this simple for now.",
        },
    ];

    const PATH_OPTIONS: Array<{ value: FinancePath; title: string; desc: string }> = [
        { value: "cash", title: "Cash / savings", desc: "Pay without borrowing." },
        { value: "heloc", title: "HELOC", desc: "Borrow against existing home equity." },
        { value: "cash_out_refi", title: "Cash-out refinance", desc: "Refinance and pull equity out." },
        { value: "construction_loan", title: "Construction / renovation loan", desc: "Loan designed for building costs." },
        { value: "personal_loan", title: "Personal loan", desc: "Less common for ADUs, but possible." },
        { value: "other", title: "Other / unsure", desc: "We’ll clarify later." },
    ];

    const term = finance.termMonths ?? 360;
    const rate = finance.ratePct ?? 7.5;

    const showValueInputs = finance.wantsValueBoostAnalysis === "yes";

    // (Optional) you can display lightweight helper copy (not a breakdown)
    const statusKicker = useMemo(() => {
        if (finance.status === "secured") return "Great — we’ll tailor the report to your plan.";
        if (finance.status === "exploring") return "No worries — we’ll keep assumptions simple for now.";
        return "All good — you can skip anything you don’t know yet.";
    }, [finance.status]);

    return (
        <section className={styles.step}>
            <div className={styles.card}>
                <h3 className={styles.sectionTitle}>Financing</h3>
                <p className={styles.helperText}>
                    This step helps us tailor your feasibility report and (later) generate a financial summary.
                    You can enter rough estimates — no need for perfect numbers.
                </p>

                {/* Step 1: Status */}
                <div className={styles.block}>
                    <h4 className={styles.blockTitle}>Do you already have financing secured?</h4>
                    <p className={styles.blockSub}>{statusKicker}</p>

                    <CardSelect
                        value={finance.status}
                        options={STATUS_OPTIONS}
                        onChange={(v) => update({ status: v })}
                    />
                </div>

                {/* Step 2: Path (for both scenarios) */}
                <div className={styles.block}>
                    <h4 className={styles.blockTitle}>Which financing path best describes you?</h4>
                    <p className={styles.blockSub}>
                        This doesn’t lock you in — it just helps us tailor the report language and assumptions.
                    </p>

                    <CardSelect
                        value={finance.path}
                        options={PATH_OPTIONS}
                        onChange={(v) => update({ path: v })}
                    />
                </div>

                {/* Keep 5,6,7 */}
                <div className={styles.block}>
                    <h4 className={styles.blockTitle}>Basic assumptions (estimate is fine)</h4>

                    <div className={styles.inputGrid2}>
                        <div>
                            <label className={styles.label}>Down payment (estimate)</label>
                            <input
                                className={styles.input}
                                value={finance.downPayment?.toString() ?? ""}
                                placeholder="Example: 50000"
                                onChange={(e) => update({ downPayment: toNumberOrUndefined(e.target.value) })}
                            />
                            <div className={styles.inputHint}>If you’re paying cash, you can leave this blank.</div>
                        </div>

                        <div>
                            <label className={styles.label}>Loan term</label>
                            <select
                                className={styles.select}
                                value={String(term)}
                                onChange={(e) => update({ termMonths: Number(e.target.value) as 180 | 240 | 360 })}
                            >
                                <option value="180">15 years</option>
                                <option value="240">20 years</option>
                                <option value="360">30 years</option>
                            </select>
                            <div className={styles.inputHint}>Choose what’s closest.</div>
                        </div>
                    </div>

                    <div className={styles.inputGrid1}>
                        <div>
                            <label className={styles.label}>Interest rate assumption (%)</label>
                            <input
                                className={styles.input}
                                value={rate.toString()}
                                placeholder="Example: 7.5"
                                onChange={(e) => update({ ratePct: toNumberOrUndefined(e.target.value) })}
                            />
                            <div className={styles.inputHint}>Used later for a report snapshot (not a quote).</div>
                        </div>
                    </div>
                </div>

                {/* Improved Step 11 */}
                <div className={styles.block}>
                    <h4 className={styles.blockTitle}>Do you want an estimate of how an ADU could boost your property value?</h4>
                    <p className={styles.blockSub}>
                        If you say yes, we’ll include a value-boost section in your feasibility report. (You can skip the numbers if you don’t know them.)
                    </p>

                    <YesNo
                        value={finance.wantsValueBoostAnalysis}
                        onChange={(v) => {
                            if (v === "no") {
                                update({
                                    wantsValueBoostAnalysis: "no",
                                    homeValueEstimate: null,
                                    mortgageBalance: null,
                                });
                            } else {
                                update({ wantsValueBoostAnalysis: "yes" });
                            }
                        }}
                        yesLabel="Yes, include it"
                        noLabel="No, skip it"
                    />

                    {showValueInputs ? (
                        <div className={styles.inputGrid2}>
                            <div>
                                <label className={styles.label}>Current home value (estimate)</label>
                                <input
                                    className={styles.input}
                                    value={finance.homeValueEstimate?.toString() ?? ""}
                                    placeholder="Example: 750000"
                                    onChange={(e) => update({ homeValueEstimate: toNumberOrUndefined(e.target.value) ?? null })}
                                />
                                <div className={styles.inputHint}>Rough estimate is okay.</div>
                            </div>

                            <div>
                                <label className={styles.label}>Current mortgage balance (optional)</label>
                                <input
                                    className={styles.input}
                                    value={finance.mortgageBalance?.toString() ?? ""}
                                    placeholder="Optional"
                                    onChange={(e) => update({ mortgageBalance: toNumberOrUndefined(e.target.value) ?? null })}
                                />
                                <div className={styles.inputHint}>Optional — helps refine equity context.</div>
                            </div>
                        </div>
                    ) : null}
                </div>
            </div>
        </section>
    );
}
