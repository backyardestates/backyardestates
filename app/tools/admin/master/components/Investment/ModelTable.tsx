// app/admin/_components/investment/ModelTable.tsx
"use client";

import React from "react";
import type { RowSpec, Scenario } from "@/lib/investment/types";
import styles from "../investmentModel/InvestmentModelTable.module.css";

export function ModelTable({
    rows,
    columns,
    scenarios,
    showDebug,
}: {
    rows: RowSpec[];
    columns: Array<{ key: string; title: string; sqft?: number }>;
    scenarios: Scenario[];
    showDebug: boolean;
}) {
    return (
        <div className={styles.tableWrap}>
            <table className={styles.table}>
                <thead>
                    <tr>
                        <th className={styles.thLeft}> </th>
                        {columns.map((c) => (
                            <th key={c.key} className={styles.th}>
                                <div className={styles.colTitle}>{c.title}</div>
                            </th>
                        ))}
                    </tr>
                </thead>

                <tbody>
                    {rows.map((row, idx) => {
                        // SECTION ROW
                        if (row.type === "section") {
                            return (
                                <tr key={`sec-${idx}`}>
                                    <td className={styles.section} colSpan={columns.length + 1}>
                                        {row.label}
                                    </td>
                                </tr>
                            );
                        }

                        // SPACER ROW
                        if (row.type === "spacer") {
                            return (
                                <tr key={`sp-${idx}`}>
                                    <td className={styles.spacer} colSpan={columns.length + 1} />
                                </tr>
                            );
                        }

                        // NORMAL DATA ROW
                        return (
                            <tr key={`r-${idx}`}>
                                <td className={styles.tdLeft}>{row.label}</td>

                                {scenarios.map((s) => {
                                    const main = row.render ? row.render(s) : "—";
                                    const dbg = row.field ? s.debug?.[row.field as any] : null;

                                    const src = typeof row.source === "function" ? row.source(s) : row.source;

                                    const srcClass =
                                        src === "input"
                                            ? styles.srcInput
                                            : src === "api"
                                                ? styles.srcApi
                                                : src === "calc"
                                                    ? styles.srcCalc
                                                    : styles.srcNeutral;

                                    return (
                                        <td key={`${row.label}-${s.key}`} className={styles.td}>
                                            <div className={`${styles.cellValue} ${styles.badgeValue} ${srcClass}`}>{main}</div>

                                            {showDebug && dbg ? (
                                                <div className={styles.debug}>
                                                    <div className={styles.debugFormula}>{dbg.formula}</div>

                                                    <div className={styles.debugParts}>
                                                        {dbg.parts.map(([k, v, partSrc], i2) => {
                                                            const partClass =
                                                                partSrc === "input"
                                                                    ? styles.srcInput
                                                                    : partSrc === "api"
                                                                        ? styles.srcApi
                                                                        : partSrc === "calc"
                                                                            ? styles.srcCalc
                                                                            : styles.srcNeutral;

                                                            return (
                                                                <div
                                                                    key={`${k}-${i2}`}
                                                                    className={`${styles.debugPart} ${styles.debugPartPill} ${partClass}`}
                                                                >
                                                                    <span className={styles.debugKey}>{k}</span>
                                                                    <span className={styles.debugVal}>{v}</span>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            ) : null}
                                        </td>
                                    );
                                })}
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}
