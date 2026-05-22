"use client";

import React, { useEffect, useMemo } from "react";
import type { Floorplan } from "@/lib/rentcast/types";
import type { Scenario } from "@/lib/investment/types";
import {
    PROPOSAL_FIRST_AMOUNT,
    PROPOSAL_LAST_AMOUNT,
    generateBalloonSchedule,
    generateBalloonFromCatalogDefs,
    getFixedEndpointsFromCatalog,
    sumPaymentEntries,
    type ProposalPaymentEntry,
    type ProposalPaymentSchedule,
    type PaymentMilestoneDefData,
} from "@/lib/investment/proposalPaymentSchedule";
import s from "./PaymentSchedulePanel.module.css";

function money(n: number): string {
    if (!Number.isFinite(n)) return "—";
    return n.toLocaleString("en-US", {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 0,
    });
}

interface Props {
    selectedAdus: Floorplan[];
    aduScenarios: Scenario[];
    /** Per-ADU schedule map. Keys are ADU IDs (`fp._id`). */
    value: Record<string, ProposalPaymentSchedule>;
    onChange: (next: Record<string, ProposalPaymentSchedule>) => void;
    /** Optional DB-backed milestone catalog. */
    milestoneDefs?: PaymentMilestoneDefData[];
}

/** Redistribute the rest of the schedule proportionally so the sum stays
 *  equal to `totalPrice` after `editedIndex` is set to `newAmount`. */
function rebalanceEntries(
    entries: ProposalPaymentEntry[],
    editedIndex: number,
    newAmount: number,
    totalPrice: number,
): ProposalPaymentEntry[] {
    const capped = Math.min(Math.max(0, newAmount), totalPrice);
    const others = entries
        .map((e, i) => ({ e, i }))
        .filter(({ i }) => i !== editedIndex);
    const othersCurrentSum = others.reduce((sum, { e }) => sum + e.amount, 0);
    const othersTarget = Math.max(0, totalPrice - capped);

    const amounts = entries.map((e) => e.amount);
    amounts[editedIndex] = capped;

    if (others.length > 0) {
        if (othersCurrentSum <= 0) {
            const each = Math.floor(othersTarget / others.length);
            others.forEach(({ i }) => { amounts[i] = each; });
        } else {
            const ratio = othersTarget / othersCurrentSum;
            others.forEach(({ e, i }) => {
                amounts[i] = Math.max(0, Math.round(e.amount * ratio));
            });
        }
        // Roll rounding into the last non-edited entry so the sum lands on total.
        const actual = amounts.reduce((s, n) => s + n, 0);
        const delta = totalPrice - actual;
        if (delta !== 0) {
            for (let i = entries.length - 1; i >= 0; i--) {
                if (i === editedIndex) continue;
                amounts[i] = Math.max(0, amounts[i] + delta);
                break;
            }
        }
    }

    return entries.map((e, i) => ({ ...e, amount: amounts[i] }));
}

