"use client";

import React, { useEffect, useMemo } from "react";
import type { Floorplan } from "@/lib/rentcast/types";
import type { Scenario } from "@/lib/investment/types";
import {
    PROPOSAL_FIRST_AMOUNT,
    PROPOSAL_LAST_AMOUNT,
    generateBalloonSchedule,
    sumPaymentEntries,
    type ProposalPaymentEntry,
    type ProposalPaymentSchedule,
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
    value: ProposalPaymentSchedule | null;
    onChange: (next: ProposalPaymentSchedule | null) => void;
}

export function PaymentSchedulePanel({ selectedAdus, aduScenarios, value, onChange }: Props) {
    // Look up the chosen ADU + its scenario (carries finalAduPrice = base + site work − discounts).
    const aduOptions = useMemo(
        () =>
            selectedAdus
                .map((fp) => {
                    const sc = aduScenarios.find((s) => s.key === `adu_${fp._id}`);
                    const total = sc?.finalAduPrice ?? sc?.purchasePrice ?? 0;
                    return { id: fp._id, name: fp.name, total };
                })
                .filter((o) => o.total > 0),
        [selectedAdus, aduScenarios]
    );

    const selectedAduId = value?.aduId ?? aduOptions[0]?.id ?? "";
    const selectedTotal =
        aduOptions.find((o) => o.id === selectedAduId)?.total ?? 0;

    // Seed a default balloon schedule the first time we have an ADU + a price.
    useEffect(() => {
        if (value) return;
        if (!selectedAduId || selectedTotal <= 0) return;
        onChange({
            aduId: selectedAduId,
            totalPrice: selectedTotal,
            entries: generateBalloonSchedule(selectedTotal),
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedAduId, selectedTotal]);

    // If the user switches ADU OR the underlying total changes, regenerate the
    // default schedule (preserving the user's last selection's edits would
    // make total-vs-sum drift, which we don't want).
    function handleAduChange(nextAduId: string) {
        const opt = aduOptions.find((o) => o.id === nextAduId);
        if (!opt) return;
        onChange({
            aduId: nextAduId,
            totalPrice: opt.total,
            entries: generateBalloonSchedule(opt.total),
        });
    }

    function handleAmountChange(index: number, raw: string) {
        if (!value) return;
        const parsed = parseFloat(raw.replace(/[^0-9.]/g, ""));
        const next = Number.isFinite(parsed) ? Math.round(parsed) : 0;
        const entries = value.entries.map((e, i) =>
            i === index ? { ...e, amount: next } : e
        );
        onChange({ ...value, entries });
    }

    function handleResetBalloon() {
        if (!value) return;
        onChange({
            ...value,
            entries: generateBalloonSchedule(value.totalPrice),
        });
    }

    function handleResnapToCurrentTotal() {
        // If finalAduPrice has shifted (more site work, new discount), pull the
        // fresh total and regenerate around it.
        const opt = aduOptions.find((o) => o.id === selectedAduId);
        if (!opt) return;
        onChange({
            aduId: selectedAduId,
            totalPrice: opt.total,
            entries: generateBalloonSchedule(opt.total),
        });
    }

    const entries: ProposalPaymentEntry[] = value?.entries ?? [];
    const lastIndex = entries.length - 1;
    const currentSum = sumPaymentEntries(entries);
    const variance = currentSum - (value?.totalPrice ?? 0);
    const inSync =
        value !== null && Math.abs(variance) < 1;
    const totalDrifted =
        value !== null && Math.abs((value.totalPrice ?? 0) - selectedTotal) > 1;

    if (aduOptions.length === 0) {
        return (
            <div className={s.empty}>
                Pick at least one ADU in Step 2 and finalize its site work / discounts before
                building the payment schedule.
            </div>
        );
    }

    return (
        <div className={s.panel}>
            {/* Header row — ADU selector + total */}
            <div className={s.header}>
                <label className={s.field}>
                    <span className={s.fieldLabel}>ADU</span>
                    <select
                        className={s.select}
                        value={selectedAduId}
                        onChange={(e) => handleAduChange(e.target.value)}
                    >
                        {aduOptions.map((o) => (
                            <option key={o.id} value={o.id}>
                                {o.name}
                            </option>
                        ))}
                    </select>
                </label>

                <div className={s.totalBlock}>
                    <span className={s.totalLabel}>Total ADU price</span>
                    <span className={s.totalValue}>{money(selectedTotal)}</span>
                    <span className={s.totalNote}>
                        Includes site work + discounts applied
                    </span>
                </div>
            </div>

            {/* Drift warning when the model has changed since schedule generation */}
            {totalDrifted && value && (
                <div className={s.warning}>
                    Schedule total ({money(value.totalPrice)}) differs from the current ADU
                    price ({money(selectedTotal)}).
                    <button className={s.linkBtn} onClick={handleResnapToCurrentTotal}>
                        Re-sync to current total
                    </button>
                </div>
            )}

            {/* Editable milestone table */}
            <div className={s.tableWrap}>
                <div className={`${s.row} ${s.headRow}`}>
                    <div className={s.colNum}>#</div>
                    <div className={s.colLabel}>Milestone</div>
                    <div className={s.colTrigger}>Trigger</div>
                    <div className={s.colAmount}>Amount</div>
                    <div className={s.colPct}>%</div>
                </div>

                {entries.map((entry, i) => {
                    const isFixed = i === 0 || i === lastIndex;
                    const pct =
                        value && value.totalPrice > 0
                            ? (entry.amount / value.totalPrice) * 100
                            : 0;
                    return (
                        <div
                            key={entry.id}
                            className={`${s.row} ${isFixed ? s.rowFixed : ""}`}
                        >
                            <div className={s.colNum}>{i + 1}</div>
                            <div className={s.colLabel}>{entry.label}</div>
                            <div className={s.colTrigger}>{entry.trigger}</div>
                            <div className={s.colAmount}>
                                {isFixed ? (
                                    <span className={s.lockedAmount}>
                                        {money(entry.amount)}
                                        <span className={s.lockTag}>fixed</span>
                                    </span>
                                ) : (
                                    <input
                                        type="number"
                                        min={0}
                                        step={100}
                                        className={s.amountInput}
                                        value={entry.amount}
                                        onChange={(e) =>
                                            handleAmountChange(i, e.target.value)
                                        }
                                    />
                                )}
                            </div>
                            <div className={s.colPct}>{pct.toFixed(2)}%</div>
                        </div>
                    );
                })}

                {/* Sum + variance footer */}
                <div className={`${s.row} ${s.sumRow}`}>
                    <div className={s.colNum} />
                    <div className={s.colLabel}>Sum of payments</div>
                    <div className={s.colTrigger} />
                    <div className={s.colAmount}>
                        <strong>{money(currentSum)}</strong>
                    </div>
                    <div className={s.colPct}>
                        {value && value.totalPrice > 0
                            ? `${((currentSum / value.totalPrice) * 100).toFixed(2)}%`
                            : "—"}
                    </div>
                </div>

                <div className={`${s.row} ${s.sumRow}`}>
                    <div className={s.colNum} />
                    <div className={s.colLabel}>Variance vs total</div>
                    <div className={s.colTrigger} />
                    <div
                        className={`${s.colAmount} ${
                            inSync ? s.varianceOk : s.varianceOff
                        }`}
                    >
                        <strong>
                            {variance >= 0 ? "+" : "−"}
                            {money(Math.abs(variance))}
                        </strong>
                    </div>
                    <div className={s.colPct}>
                        {inSync ? "in sync" : "off"}
                    </div>
                </div>
            </div>

            {/* Action row */}
            <div className={s.actions}>
                <button className={s.button} onClick={handleResetBalloon}>
                    Reset to balloon default
                </button>
                <div className={s.note}>
                    First payment is locked to {money(PROPOSAL_FIRST_AMOUNT)} ·
                    Last payment is locked to {money(PROPOSAL_LAST_AMOUNT)} ·
                    Edits broadcast live to the presenter.
                </div>
            </div>
        </div>
    );
}
