"use client";

import React from "react";
import type { Scenario } from "@/lib/investment/types";

function money(n?: number) {
    if (typeof n !== "number" || !Number.isFinite(n)) return "—";
    return n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}

function pct(n?: number | null) {
    if (typeof n !== "number" || !Number.isFinite(n)) return "—";
    return `${(n * 100).toFixed(1)}%`;
}

/**
 * Shows the exact outputs you asked for, for EACH compared ADU.
 * Expects only ADU scenarios (kind === "adu"), but will safely handle anything.
 */
export function InvestmentCompareSummary({
    styles,
    adus,
}: {
    styles: any; // pass AdminMasterClient.module.css in
    adus: Scenario[];
}) {
    const list = (adus ?? []).filter((s) => s.kind === "adu");

    if (!list.length) {
        return (
            <section className={styles.card}>
                <h2 className={styles.cardTitle}>ADU Comparison Snapshot</h2>
                <div className={styles.cardBody}>
                    <div className={styles.empty}>No ADUs selected for comparison.</div>
                </div>
            </section>
        );
    }

    return (
        <section className={styles.results}>
            {list.map((adu) => {
                // “Equity Boost” = your Year 1 equity boost (avg of income + sqft + premium)
                // If you truly want only income + sqft (no premium), see note below.
                const equityBoost = adu.year1EquityBoost;
                console.log(adu)

                return (
                    <div key={adu.key} className={styles.card}>
                        <h2 className={styles.cardTitle}>{adu.title}</h2>

                        <div className={styles.cardBody}>
                            {/* Est at e 1200 (sqft) */}
                            {/* <Row styles={styles} label="Estimate at" value={adu.sqft ? `${adu.sqft.toLocaleString()} sf` : "—"} /> */}

                            {/* Financed Amount : 100%  -> derived from downPaymentRate */}
                            <Row styles={styles} label="Cost" value={money(adu.purchasePrice)} />
                            <Row
                                styles={styles}
                                label="Financed Amount"
                                value={
                                    typeof adu.downPaymentRate === "number"
                                        ? `${Math.round((1 - adu.downPaymentRate) * 100)}%`
                                        : "—"
                                }
                            />

                            {/* Cash out-of-pocket */}
                            <Row styles={styles} label="Cash out-of-pocket" value={money(adu.outOfPocket)} />

                            {/* Equity Boost */}
                            <Row styles={styles} label="Equity Boost" value={money(equityBoost)} />
                            <Row styles={styles} label="Year 5" value={money(adu.year5EquityBoost)} />
                            <Row styles={styles} label="Year 10" value={money(adu.year10EquityBoost)} />

                            {/* (Income and square footage approach) - show both numbers explicitly */}
                            {/* <Row styles={styles} label="Income approach" value={money(adu.incomeValue)} />
                            <Row styles={styles} label="Sqft approach" value={money(adu.sqftValue)} /> */}

                            {/* Estimated Rent */}
                            <Row styles={styles} label="Estimated Rent" value={money(adu.rentMonthly)} />

                            {/* Estimated Payment (your monthlyCost includes mtg + tax + insurance + maintenance) */}
                            <Row styles={styles} label="Est. Payment" value={money(adu.monthlyCost)} />

                            {/* (6.5% 30 Yr Term) */}
                            {/* <Row
                                styles={styles}
                                label="Loan terms"
                                value={
                                    typeof adu.interestRate === "number" && typeof adu.termYears === "number"
                                        ? `${(adu.interestRate * 100).toFixed(1)}% • ${adu.termYears} yr`
                                        : "—"
                                }
                            /> */}

                            {/* Monthly Cashflow */}
                            <Row styles={styles} label="Monthly Cashflow" value={money(adu.cashflowMonthly)} />

                            {/* Return on investment */}
                            <Row styles={styles} label="Return on investment" value={pct(adu.roi)} />
                        </div>
                    </div>
                );
            })}
        </section>
    );
}

function Row({ styles, label, value }: { styles: any; label: string; value: string }) {
    return (
        <div className={styles.row}>
            <div className={styles.rowLabel}>{label}</div>
            <div className={styles.rowValue}>{value}</div>
        </div>
    );
}
