"use client";

import React, { useState, useEffect } from "react";
import type { Floorplan } from "@/lib/rentcast/types";
import {
    type DiscountState,
    type CustomDiscount,
    type PresetKey,
    type PresetLike,
    PRESETS,
    catalogToPresets,
    createEmptyDiscountState,
    computeDiscountTotal,
    countDiscounts,
    getDiscountLines,
} from "@/lib/investment/discounts";
import type { DiscountsCatalogSummary } from "../../page";
import { money } from "@/lib/investment/format";
import { evaluateSolarDiscount, type SolarDiscountResult } from "@/lib/investment/solarDiscount";
import s from "./DiscountsPanel.module.css";
import { scopedCompanionKey } from "@/lib/admin/companionKeys";

// The solar preset auto-defaults from FPA eligibility but stays editable (not
// locked). This tells PresetList how to render + toggle the solar row in a
// given context (master editor = applies to all units; per-unit editor = one).
interface SolarRow {
    checked: boolean;
    onToggle: () => void;
    /** Short hint shown on the row, e.g. "Auto · eligible" or "Not eligible". */
    hint?: string;
    /** Tooltip with the eligibility reason. */
    reason?: string;
}

/** FPA-observed site conditions used (with each unit's sqft) to decide solar. */
interface SiteConditions {
    aduType: string | null;
    climateZone: number | null;
}

// ─── localStorage helpers ────────────────────────────────────────────────────

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
    /** DB-backed discount catalog. When provided + non-empty, drives the preset
     *  list, amounts, and total math. Falls back to legacy PRESETS otherwise. */
    discountsCatalog?: DiscountsCatalogSummary;
    /** Normalized address — used to pull the FPA's site conditions so the solar
     *  discount can be auto-applied + locked per unit by eligibility. */
    addressKey?: string;
}

// ─── Preset toggle list ───────────────────────────────────────────────────────

