"use client";

import { useMemo } from "react";
import { useAnswersStore } from "@/lib/feasibility/stores/answers.store";
import type { FinanceData } from "@/lib/feasibility/types";
import FinanceShell from "./FinanceShell";
import FinanceSlider from "./FinanceSlider";
import styles from "./Finance.module.css";
import { toNumberOrUndefined } from "@/lib/feasibility/utils/number";

const EMPTY_FINANCE: FinanceData = {};

const money = (n: number) => `$${Math.round(n).toLocaleString()}`;

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

export default function FinanceAssumptionsStep({
    onJump,
}: {
    onJump: (tab: 0 | 1 | 2) => void;
}) {
    const finance = useAnswersStore((s) => (s.answers.finance as FinanceData | undefined) ?? EMPTY_FINANCE);
    const setAnswer = useAnswersStore((s) => s.setAnswer);

    const estimatedTotalCost = useAnswersStore((s) => {
        const v = s.answers.selectedFloorplan?.price || 250000;
        return v;
    });

    const update = (patch: Partial<FinanceData>) => {
        setAnswer("finance", { ...finance, ...patch });
    };
    const roundUpTo = (n: number, step: number) => Math.ceil(n / step) * step;
    const DP_STEP = 5000;

    const dpMax = useMemo(() => {
        const raw = Math.max(0, estimatedTotalCost * 0.4);
        return roundUpTo(raw, DP_STEP);
    }, [estimatedTotalCost]);

    const dpStep = DP_STEP;

    const downPayment = finance.downPayment ?? 0;

    // ✅ loan term slider values
    const term = finance.termMonths ?? 360;

    // ✅ interest rate slider values 4–10
    const rate = finance.ratePct ?? 7;

    const showValueInputs = finance.wantsValueBoostAnalysis === "yes";

    return (
        <FinanceShell
            active={2}
            onTab={onJump}
            title="Basic assumptions + property value boost"
            helper="These are rough inputs so we can generate a meaningful report later. No need for perfect numbers."
        >
            <div className={styles.questionGrid}>
                <div className={styles.qCard}>
                    <div className={styles.qTop}>
                        <div className={styles.qIndex}>3</div>
                        <div className={styles.qMain}>
                            <div className={styles.qHeader}>
                                <div className={styles.qTitleBlock}>
                                    <h3 className={styles.qTitle}>Basic assumptions (estimate is fine)</h3>
                                    <p className={styles.qDesc}>
                                        We’ll base the slider range on your selected floorplan cost when available. Current estimate: <b>{money(estimatedTotalCost)}</b>
                                    </p>
                                </div>
                            </div>

                            <div className={styles.answerBlock}>
                                <div className={styles.inputGrid1}>
                                    <FinanceSlider
                                        label="Down payment (estimate)"
                                        value={Math.min(downPayment, dpMax)}
                                        min={0}
                                        max={dpMax}
                                        step={dpStep}
                                        format={money}
                                        onChange={(v) => update({ downPayment: v })}
                                        hint={finance.path === "cash" ? "If paying cash, this can represent cash you’d allocate (optional)." : "Used later for payment assumptions."}
                                    />
                                </div>

                                <div className={styles.inputGrid1}>
                                    <FinanceSlider
                                        label="Loan term"
                                        value={term}
                                        min={180}
                                        max={360}
                                        step={60}
                                        format={(n) => `${Math.round(n / 12)} years`}
                                        onChange={(v) => update({ termMonths: v as 180 | 240 | 360 })}
                                        hint="Slide to 15 / 20 / 25 / 30 years."
                                    />
                                </div>

                                <div className={styles.inputGrid1}>
                                    <FinanceSlider
                                        label="Interest rate assumption"
                                        value={rate}
                                        min={4}
                                        max={10}
                                        step={0.25}
                                        format={(n) => `${n.toFixed(2)}%`}
                                        onChange={(v) => update({ ratePct: v })}
                                        hint="Used later for a snapshot (not a quote)."
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className={styles.detailTitle2}>Property value boost</div>
            <h4 className={styles.qTitle}>Do you want an estimate of how an ADU could boost your property value?</h4>
            <p className={styles.qDesc}>
                If you say yes, we’ll include a value-boost section in your feasibility report. You can skip numbers if you don’t know them.
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
        </FinanceShell >
    );
}