export function PaymentSchedulePanel({
    selectedAdus,
    aduScenarios,
    value,
    onChange,
    milestoneDefs,
}: Props) {
    const hasCatalog = !!(milestoneDefs && milestoneDefs.length > 0);
    const generate = useMemo(() => {
        return hasCatalog
            ? (total: number) => generateBalloonFromCatalogDefs(total, milestoneDefs!)
            : (total: number) => generateBalloonSchedule(total);
    }, [hasCatalog, milestoneDefs]);

    const endpoints = hasCatalog
        ? getFixedEndpointsFromCatalog(milestoneDefs!)
        : { first: PROPOSAL_FIRST_AMOUNT, last: PROPOSAL_LAST_AMOUNT };

    // Build the canonical list of ADUs to display as columns — one per
    // selected ADU that has a valid total. Carries name + total for headers.
    const aduColumns = useMemo(
        () =>
            selectedAdus
                .map((fp) => {
                    const sc = aduScenarios.find((s) => s.key === `adu_${fp._id}`);
                    const total = sc?.finalAduPrice ?? sc?.purchasePrice ?? 0;
                    return { id: fp._id, name: fp.name, total };
                })
                .filter((c) => c.total > 0),
        [selectedAdus, aduScenarios],
    );

    // Auto-seed a default balloon schedule for any ADU that doesn't already
    // have one. Generator is stable-keyed on the catalog, so this won't loop.
    useEffect(() => {
        if (aduColumns.length === 0) return;
        const next: Record<string, ProposalPaymentSchedule> = { ...value };
        let mutated = false;
        for (const col of aduColumns) {
            if (!next[col.id]) {
                next[col.id] = {
                    aduId: col.id,
                    totalPrice: col.total,
                    entries: generate(col.total),
                };
                mutated = true;
            }
        }
        if (mutated) onChange(next);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [aduColumns.map((c) => `${c.id}|${c.total}`).join(",")]);

    // The milestone rows shown in the table — derived from the first ADU
    // that has a schedule (every schedule uses the same milestone definitions).
    const firstSchedule = aduColumns.map((c) => value[c.id]).find(Boolean);
    const milestoneRows = firstSchedule?.entries ?? [];

    function handleCellChange(aduId: string, milestoneIndex: number, raw: string) {
        const sched = value[aduId];
        if (!sched) return;
        const parsed = parseFloat(raw.replace(/[^0-9.]/g, ""));
        const newAmount = Number.isFinite(parsed) ? Math.max(0, Math.round(parsed)) : 0;

        const nextEntries = rebalanceEntries(
            sched.entries,
            milestoneIndex,
            newAmount,
            sched.totalPrice,
        );
        onChange({
            ...value,
            [aduId]: { ...sched, entries: nextEntries },
        });
    }

    function handleResetAdu(aduId: string) {
        const col = aduColumns.find((c) => c.id === aduId);
        if (!col) return;
        onChange({
            ...value,
            [aduId]: {
                aduId,
                totalPrice: col.total,
                entries: generate(col.total),
            },
        });
    }

    function handleResetAll() {
        const next: Record<string, ProposalPaymentSchedule> = {};
        for (const col of aduColumns) {
            next[col.id] = {
                aduId: col.id,
                totalPrice: col.total,
                entries: generate(col.total),
            };
        }
        onChange(next);
    }

    function handleResyncAdu(aduId: string) {
        const col = aduColumns.find((c) => c.id === aduId);
        if (!col) return;
        onChange({
            ...value,
            [aduId]: {
                aduId,
                totalPrice: col.total,
                entries: generate(col.total),
            },
        });
    }

    if (aduColumns.length === 0) {
        return (
            <div className={s.empty}>
                Pick at least one ADU in Step 2 and finalize its site work / discounts before
                building the payment schedule.
            </div>
        );
    }

    // Compute drift per column so we can flag any whose total has shifted
    // (e.g., the rep added more site work after generating the schedule).
    const drifts = aduColumns.map((col) => {
        const sched = value[col.id];
        const drifted = sched && Math.abs(sched.totalPrice - col.total) > 1;
        return { col, drifted: !!drifted, sched };
    });
    const anyDrift = drifts.some((d) => d.drifted);

    return (
        <div className={s.panel}>
            {/* Drift warnings — one row per column whose model has shifted */}
            {anyDrift && (
                <div className={s.warning}>
                    <div>Some schedules no longer match their ADU&apos;s current total:</div>
                    <ul className={s.warningList}>
                        {drifts.filter((d) => d.drifted).map((d) => (
                            <li key={d.col.id}>
                                <strong>The {d.col.name}</strong> · schedule total {money(d.sched!.totalPrice)} ·
                                current price {money(d.col.total)}
                                <button
                                    type="button"
                                    className={s.linkBtn}
                                    onClick={() => handleResyncAdu(d.col.id)}
                                >
                                    Re-sync
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {/* Multi-column milestone table — one column per ADU */}
            <div
                className={s.tableWrap}
                style={{
                    gridTemplateColumns: `36px minmax(180px, 1.4fr) minmax(160px, 1.2fr) repeat(${aduColumns.length}, minmax(140px, 1fr))`,
                }}
            >
                {/* Header row */}
                <div className={`${s.cell} ${s.headCell}`}>#</div>
                <div className={`${s.cell} ${s.headCell}`}>Milestone</div>
                <div className={`${s.cell} ${s.headCell}`}>Trigger</div>
                {aduColumns.map((col) => (
                    <div key={col.id} className={`${s.cell} ${s.headCell} ${s.headAmount}`}>
                        <div className={s.headAduName}>The {col.name}</div>
                        <div className={s.headAduTotal}>{money(col.total)}</div>
                    </div>
                ))}

                {/* Milestone rows */}
                {milestoneRows.map((row, i) => (
                    <React.Fragment key={row.id}>
                        <div className={s.cell}>{i + 1}</div>
                        <div className={s.cell}>{row.label}</div>
                        <div className={`${s.cell} ${s.triggerCell}`}>{row.trigger}</div>
                        {aduColumns.map((col) => {
                            const sched = value[col.id];
                            const entry = sched?.entries[i];
                            if (!entry) {
                                return (
                                    <div key={col.id} className={`${s.cell} ${s.amountCell} ${s.amountMissing}`}>
                                        —
                                    </div>
                                );
                            }
                            const pct =
                                sched && sched.totalPrice > 0
                                    ? (entry.amount / sched.totalPrice) * 100
                                    : 0;
                            return (
                                <div key={col.id} className={`${s.cell} ${s.amountCell}`}>
                                    <input
                                        type="number"
                                        min={0}
                                        step={100}
                                        className={s.amountInput}
                                        value={entry.amount}
                                        onChange={(e) => handleCellChange(col.id, i, e.target.value)}
                                    />
                                    <span className={s.amountPct}>{pct.toFixed(2)}%</span>
                                </div>
                            );
                        })}
                    </React.Fragment>
                ))}

                {/* Sum row */}
                <div className={`${s.cell} ${s.sumCell}`} />
                <div className={`${s.cell} ${s.sumCell}`}>Sum of payments</div>
                <div className={`${s.cell} ${s.sumCell}`} />
                {aduColumns.map((col) => {
                    const sched = value[col.id];
                    const sum = sched ? sumPaymentEntries(sched.entries) : 0;
                    const variance = sched ? sum - sched.totalPrice : 0;
                    const inSync = Math.abs(variance) < 1;
                    return (
                        <div key={col.id} className={`${s.cell} ${s.sumCell} ${s.amountCell}`}>
                            <strong>{money(sum)}</strong>
                            <span className={inSync ? s.varianceOk : s.varianceOff}>
                                {inSync ? "in sync" : `${variance >= 0 ? "+" : "−"}${money(Math.abs(variance))}`}
                            </span>
                        </div>
                    );
                })}
            </div>

            {/* Actions */}
            <div className={s.actions}>
                <button className={s.button} onClick={handleResetAll}>
                    Reset all to balloon default
                </button>
                <div className={s.note}>
                    Every cell is editable · Defaults seed first to {money(endpoints.first)} and
                    last to {money(endpoints.last)} per column · Editing any cell rebalances the
                    other rows in that ADU&apos;s column proportionally so its total stays the same ·
                    Slide 14 + the agreement use the first ADU&apos;s schedule as the contract version.
                </div>
            </div>
        </div>
    );
}
