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
// InvestmentCompareSummary.tsx
export function InvestmentCompareSummary({
    styles,
    adus,
    baseCostByAduId,
    setBaseCostByAduId,
    sqftByAduId,
    setSqftByAduId,
    rentByAduId,
    setRentByAduId,
}: {
    styles: any;
    adus: Scenario[];
    baseCostByAduId: Record<string, string>;
    setBaseCostByAduId: React.Dispatch<React.SetStateAction<Record<string, string>>>;
    sqftByAduId: Record<string, string>;
    setSqftByAduId: React.Dispatch<React.SetStateAction<Record<string, string>>>;
    rentByAduId: Record<string, string>;
    setRentByAduId: React.Dispatch<React.SetStateAction<Record<string, string>>>;
}) {
    const list = (adus ?? []).filter((s) => s.kind === "adu");
    const [editingField, setEditingField] = React.useState<string | null>(null);

    const [editingKey, setEditingKey] = React.useState<string | null>(null);

    if (!list.length) { /* ... */ }

    return (
        <section className={styles.results}>
            {list.map((adu) => {
                // scenario key is "adu_<floorplanId>"
                const aduId = adu.key.startsWith("adu_") ? adu.key.slice(4) : adu.key;

                const baseCostEditingKey = `baseCost:${adu.key}`;
                const sqftEditingKey = `sqft:${adu.key}`;
                const rentEditingKey = `rent:${adu.key}`;
                const isEditing = editingKey === adu.key;

                const currentValue = rentByAduId[aduId] ?? "";

                return (
                    <div key={adu.key} className={styles.card}>
                        <h2 className={styles.cardTitle}>{adu.title}</h2>

                        <div className={styles.cardBody}>
                            <div className={styles.row}>
                                <div className={styles.rowLabel}>Sqft</div>
                                <div className={styles.rowValue}>
                                    {editingField === sqftEditingKey ? (
                                        <input
                                            className={styles.input}
                                            autoFocus
                                            value={sqftByAduId[aduId] ?? ""}
                                            onChange={(e) =>
                                                setSqftByAduId((prev) => ({
                                                    ...prev,
                                                    [aduId]: e.target.value,
                                                }))
                                            }
                                            onBlur={() => setEditingField(null)}
                                            onKeyDown={(e) => {
                                                if (e.key === "Enter" || e.key === "Escape") {
                                                    setEditingField(null);
                                                }
                                            }}
                                            placeholder={typeof adu.sqft === "number" ? String(adu.sqft) : "0"}
                                        />
                                    ) : (
                                        <span
                                            style={{ cursor: "pointer" }}
                                            title="Click to edit sqft"
                                            onClick={() => setEditingField(sqftEditingKey)}
                                        >
                                            {typeof adu.sqft === "number" ? `${adu.sqft.toLocaleString()} sqft` : "—"}
                                        </span>
                                    )}
                                </div>
                            </div>
                            <div className={styles.row}>
                                <div className={styles.rowLabel}>Base Cost</div>
                                <div className={styles.rowValue}>
                                    {editingField === baseCostEditingKey ? (
                                        <input
                                            className={styles.input}
                                            autoFocus
                                            value={baseCostByAduId[aduId] ?? ""}
                                            onChange={(e) =>
                                                setBaseCostByAduId((prev) => ({
                                                    ...prev,
                                                    [aduId]: e.target.value,
                                                }))
                                            }
                                            onBlur={() => setEditingField(null)}
                                            onKeyDown={(e) => {
                                                if (e.key === "Enter" || e.key === "Escape") {
                                                    setEditingField(null);
                                                }
                                            }}
                                            placeholder={typeof adu.baseAduPrice === "number" ? String(adu.baseAduPrice) : "0"}
                                        />
                                    ) : (
                                        <span
                                            style={{ cursor: "pointer" }}
                                            title="Click to edit base cost"
                                            onClick={() => setEditingField(baseCostEditingKey)}
                                        >
                                            {money(adu.baseAduPrice)}
                                        </span>
                                    )}
                                </div>
                            </div>

                            <Row styles={styles} label="Site Work" value={money(adu.siteWorkApplied)} />
                            <Row styles={styles} label="Discounts" value={money(adu.discountApplied)} />
                            <Row styles={styles} label="Final Cost" value={money(adu.purchasePrice)} />
                            <Row
                                styles={styles}
                                label="Financed Amount"
                                value={typeof adu.downPaymentRate === "number" ? `${Math.round((1 - adu.downPaymentRate) * 100)}%` : "—"}
                            />
                            <Row styles={styles} label="Cash out-of-pocket" value={money(adu.outOfPocket)} />
                            <Row styles={styles} label="Est. Payment" value={money(adu.monthlyCost)} />

                            {/* ✅ Inline editable rent row */}
                            <div className={styles.row}>
                                <div className={styles.rowLabel}>Estimated Rent</div>
                                <div className={styles.rowValue}>
                                    {isEditing ? (
                                        <input
                                            className={styles.input ?? ""} // use your input class if you have one
                                            autoFocus
                                            value={currentValue}
                                            onChange={(e) =>
                                                setRentByAduId((prev) => ({ ...prev, [aduId]: e.target.value }))
                                            }
                                            onBlur={() => setEditingKey(null)}
                                            onKeyDown={(e) => {
                                                if (e.key === "Enter") setEditingKey(null);
                                                if (e.key === "Escape") setEditingKey(null);
                                            }}
                                            placeholder="$0"
                                        />
                                    ) : (
                                        <span
                                            style={{ cursor: "pointer" }}
                                            title="Click to edit"
                                            onClick={() => setEditingKey(adu.key)}
                                        >
                                            {money(adu.rentMonthly)}
                                        </span>
                                    )}
                                </div>
                            </div>

                            <Row styles={styles} label="Monthly Cashflow" value={money(adu.cashflowMonthly)} />
                            <Row styles={styles} label="Equity Boost" value={money(adu.year1EquityBoost)} />
                            <Row styles={styles} label="Year 5" value={money(adu.year5EquityBoost)} />
                            <Row styles={styles} label="Year 10" value={money(adu.year10EquityBoost)} />
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
