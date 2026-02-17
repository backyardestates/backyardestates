"use client";

import React, { useMemo, useState } from "react";
import styles from "./FinancingTable.module.css";
import type { Floorplan } from "@/lib/rentcast/types";
import {
    evaluateFinancingOptions,
    type FinancingPolicy,
    type FinancingOptionResult,
} from "@/lib/finance/financingEligibility";
import { DEFAULT_FINANCING_POLICY } from "@/lib/finance/financingPolicy";

function asNumber(v: any): number | undefined {
    const n = typeof v === "string" ? Number(v.replace(/[^0-9.]/g, "")) : Number(v);
    return Number.isFinite(n) ? n : undefined;
}

function money(n?: number) {
    if (typeof n !== "number" || !Number.isFinite(n)) return "—";
    return n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}

function pct(n?: number) {
    if (typeof n !== "number" || !Number.isFinite(n)) return "—";
    return `${(n * 100).toFixed(2)}%`;
}

function clamp(n: number, min: number, max: number) {
    return Math.max(min, Math.min(max, n));
}

type Props = {
    owed: string | number;
    propertyValue?: number;

    // ✅ NEW: already chosen from another component
    comparedFloorplans: Floorplan[];
    selectedFloorplanId?: string | null;

    currentFirstPmtMonthly?: number; // sheet uses 0 right now
    termYears?: number; // default 30
};

