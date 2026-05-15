"use client";

import React, { useState, useEffect } from "react";
import type { Floorplan } from "@/lib/rentcast/types";
import {
    type DiscountState,
    type CustomDiscount,
    type PresetKey,
    PRESETS,
    createEmptyDiscountState,
    computeDiscountTotal,
    countDiscounts,
    getDiscountLines,
} from "@/lib/investment/discounts";
import { money } from "@/lib/investment/format";
import s from "./DiscountsPanel.module.css";

// ─── localStorage helpers ────────────────────────────────────────────────────

const LS_MASTER = "dp_master";
const LS_CUSTOM  = "dp_custom";

function loadLS<T>(key: string, fallback: T): T {
    if (typeof window === "undefined") return fallback;
    try {
        const raw = localStorage.getItem(key);
        return raw ? (JSON.parse(raw) as T) : fallback;
    } catch {
        return fallback;
    }
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
    selectedAdus: Floorplan[];
    setDiscountAmountByAduId: React.Dispatch<React.SetStateAction<Record<string, number>>>;
    setDiscountLinesByAduId: React.Dispatch<React.SetStateAction<Record<string, { label: string; amount: number }[]>>>;
}

// ─── Preset toggle list ───────────────────────────────────────────────────────

function PresetList({
    state,
    onChange,
}: {
    state: DiscountState;
    onChange: (next: DiscountState) => void;
}) {
    const allOn = PRESETS.every((p) => state.presets.includes(p.key));
    const anyOn = PRESETS.some((p) => state.presets.includes(p.key));

    function toggle(key: PresetKey) {
        const has = state.presets.includes(key);
        const presets = has
            ? state.presets.filter((k) => k !== key)
            : [...state.presets, key];
        onChange({ ...state, presets });
    }

    function selectAll() {
        onChange({ ...state, presets: PRESETS.map((p) => p.key) });
    }

    function clearAll() {
        onChange({ ...state, presets: [] });
    }

    return (
        <div className={s.presetSection}>
            <div className={s.sectionBar}>
                <span className={s.sectionLabel}>
                    Standard
                    {anyOn && (
                        <span className={s.sectionCount}>{state.presets.length}</span>
                    )}
                </span>
                <div className={s.quickActions}>
                    {!allOn && (
                        <button className={s.quickBtn} onClick={selectAll} type="button">
                            Select all
                        </button>
                    )}
                    {anyOn && (
                        <button className={s.quickBtnDestructive} onClick={clearAll} type="button">
                            Clear
                        </button>
                    )}
                </div>
            </div>
            <div className={s.presetList}>
                {PRESETS.map((p, i) => {
                    const on = state.presets.includes(p.key);
                    return (
                        <button
                            key={p.key}
                            className={`${s.presetRow} ${on ? s.presetRowOn : ""} ${i === 0 ? s.presetRowFirst : ""} ${i === PRESETS.length - 1 ? s.presetRowLast : ""}`}
                            onClick={() => toggle(p.key)}
                            type="button"
                        >
                            <span className={`${s.rowIndicator} ${on ? s.rowIndicatorOn : ""}`}>
                                {on && <span className={s.checkMark}>✓</span>}
                            </span>
                            <span className={s.rowLabel}>{p.label}</span>
                            <span className={`${s.rowAmount} ${on ? s.rowAmountOn : ""}`}>
                                −{money(p.amount)}
                            </span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

// ─── Custom discount rows ─────────────────────────────────────────────────────

function CustomList({
    state,
    onChange,
}: {
    state: DiscountState;
    onChange: (next: DiscountState) => void;
}) {
    function add() {
        const newEntry: CustomDiscount = { id: crypto.randomUUID(), label: "", amount: 0 };
        onChange({ ...state, custom: [...state.custom, newEntry] });
    }

    function update(id: string, patch: Partial<CustomDiscount>) {
        onChange({
            ...state,
            custom: state.custom.map((c) => (c.id === id ? { ...c, ...patch } : c)),
        });
    }

    function remove(id: string) {
        onChange({ ...state, custom: state.custom.filter((c) => c.id !== id) });
    }

    return (
        <div className={s.customSection}>
            <div className={s.sectionBar}>
                <span className={s.sectionLabel}>
                    Custom
                    {state.custom.filter((c) => c.amount > 0).length > 0 && (
                        <span className={s.sectionCount}>
                            {state.custom.filter((c) => c.amount > 0).length}
                        </span>
                    )}
                </span>
            </div>

            {state.custom.length > 0 && (
                <div className={s.customList}>
                    {state.custom.map((c) => {
                        const active = c.amount > 0 && c.label.trim().length > 0;
                        return (
                            <div
                                key={c.id}
                                className={`${s.customRow} ${active ? s.customRowActive : ""}`}
                            >
                                <span className={`${s.rowIndicator} ${active ? s.rowIndicatorOn : s.rowIndicatorCustom}`}>
                                    {active && <span className={s.checkMark}>✓</span>}
                                </span>
                                <input
                                    className={s.labelInput}
                                    type="text"
                                    placeholder="Name (e.g. Contractor referral, Military…)"
                                    value={c.label}
                                    onChange={(e) => update(c.id, { label: e.target.value })}
                                />
                                <div className={s.amountWrap}>
                                    <span className={s.amountPrefix}>−$</span>
                                    <input
                                        className={s.amountInput}
                                        type="number"
                                        min={0}
                                        step={100}
                                        placeholder="0"
                                        value={c.amount === 0 ? "" : c.amount}
                                        onChange={(e) => {
                                            const v = parseFloat(e.target.value);
                                            update(c.id, { amount: isNaN(v) ? 0 : Math.max(0, v) });
                                        }}
                                    />
                                </div>
                                <button
                                    className={s.removeBtn}
                                    onClick={() => remove(c.id)}
                                    title="Remove"
                                    type="button"
                                >
                                    ×
                                </button>
                            </div>
                        );
                    })}
                </div>
            )}

            <button className={s.addBtn} onClick={add} type="button">
                <span className={s.addIcon}>+</span>
                Add custom discount
            </button>
        </div>
    );
}

// ─── Discount editor (presets + custom + total) ───────────────────────────────

function DiscountEditor({
    state,
    onChange,
}: {
    state: DiscountState;
    onChange: (next: DiscountState) => void;
}) {
    const total = computeDiscountTotal(state);
    const count = countDiscounts(state);

    return (
        <div className={s.editor}>
            {total > 0 && (
                <div className={s.totalBar}>
                    <span className={s.totalBarLabel}>{count} discount{count !== 1 ? "s" : ""} applied</span>
                    <span className={s.totalBarAmount}>−{money(total)}</span>
                </div>
            )}
            <PresetList state={state} onChange={onChange} />
            <CustomList state={state} onChange={onChange} />
        </div>
    );
}

// ─── Main panel ────────────────────────────────────────────────────────────────

export function DiscountsPanel({ selectedAdus, setDiscountAmountByAduId, setDiscountLinesByAduId }: Props) {
    const [master, setMaster] = useState<DiscountState>(() =>
        loadLS<DiscountState>(LS_MASTER, createEmptyDiscountState())
    );
    const [customByAduId, setCustomByAduId] = useState<Record<string, DiscountState | null>>(() =>
        loadLS<Record<string, DiscountState | null>>(LS_CUSTOM, {})
    );
    const [expandedAduId, setExpandedAduId] = useState<string | null>(null);

    useEffect(() => {
        try { localStorage.setItem(LS_MASTER, JSON.stringify(master)); } catch { /* quota */ }
    }, [master]);
    useEffect(() => {
        try { localStorage.setItem(LS_CUSTOM, JSON.stringify(customByAduId)); } catch { /* quota */ }
    }, [customByAduId]);

    useEffect(() => {
        const amounts: Record<string, number> = {};
        const lines: Record<string, { label: string; amount: number }[]> = {};
        for (const fp of selectedAdus) {
            const effective = customByAduId[fp._id] ?? master;
            amounts[fp._id] = computeDiscountTotal(effective);
            lines[fp._id] = getDiscountLines(effective);
        }
        setDiscountAmountByAduId(amounts);
        setDiscountLinesByAduId(lines);
    }, [master, customByAduId, selectedAdus, setDiscountAmountByAduId, setDiscountLinesByAduId]);

    function getEffective(aduId: string) { return customByAduId[aduId] ?? master; }
    function isCustom(aduId: string) { return customByAduId[aduId] != null; }

    function handleCustomize(aduId: string) {
        if (!isCustom(aduId)) {
            const snap = master;
            setCustomByAduId((prev) => ({
                ...prev,
                [aduId]: { presets: [...snap.presets], custom: snap.custom.map((c) => ({ ...c })) },
            }));
        }
        setExpandedAduId((prev) => (prev === aduId ? null : aduId));
    }

    function handleReset(aduId: string) {
        setCustomByAduId((prev) => { const n = { ...prev }; delete n[aduId]; return n; });
        if (expandedAduId === aduId) setExpandedAduId(null);
    }

    function handleApplyToAll(aduId: string) {
        setMaster({ ...getEffective(aduId) });
        setCustomByAduId({});
        setExpandedAduId(null);
    }

    if (selectedAdus.length === 0) {
        return (
            <div className={s.empty}>
                Select one or more ADUs in Step 2 to manage discounts.
            </div>
        );
    }

    const expandedFp = expandedAduId
        ? selectedAdus.find((fp) => fp._id === expandedAduId) ?? null
        : null;
    const syncedCount = selectedAdus.filter((fp) => !isCustom(fp._id)).length;

    return (
        <div className={s.panel}>
            {/* ── Unit summary cards ──────────────────────────────────────── */}
            <div className={s.unitRow}>
                {selectedAdus.map((fp) => {
                    const effective = getEffective(fp._id);
                    const total = computeDiscountTotal(effective);
                    const count = countDiscounts(effective);
                    const custom = isCustom(fp._id);
                    const isExpanded = expandedAduId === fp._id;

                    return (
                        <div key={fp._id} className={`${s.unitCard} ${custom ? s.unitCardCustom : ""} ${total > 0 ? s.unitCardActive : ""}`}>
                            <div className={s.unitName}>{fp.name}</div>
                            <div className={s.unitAmount}>
                                {total > 0 ? `−${money(total)}` : "—"}
                            </div>
                            <div className={s.unitMeta}>
                                {count > 0 ? `${count} discount${count !== 1 ? "s" : ""}` : "No discounts"}
                            </div>
                            <div className={`${s.statusPill} ${custom ? s.statusPillCustom : s.statusPillSynced}`}>
                                {custom ? "Custom" : "Synced"}
                            </div>
                            <div className={s.unitActions}>
                                <button
                                    className={`${s.unitBtn} ${isExpanded ? s.unitBtnActive : ""}`}
                                    onClick={() => handleCustomize(fp._id)}
                                    type="button"
                                >
                                    {custom ? (isExpanded ? "Close" : "Edit") : "Customize"}
                                </button>
                                {custom && (
                                    <button
                                        className={s.resetBtn}
                                        onClick={() => handleReset(fp._id)}
                                        title="Reset to default"
                                        type="button"
                                    >✕</button>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* ── Per-unit override editor ────────────────────────────────── */}
            {expandedFp && (
                <div className={s.overridePanel}>
                    <div className={s.overrideHeader}>
                        <div>
                            <span className={s.overrideName}>{expandedFp.name}</span>
                            <span className={s.overrideBadge}>Custom</span>
                        </div>
                        <div className={s.overrideActions}>
                            <button className={s.applyAllBtn} onClick={() => handleApplyToAll(expandedFp._id)} type="button">
                                Apply to all
                            </button>
                            <button className={s.resetDefaultBtn} onClick={() => handleReset(expandedFp._id)} type="button">
                                Reset to default
                            </button>
                        </div>
                    </div>
                    <DiscountEditor
                        state={getEffective(expandedFp._id)}
                        onChange={(next) => setCustomByAduId((prev) => ({ ...prev, [expandedFp._id]: next }))}
                    />
                </div>
            )}

            {/* ── Master editor ───────────────────────────────────────────── */}
            <div className={s.masterSection}>
                <div className={s.masterHeader}>
                    <div>
                        <div className={s.masterTitle}>All units · Default</div>
                        <div className={s.masterSub}>
                            {syncedCount} of {selectedAdus.length} unit{selectedAdus.length !== 1 ? "s" : ""} synced
                            — changes here update all synced units
                        </div>
                    </div>
                </div>
                <DiscountEditor state={master} onChange={setMaster} />
            </div>
        </div>
    );
}
