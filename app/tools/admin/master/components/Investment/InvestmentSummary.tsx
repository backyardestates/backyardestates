// app/admin/components/Investment/InvestmentSummary.tsx
"use client";

import React from "react";
import type { Scenario } from "@/lib/investment/types";

function money(n?: number) {
    if (typeof n !== "number" || !Number.isFinite(n)) return "—";
    return n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}
function pct(n?: number | null) {
    if (typeof n !== "number" || !Number.isFinite(n)) return "—";
    return `${(n * 100).toFixed(2)}%`;
}

export function InvestmentSummary({
    styles,
    house,
    adus,
}: {
    styles: any;
    house: Scenario | null;
    adus: Scenario[];
}) {
    // Example: pick “best cashflow” ADU
    const bestAdu = [...adus].sort((a, b) => (b.cashflowMonthly ?? 0) - (a.cashflowMonthly ?? 0))[0] ?? null;

    return (
        <section className={styles.card}>
            <h2 className={styles.cardTitle}>Investment Snapshot</h2>

            <div className={styles.cardBody}>
                <div className={styles.row}>
                    <div className={styles.rowLabel}>House monthly cost</div>
                    <div className={styles.rowValue}>{money(house?.monthlyCost)}</div>
                </div>

                <div className={styles.row}>
                    <div className={styles.rowLabel}>House rent (est.)</div>
                    <div className={styles.rowValue}>{money(house?.rentMonthly)}</div>
                </div>

                <div className={styles.row}>
                    <div className={styles.rowLabel}>Best ADU cashflow</div>
                    <div className={styles.rowValue}>
                        {bestAdu ? `${money(bestAdu.cashflowMonthly)} (${bestAdu.title})` : "—"}
                    </div>
                </div>

                <div className={styles.row}>
                    <div className={styles.rowLabel}>Best ADU ROI</div>
                    <div className={styles.rowValue}>{bestAdu ? pct(bestAdu.roi) : "—"}</div>
                </div>

                <div className={styles.row}>
                    <div className={styles.rowLabel}>Year 1 equity boost (best ADU)</div>
                    <div className={styles.rowValue}>{bestAdu ? money(bestAdu.year1EquityBoost) : "—"}</div>
                </div>
            </div>
        </section>
    );
}