function PresetList({
    state,
    onChange,
    presets,
    solarKey,
    solarRow,
}: {
    state: DiscountState;
    onChange: (next: DiscountState) => void;
    presets: PresetLike[];
    /** Which preset is the solar one (managed outside state.presets). */
    solarKey?: string | null;
    /** Editable solar row state (auto-defaulted from FPA eligibility). */
    solarRow?: SolarRow;
}) {
    // Solar is handled separately (auto-default + per-unit), so exclude it from
    // the normal toggle / select-all / clear behaviour.
    const togglePresets = presets.filter((p) => p.key !== solarKey);
    const allOn = togglePresets.every((p) => state.presets.includes(p.key));
    const anyOn = togglePresets.some((p) => state.presets.includes(p.key));

    function toggle(key: PresetKey) {
        const has = state.presets.includes(key);
        const next = has
            ? state.presets.filter((k) => k !== key)
            : [...state.presets, key];
        onChange({ ...state, presets: next });
    }

    function selectAll() {
        onChange({ ...state, presets: togglePresets.map((p) => p.key) });
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
                {presets.map((p, i) => {
                    const isSolar = !!solarKey && p.key === solarKey && !!solarRow;
                    const on = isSolar ? solarRow!.checked : state.presets.includes(p.key);
                    return (
                        <button
                            key={p.key}
                            className={`${s.presetRow} ${on ? s.presetRowOn : ""} ${i === 0 ? s.presetRowFirst : ""} ${i === presets.length - 1 ? s.presetRowLast : ""}`}
                            onClick={() => (isSolar ? solarRow!.onToggle() : toggle(p.key))}
                            title={isSolar ? solarRow!.reason : undefined}
                            type="button"
                        >
                            <span className={`${s.rowIndicator} ${on ? s.rowIndicatorOn : ""}`}>
                                {on && <span className={s.checkMark}>✓</span>}
                            </span>
                            <span className={s.rowLabel}>
                                {p.label}
                                {isSolar && solarRow!.hint && (
                                    <span className={s.autoTag}>{solarRow!.hint}</span>
                                )}
                            </span>
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
    presets,
    solarKey,
    solarRow,
}: {
    state: DiscountState;
    onChange: (next: DiscountState) => void;
    presets: PresetLike[];
    solarKey?: string | null;
    solarRow?: SolarRow;
}) {
    const total = computeDiscountTotal(state, presets);
    const count = countDiscounts(state);

    return (
        <div className={s.editor}>
            {total > 0 && (
                <div className={s.totalBar}>
                    <span className={s.totalBarLabel}>{count} discount{count !== 1 ? "s" : ""} applied</span>
                    <span className={s.totalBarAmount}>−{money(total)}</span>
                </div>
            )}
            <PresetList state={state} onChange={onChange} presets={presets} solarKey={solarKey} solarRow={solarRow} />
            <CustomList state={state} onChange={onChange} />
        </div>
    );
}

// ─── Main panel ────────────────────────────────────────────────────────────────

export function DiscountsPanel({ selectedAdus, setDiscountAmountByAduId, setDiscountLinesByAduId, discountsCatalog, addressKey }: Props) {
    // Resolve the active preset list: DB catalog (active items only) when
    // supplied, falling back to the legacy PRESETS constants.
    const resolvedPresets: PresetLike[] = React.useMemo(() => {
        if (discountsCatalog && discountsCatalog.items.length > 0) {
            const fromCatalog = catalogToPresets(discountsCatalog.items);
            if (fromCatalog.length > 0) return fromCatalog;
        }
        return PRESETS;
    }, [discountsCatalog]);

    // ── Solar discount: auto-applied + locked per unit by FPA eligibility ─────
    // Pull the architect's site conditions (ADU type + climate zone) for this
    // address; pair them with each unit's sqft via evaluateSolarDiscount(). When
    // the FPA hasn't been submitted (no site conditions), solar falls back to a
    // normal manual preset so the rep stays in control.
    const [siteConditions, setSiteConditions] = useState<SiteConditions | null>(null);
    useEffect(() => {
        let cancelled = false;
        if (!addressKey || addressKey.length < 6) {
            setSiteConditions(null);
            return;
        }
        (async () => {
            try {
                const res = await fetch(`/api/architect/flags?addressKey=${encodeURIComponent(addressKey)}`);
                if (!res.ok) return;
                const data = await res.json();
                if (cancelled) return;
                setSiteConditions((data.siteConditions as SiteConditions | undefined) ?? null);
            } catch {
                /* fail-safe: leave solar manual */
            }
        })();
        return () => { cancelled = true; };
    }, [addressKey]);

    // The preset that represents solar (legacy key or any "solar" catalog slug).
    const solarKey = React.useMemo(() => {
        const p = resolvedPresets.find(
            (x) => x.key === "solarPanels" || /solar/i.test(x.key) || /solar/i.test(x.label),
        );
        return p?.key ?? null;
    }, [resolvedPresets]);

    // Open House is selected by default on every unit; it's a normal editable
    // preset, so the rep can remove or re-add it freely.
    const openHouseKey = React.useMemo(() => {
        const p = resolvedPresets.find(
            (x) => x.key === "openHouse" || /open\s*house/i.test(x.key) || /open\s*house/i.test(x.label),
        );
        return p?.key ?? null;
    }, [resolvedPresets]);

    const solarResultFor = React.useCallback(
        (fp: Floorplan): SolarDiscountResult =>
            evaluateSolarDiscount({
                sqft: fp.sqft ?? null,
                aduType: siteConditions?.aduType ?? null,
                climateZone: siteConditions?.climateZone ?? null,
            }),
        [siteConditions],
    );

    // Decisive per-unit outcome: force on (eligible), force off (ineligible), or
    // leave manual (needs zone / needs input — we never guess on price).
    const solarDecision = React.useCallback(
        (fp: Floorplan): "on" | "off" | "manual" => {
            if (!solarKey || !siteConditions) return "manual";
            const st = solarResultFor(fp).status;
            return st === "eligible" ? "on" : st === "ineligible" ? "off" : "manual";
        },
        [solarKey, siteConditions, solarResultFor],
    );

    // The rep's explicit per-unit solar choice. Absent → fall back to the FPA
    // eligibility default. Persisted alongside the other discount state.
    const [solarByAduId, setSolarByAduId] = useState<Record<string, boolean>>(() =>
        loadLS<Record<string, boolean>>(scopedCompanionKey("dp_solar"), {}),
    );
    useEffect(() => {
        try { localStorage.setItem(scopedCompanionKey("dp_solar"), JSON.stringify(solarByAduId)); } catch { /* quota */ }
    }, [solarByAduId]);

    // Effective solar for a unit: the rep's choice if they set one, else the
    // eligibility default — auto-checked only when decisively eligible.
    const solarChecked = React.useCallback(
        (fp: Floorplan): boolean => solarByAduId[fp._id] ?? (solarDecision(fp) === "on"),
        [solarByAduId, solarDecision],
    );
    function setSolar(fp: Floorplan, on: boolean) {
        setSolarByAduId((prev) => ({ ...prev, [fp._id]: on }));
    }
    function setSolarAll(on: boolean) {
        setSolarByAduId((prev) => {
            const next = { ...prev };
            for (const fp of selectedAdus) next[fp._id] = on;
            return next;
        });
    }

    // Normalize the solar preset inside a discount state to match the unit's
    // effective choice, so totals/lines always reflect what's shown (editable,
    // not forced — the rep can flip it).
    const applySolar = React.useCallback(
        (state: DiscountState, fp: Floorplan): DiscountState => {
            if (!solarKey) return state;
            const want = solarChecked(fp);
            const has = state.presets.includes(solarKey);
            if (want && !has) return { ...state, presets: [...state.presets, solarKey] };
            if (!want && has) return { ...state, presets: state.presets.filter((k) => k !== solarKey) };
            return state;
        },
        [solarKey, solarChecked],
    );

    // Short hint shown on a unit's solar row.
    function solarHint(fp: Floorplan): string | undefined {
        if (!siteConditions) return undefined;
        const st = solarResultFor(fp).status;
        return st === "eligible"
            ? "Auto · eligible"
            : st === "ineligible"
              ? "Not eligible"
              : "Check zone / size";
    }

    // Default master state: Open House pre-selected (rep controls it from there).
    // Only used when there's no saved state yet, so removing it later sticks.
    const [master, setMaster] = useState<DiscountState>(() =>
        loadLS<DiscountState>(
            scopedCompanionKey("dp_master"),
            openHouseKey ? { presets: [openHouseKey], custom: [] } : createEmptyDiscountState(),
        )
    );
    const [customByAduId, setCustomByAduId] = useState<Record<string, DiscountState | null>>(() =>
        loadLS<Record<string, DiscountState | null>>(scopedCompanionKey("dp_custom"), {})
    );
    const [expandedAduId, setExpandedAduId] = useState<string | null>(null);

    useEffect(() => {
        try { localStorage.setItem(scopedCompanionKey("dp_master"), JSON.stringify(master)); } catch { /* quota */ }
    }, [master]);
    useEffect(() => {
        try { localStorage.setItem(scopedCompanionKey("dp_custom"), JSON.stringify(customByAduId)); } catch { /* quota */ }
    }, [customByAduId]);

    useEffect(() => {
        const amounts: Record<string, number> = {};
        const lines: Record<string, { label: string; amount: number }[]> = {};
        for (const fp of selectedAdus) {
            const effective = applySolar(customByAduId[fp._id] ?? master, fp);
            amounts[fp._id] = computeDiscountTotal(effective, resolvedPresets);
            lines[fp._id] = getDiscountLines(effective, resolvedPresets);
        }
        setDiscountAmountByAduId(amounts);
        setDiscountLinesByAduId(lines);
    }, [master, customByAduId, selectedAdus, resolvedPresets, applySolar, setDiscountAmountByAduId, setDiscountLinesByAduId]);

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
                Pick one or more units in Step 1 to manage discounts.
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
                    const effective = applySolar(getEffective(fp._id), fp);
                    const total = computeDiscountTotal(effective, resolvedPresets);
                    const count = countDiscounts(effective);
                    const custom = isCustom(fp._id);
                    const isExpanded = expandedAduId === fp._id;
                    const solarD = solarDecision(fp);

                    return (
                        <div key={fp._id} className={`${s.unitCard} ${custom ? s.unitCardCustom : ""} ${total > 0 ? s.unitCardActive : ""}`}>
                            <div className={s.unitName}>{fp.name}</div>
                            <div className={s.unitAmount}>
                                {total > 0 ? `−${money(total)}` : "—"}
                            </div>
                            <div className={s.unitMeta}>
                                {count > 0 ? `${count} discount${count !== 1 ? "s" : ""}` : "No discounts"}
                            </div>
                            {solarD !== "manual" && (
                                <div
                                    className={`${s.solarChip} ${solarD === "on" ? s.solarChipOn : s.solarChipOff}`}
                                    title={solarResultFor(fp).reason}
                                >
                                    {solarD === "on" ? "Solar eligible" : "Solar not eligible"}
                                </div>
                            )}
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
                        presets={resolvedPresets}
                        solarKey={solarKey}
                        solarRow={
                            solarKey
                                ? {
                                      checked: solarChecked(expandedFp),
                                      onToggle: () => setSolar(expandedFp, !solarChecked(expandedFp)),
                                      hint: solarHint(expandedFp),
                                      reason: siteConditions ? solarResultFor(expandedFp).reason : undefined,
                                  }
                                : undefined
                        }
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
                <DiscountEditor
                    state={master}
                    onChange={setMaster}
                    presets={resolvedPresets}
                    solarKey={solarKey}
                    solarRow={
                        solarKey
                            ? {
                                  checked: selectedAdus.length > 0 && selectedAdus.every((fp) => solarChecked(fp)),
                                  onToggle: () => {
                                      const allOn =
                                          selectedAdus.length > 0 && selectedAdus.every((fp) => solarChecked(fp));
                                      setSolarAll(!allOn);
                                  },
                                  hint: siteConditions ? "Auto · per unit by eligibility" : undefined,
                                  reason: "Solar auto-applies to eligible units; click to set all units.",
                              }
                            : undefined
                    }
                />
            </div>
        </div>
    );
}
