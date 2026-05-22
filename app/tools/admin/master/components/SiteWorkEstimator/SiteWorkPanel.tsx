"use client";

import React, { useState, useMemo, useEffect } from "react";
import type { Floorplan } from "@/lib/rentcast/types";
import {
    type EstimatorState,
    type SiteWorkCatalogData,
    type SiteWorkCategory,
    SITE_WORK_CATEGORIES,
    computeTotal,
    createEmptyState,
    catalogToSiteWorkCategories,
} from "@/lib/investment/siteWorkItems";
import { money } from "@/lib/investment/format";
import { SiteWorkEstimator } from "./SiteWorkEstimator";
import { SiteWorkSearch, type PresenceEntry } from "./SiteWorkSearch";
import s from "./SiteWorkPanel.module.css";

const LS_MASTER_KEY = "swp_master";
const LS_CUSTOM_KEY = "swp_custom";

function loadLS<T>(key: string, fallback: T): T {
    if (typeof window === "undefined") return fallback;
    try {
        const raw = localStorage.getItem(key);
        return raw ? (JSON.parse(raw) as T) : fallback;
    } catch {
        return fallback;
    }
}

interface Props {
    selectedAdus: Floorplan[];
    estimatorByAduId: Record<string, EstimatorState>;
    setEstimatorByAduId: React.Dispatch<React.SetStateAction<Record<string, EstimatorState>>>;
    catalog?: SiteWorkCatalogData;
}