export function FinancingTable({
    owed,
    propertyValue,
    comparedFloorplans,
    selectedFloorplanId,
    currentFirstPmtMonthly = 0,
    termYears = 30,
}: Props) {
    const owedNum = useMemo(() => (typeof owed === "number" ? owed : asNumber(owed) ?? 0), [owed]);
    const value = propertyValue ?? 0;

    // ---------------------------
    // ✅ Policy knobs (local state) – matches FinancingPolicy exactly
    // ---------------------------
    const [knobs, setKnobs] = useState<{
        cashOutRefiRate: number;
        cashOutRefiMaxLTVs: number[];
        helocRate: number;
        helocMaxCLTV: number;
        cashOutSecondRate: number;
        cashOutSecondMaxCLTV: number;
        renovationRate: number;
        renovationMaxLTV: number;
    }>(() => ({
        cashOutRefiRate: DEFAULT_FINANCING_POLICY.cashOutRefi.rate,
        cashOutRefiMaxLTVs: [...DEFAULT_FINANCING_POLICY.cashOutRefi.maxLTVs],

        helocRate: DEFAULT_FINANCING_POLICY.heloc.rate,
        helocMaxCLTV: DEFAULT_FINANCING_POLICY.heloc.maxCLTV,

        cashOutSecondRate: DEFAULT_FINANCING_POLICY.cashOutSecond.rate,
        cashOutSecondMaxCLTV: DEFAULT_FINANCING_POLICY.cashOutSecond.maxCLTV,

        renovationRate: DEFAULT_FINANCING_POLICY.renovation.rate,
        renovationMaxLTV: DEFAULT_FINANCING_POLICY.renovation.maxLTV,
    }));

    function resetKnobs() {
        setKnobs({
            cashOutRefiRate: DEFAULT_FINANCING_POLICY.cashOutRefi.rate,
            cashOutRefiMaxLTVs: [...DEFAULT_FINANCING_POLICY.cashOutRefi.maxLTVs],

            helocRate: DEFAULT_FINANCING_POLICY.heloc.rate,
            helocMaxCLTV: DEFAULT_FINANCING_POLICY.heloc.maxCLTV,

            cashOutSecondRate: DEFAULT_FINANCING_POLICY.cashOutSecond.rate,
            cashOutSecondMaxCLTV: DEFAULT_FINANCING_POLICY.cashOutSecond.maxCLTV,

            renovationRate: DEFAULT_FINANCING_POLICY.renovation.rate,
            renovationMaxLTV: DEFAULT_FINANCING_POLICY.renovation.maxLTV,
        });
    }

    const policy: FinancingPolicy = useMemo(() => {
        const base = DEFAULT_FINANCING_POLICY;

        return {
            cashOutRefi: {
                maxLTVs: knobs.cashOutRefiMaxLTVs
                    .map((x) => clamp(x, 0.5, 0.97))
                    // keep sorted so the “pick best” logic behaves predictably
                    .sort((a, b) => a - b),
                rate: clamp(knobs.cashOutRefiRate, 0.03, 0.2),
                termYears: base.cashOutRefi.termYears ?? termYears,
            },
            heloc: {
                maxCLTV: clamp(knobs.helocMaxCLTV, 0.6, 0.97),
                rate: clamp(knobs.helocRate, 0.03, 0.2),
                interestOnly: base.heloc.interestOnly,
            },
            cashOutSecond: {
                maxCLTV: clamp(knobs.cashOutSecondMaxCLTV, 0.6, 0.97),
                rate: clamp(knobs.cashOutSecondRate, 0.03, 0.2),
                termYears: base.cashOutSecond.termYears ?? termYears,
            },
            renovation: {
                maxLTV: clamp(knobs.renovationMaxLTV, 0.6, 0.97),
                rate: clamp(knobs.renovationRate, 0.03, 0.2),
                termYears: base.renovation.termYears ?? termYears,
            },
        };
    }, [knobs, termYears]);

    const rows = useMemo(() => {
        if (!value || value <= 0) return [];

        return (comparedFloorplans ?? []).map((fp) => {
            const options = evaluateFinancingOptions(
                {
                    owed: owedNum,
                    value,
                    aduCost: fp.price ?? 0,
                    currentFirstPmtMonthly,
                    termYears,
                },
                policy
            );
            return { fp, options };
        });
    }, [comparedFloorplans, owedNum, value, currentFirstPmtMonthly, termYears, policy]);

    const canRender = value > 0 && owedNum >= 0 && (comparedFloorplans?.length ?? 0) > 0;


    return (
        <section className={styles.wrap}>
            <header className={styles.header}>
                <div>
                    <div className={styles.kicker}>Financing</div>
                    <h3 className={styles.title}>Financing Eligibility Table</h3>
                    <p className={styles.sub}>
                        Tune rates + LTV/CLTV assumptions and instantly recompute eligibility and payments.
                    </p>
                </div>

                <div className={styles.meta}>
                    <div className={styles.metaItem}>
                        <div className={styles.metaLabel}>Owed</div>
                        <div className={styles.metaValue}>{money(owedNum)}</div>
                    </div>
                    <div className={styles.metaItem}>
                        <div className={styles.metaLabel}>Value (AVM)</div>
                        <div className={styles.metaValue}>{money(value)}</div>
                    </div>

                </div>
            </header>

            {/* ✅ Policy editor */}
            <div className={styles.policyCard}>
                <div className={styles.policyHead}>
                    <div>
                        <div className={styles.policyTitle}>Policy knobs</div>
                        <div className={styles.policySub}>
                            These are modeling assumptions — not quotes. Use them to match your spreadsheet.
                        </div>
                    </div>

                    <button type="button" className={styles.resetBtn} onClick={resetKnobs}>
                        Reset
                    </button>
                </div>

                <div className={styles.policyGrid}>
                    <Knob
                        label="Cash-out refi rate"
                        value={knobs.cashOutRefiRate}
                        step={0.0005}
                        onChange={(v) => setKnobs((k) => ({ ...k, cashOutRefiRate: v }))}
                        suffix={pct(knobs.cashOutRefiRate)}
                    />

                    {knobs.cashOutRefiMaxLTVs.map((ltv, i) => (
                        <Knob
                            key={`ltv-${i}`}
                            label={`Cash-out refi max LTV (${i + 1})`}
                            value={ltv}
                            step={0.01}
                            onChange={(v) =>
                                setKnobs((k) => {
                                    const next = [...k.cashOutRefiMaxLTVs];
                                    next[i] = v;
                                    return { ...k, cashOutRefiMaxLTVs: next };
                                })
                            }
                            suffix={pct(ltv)}
                        />
                    ))}

                    <Knob
                        label="HELOC rate"
                        value={knobs.helocRate}
                        step={0.0005}
                        onChange={(v) => setKnobs((k) => ({ ...k, helocRate: v }))}
                        suffix={pct(knobs.helocRate)}
                    />
                    <Knob
                        label="HELOC max CLTV"
                        value={knobs.helocMaxCLTV}
                        step={0.01}
                        onChange={(v) => setKnobs((k) => ({ ...k, helocMaxCLTV: v }))}
                        suffix={pct(knobs.helocMaxCLTV)}
                    />

                    <Knob
                        label="Cash-out 2nd rate"
                        value={knobs.cashOutSecondRate}
                        step={0.0005}
                        onChange={(v) => setKnobs((k) => ({ ...k, cashOutSecondRate: v }))}
                        suffix={pct(knobs.cashOutSecondRate)}
                    />
                    <Knob
                        label="Cash-out 2nd max CLTV"
                        value={knobs.cashOutSecondMaxCLTV}
                        step={0.01}
                        onChange={(v) => setKnobs((k) => ({ ...k, cashOutSecondMaxCLTV: v }))}
                        suffix={pct(knobs.cashOutSecondMaxCLTV)}
                    />

                    <Knob
                        label="Renovation rate"
                        value={knobs.renovationRate}
                        step={0.0005}
                        onChange={(v) => setKnobs((k) => ({ ...k, renovationRate: v }))}
                        suffix={pct(knobs.renovationRate)}
                    />
                    <Knob
                        label="Renovation max LTV"
                        value={knobs.renovationMaxLTV}
                        step={0.01}
                        onChange={(v) => setKnobs((k) => ({ ...k, renovationMaxLTV: v }))}
                        suffix={pct(knobs.renovationMaxLTV)}
                    />
                </div>
            </div>

            {!canRender ? (
                <div className={styles.empty}>
                    Enter an address (to get AVM value) and a valid owed amount, then select a floorplan.
                </div>
            ) : (
                <div className={styles.tableWrap}>
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th className={styles.thLeft}>Floorplan</th>
                                <th className={styles.th}>Cash-Out Refi (best tier)</th>
                                <th className={styles.th}>HELOC</th>
                                <th className={styles.th}>Cash-Out 2nd</th>
                                <th className={styles.th}>Renovation</th>
                            </tr>
                        </thead>

                        <tbody>
                            {rows.map(({ fp, options }) => {
                                const byKey = new Map(options.map((o) => [o.key, o]));

                                // Your evaluator emits cashout_refi_80/90/95 (based on maxLTVs)
                                const refiCandidates = options
                                    .filter((o) => o.key.startsWith("cashout_refi_"))
                                    // prefer the lowest LTV tier that is OK (safer/cheapest)
                                    .sort((a, b) => a.key.localeCompare(b.key));

                                const refiPick =
                                    refiCandidates.find((x) => x.ok) ?? refiCandidates[0];

                                const heloc = byKey.get("heloc");
                                const second = byKey.get("cashout_second");
                                const reno = byKey.get("renovation_single_loan");

                                const isSelected = !!selectedFloorplanId && fp._id === selectedFloorplanId;

                                return (
                                    <tr key={fp._id} className={isSelected ? styles.selectedRow : undefined}>
                                        <td className={styles.tdLeft}>
                                            <div className={styles.fpName}>{fp.name}</div>
                                            <div className={styles.fpSub}>{fp.sqft ? `${fp.sqft} SF` : "—"}</div>
                                            <div className={styles.fpSub}>{money(fp.price ?? 0)}</div>
                                        </td>
                                        <OptionCell option={refiPick} />
                                        <OptionCell option={heloc} />
                                        <OptionCell option={second} />
                                        <OptionCell option={reno} />
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </section>
    );
}

function Knob({
    label,
    value,
    onChange,
    step,
    suffix,
}: {
    label: string;
    value: number;
    onChange: (n: number) => void;
    step?: number;
    suffix?: React.ReactNode;
}) {
    return (
        <label className={styles.knob}>
            <div className={styles.knobTop}>
                <span className={styles.knobLabel}>{label}</span>
                <span className={styles.knobSuffix}>{suffix}</span>
            </div>
            <input
                className={styles.knobInput}
                type="number"
                step={step ?? 0.0005}
                value={Number.isFinite(value) ? value : 0}
                onChange={(e) => onChange(Number(e.target.value))}
            />
        </label>
    );
}

function OptionCell({ option }: { option?: FinancingOptionResult }) {
    const ok = Boolean(option?.ok);

    return (
        <td className={styles.optionTd}>
            <div className={`${styles.finBadge} ${ok ? styles.finBadgeOk : styles.finBadgeBad}`}>
                {ok ? "✅ OK" : "❌ No"}
            </div>

            <div className={styles.finLine}>
                <span className={styles.finKey}>Total PMT</span>
                <span className={styles.finVal}>{money(option?.totalPmtMonthly)}</span>
            </div>

            <div className={styles.finLine}>
                <span className={styles.finKey}>ADU Cost</span>
                <span className={styles.finVal}>{money(option?.aduPmtMonthly)}</span>
            </div>

            <div className={styles.finLine}>
                <span className={styles.finKey}>Max Allowed Loan</span>
                <span className={styles.finVal}>{money(option?.maxAllowedLoan)}</span>
            </div>

            <div className={styles.finLine}>
                <span className={styles.finKey}>Cash (Refi Only)</span>
                <span className={styles.finVal}>{money(option?.cashAvailable)}</span>
            </div>
        </td>
    );
}