export function SiteWorkPanel({ selectedAdus, setEstimatorByAduId, catalog }: Props) {
    // Resolved category list (DB catalog → fallback to legacy const). Item ids
    // are stripped of their slug prefix so EstimatorState keys still match.
    const resolvedCategories: SiteWorkCategory[] = useMemo(() => {
        if (catalog && catalog.categories.length > 0) {
            const fromCatalog = catalogToSiteWorkCategories(catalog);
            if (fromCatalog.length > 0) return fromCatalog;
        }
        return SITE_WORK_CATEGORIES;
    }, [catalog]);

    const [masterEstimator, setMasterEstimator] = useState<EstimatorState>(() =>
        loadLS<EstimatorState>(LS_MASTER_KEY, createEmptyState())
    );
    // null = synced to master; EstimatorState = custom override
    const [customByAduId, setCustomByAduId] = useState<Record<string, EstimatorState | null>>(() =>
        loadLS<Record<string, EstimatorState | null>>(LS_CUSTOM_KEY, {})
    );

    // Persist to localStorage whenever state changes
    useEffect(() => {
        try { localStorage.setItem(LS_MASTER_KEY, JSON.stringify(masterEstimator)); } catch { /* quota */ }
    }, [masterEstimator]);

    useEffect(() => {
        try { localStorage.setItem(LS_CUSTOM_KEY, JSON.stringify(customByAduId)); } catch { /* quota */ }
    }, [customByAduId]);
    const [expandedAduId, setExpandedAduId] = useState<string | null>(null);

    // Keep estimatorByAduId in sync with effective states
    useEffect(() => {
        setEstimatorByAduId(() => {
            const next: Record<string, EstimatorState> = {};
            for (const fp of selectedAdus) {
                next[fp._id] = customByAduId[fp._id] ?? masterEstimator;
            }
            return next;
        });
    }, [masterEstimator, customByAduId, selectedAdus, setEstimatorByAduId]);

    function getEffective(aduId: string): EstimatorState {
        return customByAduId[aduId] ?? masterEstimator;
    }

    function isCustom(aduId: string): boolean {
        return customByAduId[aduId] != null;
    }

    function syncedCount(): number {
        return selectedAdus.filter((fp) => !isCustom(fp._id)).length;
    }

    function handleCustomize(aduId: string) {
        if (!isCustom(aduId)) {
            // Deep-copy master as the starting point for this unit's override
            setCustomByAduId((prev) => ({
                ...prev,
                [aduId]: {
                    quantities: { ...masterEstimator.quantities },
                    customItems: masterEstimator.customItems.map((ci) => ({ ...ci })),
                    overrides: { ...(masterEstimator.overrides ?? {}) },
                },
            }));
        }
        setExpandedAduId((prev) => (prev === aduId ? null : aduId));
    }

    function handleUnitChange(aduId: string, next: EstimatorState) {
        setCustomByAduId((prev) => ({ ...prev, [aduId]: next }));
    }

    function handleReset(aduId: string) {
        setCustomByAduId((prev) => {
            const next = { ...prev };
            delete next[aduId];
            return next;
        });
        if (expandedAduId === aduId) setExpandedAduId(null);
    }

    function handleApplyToAll(aduId: string) {
        setMasterEstimator(getEffective(aduId));
        setCustomByAduId({});
        setExpandedAduId(null);
    }

    // Deep-copy the current master into a fresh per-unit override so we can
    // mutate one unit without touching the others. Mirrors handleCustomize's
    // shape but is callable without expanding the panel.
    function snapshotFromMaster(): EstimatorState {
        return {
            quantities: { ...masterEstimator.quantities },
            customItems: masterEstimator.customItems.map((ci) => ({ ...ci })),
            overrides: { ...(masterEstimator.overrides ?? {}) },
        };
    }

    // ── Search → add: preset item ─────────────────────────────────────────
    // "All units" writes through master AND every existing custom override
    // so the rep sees the item on every card. A subset target only mutates
    // the named units' overrides — synced units stay on master.
    function handleApplyPreset({
        itemId,
        customerTotal,
        targetUnitIds,
    }: {
        itemId: string;
        catId: string;
        customerTotal: number;
        targetUnitIds: "all" | string[];
    }) {
        const preset = resolvedCategories
            .flatMap((c) => c.items)
            .find((i) => i.id === itemId);
        if (!preset) return;
        const markup = preset.markup > 0 ? preset.markup : 1.2;
        const beCost = customerTotal / markup;
        const qty = 1;

        function applyToState(state: EstimatorState): EstimatorState {
            return {
                ...state,
                quantities: { ...state.quantities, [itemId]: qty },
                overrides: {
                    ...(state.overrides ?? {}),
                    [itemId]: { beCost, markup },
                },
            };
        }

        if (targetUnitIds === "all") {
            setMasterEstimator((prev) => applyToState(prev));
            setCustomByAduId((prev) => {
                const next: Record<string, EstimatorState | null> = {};
                for (const [uid, st] of Object.entries(prev)) {
                    next[uid] = st ? applyToState(st) : null;
                }
                return next;
            });
            return;
        }

        setCustomByAduId((prev) => {
            const next = { ...prev };
            for (const uid of targetUnitIds) {
                const base = next[uid] ?? snapshotFromMaster();
                next[uid] = applyToState(base);
            }
            return next;
        });
    }

    // ── Search → add: custom (free-text) item ─────────────────────────────
    // Each unit gets its own customItem id so deleting one doesn't break the
    // others' arrays.
    function handleApplyCustom({
        catId,
        label,
        customerTotal,
        targetUnitIds,
    }: {
        catId: string;
        label: string;
        customerTotal: number;
        targetUnitIds: "all" | string[];
    }) {
        const markup = 1.2;
        const beCost = customerTotal / markup;
        const qty = 1;
        const trimmed = label.trim();
        if (!trimmed) return;
        const norm = trimmed.toLowerCase();

        // Update-in-place if an item with the same (catId, label) already
        // exists in the target state; otherwise append a fresh one. This is
        // what stops "Snow removal" submitted twice from creating two rows.
        function updateOrAdd(state: EstimatorState): EstimatorState {
            const idx = state.customItems.findIndex(
                (ci) => ci.catId === catId && (ci.label?.trim().toLowerCase() ?? "") === norm,
            );
            if (idx >= 0) {
                const nextItems = state.customItems.slice();
                nextItems[idx] = { ...nextItems[idx], beCost, markup, qty };
                return { ...state, customItems: nextItems };
            }
            return {
                ...state,
                customItems: [
                    ...state.customItems,
                    { id: crypto.randomUUID(), catId, label: trimmed, qty, beCost, markup },
                ],
            };
        }

        if (targetUnitIds === "all") {
            setMasterEstimator((prev) => updateOrAdd(prev));
            setCustomByAduId((prev) => {
                const next: Record<string, EstimatorState | null> = {};
                for (const [uid, st] of Object.entries(prev)) {
                    next[uid] = st ? updateOrAdd(st) : null;
                }
                return next;
            });
            return;
        }

        setCustomByAduId((prev) => {
            const next = { ...prev };
            for (const uid of targetUnitIds) {
                const base = next[uid] ?? snapshotFromMaster();
                next[uid] = updateOrAdd(base);
            }
            return next;
        });
    }

    // ── Remove handlers — called from the Active items editor ─────────────

    function handleRemovePreset({
        itemId,
        targetUnitIds,
    }: {
        itemId: string;
        catId: string;
        targetUnitIds: "all" | string[];
    }) {
        function removeFromState(state: EstimatorState): EstimatorState {
            const quantities = { ...state.quantities };
            delete quantities[itemId];
            const overrides = { ...(state.overrides ?? {}) };
            delete overrides[itemId];
            return { ...state, quantities, overrides };
        }

        if (targetUnitIds === "all") {
            setMasterEstimator((prev) => removeFromState(prev));
            setCustomByAduId((prev) => {
                const next: Record<string, EstimatorState | null> = {};
                for (const [uid, st] of Object.entries(prev)) {
                    next[uid] = st ? removeFromState(st) : null;
                }
                return next;
            });
            return;
        }

        setCustomByAduId((prev) => {
            const next = { ...prev };
            for (const uid of targetUnitIds) {
                const base = next[uid] ?? snapshotFromMaster();
                next[uid] = removeFromState(base);
            }
            return next;
        });
    }

    function handleRemoveCustom({
        catId,
        label,
        targetUnitIds,
    }: {
        catId: string;
        label: string;
        targetUnitIds: "all" | string[];
    }) {
        const norm = label.trim().toLowerCase();
        function removeFromState(state: EstimatorState): EstimatorState {
            return {
                ...state,
                customItems: state.customItems.filter(
                    (ci) =>
                        !(
                            ci.catId === catId &&
                            (ci.label?.trim().toLowerCase() ?? "") === norm
                        ),
                ),
            };
        }

        if (targetUnitIds === "all") {
            setMasterEstimator((prev) => removeFromState(prev));
            setCustomByAduId((prev) => {
                const next: Record<string, EstimatorState | null> = {};
                for (const [uid, st] of Object.entries(prev)) {
                    next[uid] = st ? removeFromState(st) : null;
                }
                return next;
            });
            return;
        }

        setCustomByAduId((prev) => {
            const next = { ...prev };
            for (const uid of targetUnitIds) {
                const base = next[uid] ?? snapshotFromMaster();
                next[uid] = removeFromState(base);
            }
            return next;
        });
    }

    const expandedFp = useMemo(
        () => (expandedAduId ? selectedAdus.find((fp) => fp._id === expandedAduId) ?? null : null),
        [expandedAduId, selectedAdus]
    );

    // ── Presence index ────────────────────────────────────────────────────
    // Per-item map of which units currently *effectively* show the item, plus
    // a sample current cost. Drives the "already added" badges in search and
    // the apply-to chip checkmarks. Built off effective state (custom override
    // wins over master) so it reflects what the rep sees on each card.
    const presenceIndex = useMemo<PresenceEntry[]>(() => {
        const presetMeta = new Map<string, { catId: string; label: string; markup: number }>();
        for (const cat of resolvedCategories)
            for (const item of cat.items)
                presetMeta.set(item.id, { catId: cat.id, label: item.label, markup: item.markup });

        const byKey = new Map<string, PresenceEntry>();
        for (const fp of selectedAdus) {
            const st = customByAduId[fp._id] ?? masterEstimator;
            // Presets
            for (const [itemId, rawQty] of Object.entries(st.quantities)) {
                const qty = rawQty ?? 0;
                if (qty <= 0) continue;
                const meta = presetMeta.get(itemId);
                if (!meta) continue;
                const ov = st.overrides?.[itemId];
                const beCost = ov?.beCost;
                const markup = ov?.markup ?? meta.markup;
                const cost = beCost != null ? beCost * markup : null;
                const key = `preset:${itemId}`;
                const existing = byKey.get(key);
                if (existing) {
                    existing.unitIds.push(fp._id);
                    if (existing.sampleCost == null && cost != null) existing.sampleCost = cost;
                } else {
                    byKey.set(key, {
                        kind: "preset",
                        presetItemId: itemId,
                        label: meta.label,
                        catId: meta.catId,
                        unitIds: [fp._id],
                        sampleCost: cost,
                    });
                }
            }
            // Custom items — keyed by (catId + normalized label) so the same
            // free-text item across units collapses into a single search hit.
            for (const ci of st.customItems) {
                const label = ci.label?.trim();
                if (!label || ci.qty <= 0) continue;
                const norm = label.toLowerCase();
                const key = `custom:${ci.catId}:${norm}`;
                const cost = ci.beCost * ci.markup * ci.qty;
                const existing = byKey.get(key);
                if (existing) existing.unitIds.push(fp._id);
                else byKey.set(key, {
                    kind: "custom",
                    customLabel: label,
                    label,
                    catId: ci.catId,
                    unitIds: [fp._id],
                    sampleCost: cost > 0 ? cost : null,
                });
            }
        }
        return Array.from(byKey.values());
    }, [masterEstimator, customByAduId, resolvedCategories, selectedAdus]);

    // Per-presence Maps the Active editor needs to mark which unit chips
    // already have the row in question. Both maps share the same source so
    // they stay in sync.
    const presetPresenceByItemId = useMemo(() => {
        const m = new Map<string, string[]>();
        for (const e of presenceIndex)
            if (e.kind === "preset" && e.presetItemId) m.set(e.presetItemId, e.unitIds);
        return m;
    }, [presenceIndex]);

    const customPresenceByKey = useMemo(() => {
        const m = new Map<string, string[]>();
        for (const e of presenceIndex) {
            if (e.kind === "custom" && e.customLabel)
                m.set(`${e.catId}:${e.customLabel.toLowerCase()}`, e.unitIds);
        }
        return m;
    }, [presenceIndex]);

    if (selectedAdus.length === 0) return null;

    return (
        <div className={s.panel}>
            {/* ── Quick-add search ───────────────────────────────────────── */}
            <SiteWorkSearch
                categories={resolvedCategories}
                selectedAdus={selectedAdus}
                presenceIndex={presenceIndex}
                onApplyPreset={handleApplyPreset}
                onApplyCustom={handleApplyCustom}
            />

            {/* ── Unit summary cards ─────────────────────────────────────── */}
            <div className={s.unitRow}>
                {selectedAdus.map((fp) => {
                    const custom = isCustom(fp._id);
                    const total = computeTotal(getEffective(fp._id), resolvedCategories);
                    const isExpanded = expandedAduId === fp._id;

                    return (
                        <div
                            key={fp._id}
                            className={`${s.unitCard} ${custom ? s.unitCardCustom : ""}`}
                        >
                            <div className={s.unitName}>{fp.name}</div>
                            <div className={s.unitTotal}>{total > 0 ? money(total) : "—"}</div>
                            <div
                                className={`${s.statusPill} ${
                                    custom ? s.statusPillCustom : s.statusPillSynced
                                }`}
                            >
                                {custom ? "Custom" : "Synced"}
                            </div>
                            <div className={s.unitActions}>
                                <button
                                    className={`${s.unitBtn} ${isExpanded ? s.unitBtnActive : ""}`}
                                    onClick={() => handleCustomize(fp._id)}
                                >
                                    {custom ? (isExpanded ? "Close" : "Edit") : "Customize"}
                                </button>
                                {custom && (
                                    <button
                                        className={s.resetBtn}
                                        title="Reset to default"
                                        onClick={() => handleReset(fp._id)}
                                    >
                                        ✕
                                    </button>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* ── Per-unit override estimator (expanded) ─────────────────── */}
            {expandedFp && (
                <div className={s.overridePanel}>
                    <div className={s.overrideHeader}>
                        <span className={s.overrideName}>{expandedFp.name}</span>
                        <span className={s.overrideBadge}>Custom</span>
                        <div className={s.overrideActions}>
                            <button
                                className={s.applyAllBtn}
                                onClick={() => handleApplyToAll(expandedFp._id)}
                            >
                                Apply to all
                            </button>
                            <button
                                className={s.resetDefaultBtn}
                                onClick={() => handleReset(expandedFp._id)}
                            >
                                Reset to default
                            </button>
                        </div>
                    </div>
                    <SiteWorkEstimator
                        value={getEffective(expandedFp._id)}
                        onChange={(next) => handleUnitChange(expandedFp._id, next)}
                        catalog={catalog}
                        crossUnit={{
                            selectedAdus,
                            currentUnitId: expandedFp._id,
                            presetPresenceByItemId,
                            customPresenceByKey,
                            onEditPreset: handleApplyPreset,
                            onEditCustom: handleApplyCustom,
                            onRemovePreset: handleRemovePreset,
                            onRemoveCustom: handleRemoveCustom,
                        }}
                    />
                </div>
            )}

            {/* ── Master estimator ───────────────────────────────────────── */}
            <div className={s.masterSection}>
                <div className={s.masterHeader}>
                    <div>
                        <div className={s.masterTitle}>All Units · Default</div>
                        <div className={s.masterSub}>
                            {syncedCount()} of {selectedAdus.length} unit
                            {selectedAdus.length !== 1 ? "s" : ""} synced — changes here update
                            all synced units
                        </div>
                    </div>
                </div>
                <SiteWorkEstimator
                    value={masterEstimator}
                    onChange={setMasterEstimator}
                    catalog={catalog}
                    crossUnit={{
                        selectedAdus,
                        currentUnitId: undefined,
                        presetPresenceByItemId,
                        customPresenceByKey,
                        onEditPreset: handleApplyPreset,
                        onEditCustom: handleApplyCustom,
                        onRemovePreset: handleRemovePreset,
                        onRemoveCustom: handleRemoveCustom,
                    }}
                />
            </div>
        </div>
    );
}
