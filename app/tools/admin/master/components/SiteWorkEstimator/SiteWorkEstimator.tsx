"use client";

import React, { useState, useMemo, useCallback, useEffect } from "react";
import {
    SITE_WORK_CATEGORIES,
    type EstimatorState,
    type SiteWorkCategory,
    type SiteWorkPreset,
    type SiteWorkCatalogData,
    type CustomItemData,
    createEmptyState,
    rowCustomerPrice,
    computeTotal,
    buildActiveSnapshot,
    catalogToSiteWorkCategories,
    effectiveBeCost,
    effectiveMarkup,
} from "@/lib/investment/siteWorkItems";
import { money } from "@/lib/investment/format";
import { ActiveItemsEditor, type ActiveEditorCrossUnit } from "./ActiveItemsEditor";
import s from "./SiteWorkEstimator.module.css";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Props {
    value: EstimatorState;
    onChange: (next: EstimatorState) => void;
    aduName?: string;
    catalog?: SiteWorkCatalogData;
    /** Optional cross-unit context for the Active tab editor. When provided,
     *  each active-item row exposes an Apply-to picker so edits and removals
     *  can fan out across all selected ADUs. */
    crossUnit?: ActiveEditorCrossUnit;
}

interface Snapshot {
    state: EstimatorState;
    ts: number;
    total: number;
    activeCount: number;
    label?: string;
}

type Tab = "all" | "active";

// ─── Helpers ──────────────────────────────────────────────────────────────────


function activeItemCount(state: EstimatorState, categories: SiteWorkCategory[]): number {
    let count = 0;
    for (const cat of categories)
        for (const item of cat.items)
            if ((state.quantities[item.id] ?? 0) > 0) count++;
    count += state.customItems.filter((ci) => ci.qty > 0 && ci.beCost > 0).length;
    return count;
}

function catActiveCount(catId: string, state: EstimatorState, categories: SiteWorkCategory[]): number {
    let count = 0;
    const cat = categories.find((c) => c.id === catId);
    if (cat) for (const item of cat.items) if ((state.quantities[item.id] ?? 0) > 0) count++;
    count += state.customItems.filter((ci) => ci.catId === catId && ci.qty > 0).length;
    return count;
}

function catCustomerTotal(catId: string, state: EstimatorState, categories: SiteWorkCategory[]): number {
    let total = 0;
    const cat = categories.find((c) => c.id === catId);
    const overrides = state.overrides ?? {};
    if (cat)
        for (const item of cat.items)
            total += rowCustomerPrice(item, state.quantities[item.id] ?? 0, overrides);
    for (const ci of state.customItems)
        if (ci.catId === catId && ci.qty > 0 && ci.beCost > 0)
            total += ci.qty * ci.beCost * ci.markup;
    return total;
}

// ─── Number input helper — controlled but tolerates mid-edit state ────────────

function NumInput({
    value,
    onChange,
    step = 1,
    min = 0,
    placeholder = "0",
    className,
    title,
}: {
    value: number;
    onChange: (n: number) => void;
    step?: number;
    min?: number;
    placeholder?: string;
    className?: string;
    title?: string;
}) {
    const [raw, setRaw] = useState(value === 0 ? "" : String(value));

    useEffect(() => {
        setRaw(value === 0 ? "" : String(value));
    }, [value]);

    return (
        <input
            type="number"
            className={className ?? s.numInput}
            value={raw}
            placeholder={placeholder}
            step={step}
            min={min}
            title={title}
            onChange={(e) => {
                setRaw(e.target.value);
                const n = parseFloat(e.target.value);
                if (!isNaN(n) && n >= min) onChange(n);
            }}
            onBlur={() => {
                const n = parseFloat(raw);
                if (isNaN(n) || n < min) {
                    onChange(min);
                    setRaw(min === 0 ? "" : String(min));
                } else {
                    setRaw(String(n));
                }
            }}
        />
    );
}

// ─── Preset row ───────────────────────────────────────────────────────────────

function PresetRow({
    item,
    qty,
    overrides,
    onQtyChange,
    onBeCostChange,
    onMarkupChange,
    onUnitPriceChange,
    onTotalChange,
    onResetOverride,
    onClear,
}: {
    item: SiteWorkPreset;
    qty: number;
    overrides: EstimatorState["overrides"];
    onQtyChange: (v: number) => void;
    onBeCostChange: (v: number) => void;
    onMarkupChange: (v: number) => void;
    onUnitPriceChange: (v: number) => void;
    onTotalChange: (v: number) => void;
    onResetOverride: () => void;
    onClear: () => void;
}) {
    const isQuote = item.unit === "quote";
    const active = qty > 0;
    const hasOverride = !!overrides[item.id];

    const beCost = effectiveBeCost(item, overrides);
    const markup = effectiveMarkup(item, overrides);
    const unitPrice = isQuote ? 0 : beCost * markup;
    const total = rowCustomerPrice(item, qty, overrides);

    const unitLabel = isQuote ? "QUOTE $" : item.unit === "flat" ? "flat" : item.unit.toUpperCase();

    const rowCls = [
        s.itemRow,
        active ? s.itemRowActive : "",
        hasOverride ? s.itemRowOverridden : "",
    ].filter(Boolean).join(" ");

    return (
        <div className={rowCls}>
            {/* Item */}
            <div className={s.itemCell}>
                {hasOverride && <span className={s.modDot} title="Modified from catalog" />}
                <div>
                    <div className={s.itemName}>{item.label}</div>
                    <div className={s.unitTag}>{unitLabel}</div>
                </div>
                {hasOverride && (
                    <button className={s.resetRowBtn} title="Reset to catalog values" onClick={onResetOverride}>↺</button>
                )}
            </div>

            {/* Qty */}
            <NumInput
                value={qty}
                step={isQuote ? 100 : item.unit === "sqft" || item.unit === "lft" ? 10 : 1}
                onChange={onQtyChange}
                placeholder={isQuote ? "$0" : "0"}
                title={isQuote ? "Sub-quote dollar amount" : `Quantity (${item.unit})`}
            />

            {/* BE cost — hidden for quote items */}
            {isQuote ? (
                <div className={s.dimCell}>sub-quote</div>
            ) : (
                <NumInput
                    value={beCost}
                    step={1}
                    onChange={onBeCostChange}
                    placeholder="0"
                    title="Internal (BE) cost per unit"
                />
            )}

            {/* Markup (as multiplier, e.g. 1.20) */}
            <NumInput
                value={parseFloat(markup.toFixed(3))}
                step={0.01}
                min={1}
                onChange={onMarkupChange}
                placeholder="1.00"
                title="Markup multiplier (e.g. 1.20 = 20% margin)"
            />

            {/* Unit price — back-calcs markup; hidden for quote */}
            {isQuote ? (
                <div className={s.dimCell}>—</div>
            ) : (
                <NumInput
                    value={parseFloat(unitPrice.toFixed(2))}
                    step={1}
                    onChange={onUnitPriceChange}
                    placeholder="0"
                    title="Unit price (edits markup)"
                />
            )}

            {/* Total — back-calcs qty */}
            <NumInput
                value={parseFloat(total.toFixed(2))}
                step={100}
                onChange={(v) => onTotalChange(v)}
                placeholder="0"
                title="Customer total (edits qty)"
                className={`${s.numInput} ${active ? s.totalActive : ""}`}
            />

            {/* Clear */}
            <button
                className={s.delBtn}
                title="Zero out"
                onClick={onClear}
                disabled={!active && !hasOverride}
            >×</button>
        </div>
    );
}

// ─── Custom row ────────────────────────────────────────────────────────────────

function CustomRow({
    item, onChange, onDelete,
}: {
    item: CustomItemData;
    onChange: (next: CustomItemData) => void;
    onDelete: () => void;
}) {
    const unitPrice = item.beCost * item.markup;
    const total = item.qty > 0 && item.beCost > 0 ? item.qty * unitPrice : 0;

    function handleUnitPrice(v: number) {
        if (item.beCost <= 0) return;
        onChange({ ...item, markup: Math.max(1, v / item.beCost) });
    }

    function handleTotal(v: number) {
        const denom = item.beCost * item.markup;
        if (denom <= 0) return;
        onChange({ ...item, qty: Math.max(0, parseFloat((v / denom).toFixed(2))) });
    }

    return (
        <div className={s.customRow}>
            <div className={s.itemCell}>
                <div className={s.customBadge}>custom</div>
                <input
                    className={s.customLabel}
                    type="text"
                    value={item.label}
                    placeholder="Item description"
                    onChange={(e) => onChange({ ...item, label: e.target.value })}
                />
            </div>
            <NumInput value={item.qty} step={1} onChange={(v) => onChange({ ...item, qty: v })} />
            <NumInput value={item.beCost} step={1} onChange={(v) => onChange({ ...item, beCost: v })} title="Internal (BE) cost per unit" />
            <NumInput
                value={parseFloat(item.markup.toFixed(3))}
                step={0.01} min={1}
                onChange={(v) => onChange({ ...item, markup: v })}
                title="Markup multiplier (e.g. 1.20 = 20% margin)"
            />
            <NumInput
                value={parseFloat(unitPrice.toFixed(2))}
                step={1}
                onChange={handleUnitPrice}
                placeholder="0"
                title="Unit price (edits markup)"
            />
            <NumInput
                value={parseFloat(total.toFixed(2))}
                step={100}
                onChange={handleTotal}
                placeholder="0"
                title="Customer total (edits qty)"
                className={`${s.numInput} ${total > 0 ? s.totalActive : ""}`}
            />
            <button className={s.delBtn} title="Delete" onClick={onDelete}>×</button>
        </div>
    );
}

// ─── Main component ────────────────────────────────────────────────────────────

export function SiteWorkEstimator({ value, onChange, aduName, catalog, crossUnit }: Props) {
    // Resolve the runtime category list: DB-backed catalog when supplied,
    // legacy SITE_WORK_CATEGORIES otherwise. Item ids are stripped of their
    // `cat__` slug prefix inside catalogToSiteWorkCategories so existing
    // EstimatorState keys (e.g. "impact") continue to match.
    const resolvedCategories: SiteWorkCategory[] = useMemo(() => {
        if (catalog && catalog.categories.length > 0) {
            const fromCatalog = catalogToSiteWorkCategories(catalog);
            if (fromCatalog.length > 0) return fromCatalog;
        }
        return SITE_WORK_CATEGORIES;
    }, [catalog]);

    const [openCats, setOpenCats] = useState<Set<string>>(new Set());
    const [tab, setTab] = useState<Tab>("all");
    const [history, setHistory] = useState<Snapshot[]>([]);
    const [historyOpen, setHistoryOpen] = useState(false);

    // Auto-open categories that have active items
    useEffect(() => {
        setOpenCats((prev) => {
            const next = new Set(prev);
            for (const cat of resolvedCategories) {
                if (catActiveCount(cat.id, value, resolvedCategories) > 0) next.add(cat.id);
            }
            return next;
        });
    }, []); // only on mount

    const toggleCat = useCallback((catId: string) => {
        setOpenCats((prev) => {
            const next = new Set(prev);
            next.has(catId) ? next.delete(catId) : next.add(catId);
            return next;
        });
    }, []);

    // ── Mutators ────────────────────────────────────────────────────────────────

    const setQty = useCallback((itemId: string, qty: number) => {
        onChange({ ...value, quantities: { ...value.quantities, [itemId]: Math.max(0, qty) } });
    }, [value, onChange]);

    const setOverrideBeCost = useCallback((itemId: string, beCost: number) => {
        const overrides = { ...(value.overrides ?? {}) };
        overrides[itemId] = { ...overrides[itemId], beCost };
        onChange({ ...value, overrides });
    }, [value, onChange]);

    const setOverrideMarkup = useCallback((itemId: string, markup: number) => {
        const overrides = { ...(value.overrides ?? {}) };
        overrides[itemId] = { ...overrides[itemId], markup: Math.max(1, markup) };
        onChange({ ...value, overrides });
    }, [value, onChange]);

    const setUnitPrice = useCallback((item: SiteWorkPreset, unitPrice: number) => {
        // unit price = beCost × markup → solve for markup
        const beCost = effectiveBeCost(item, value.overrides ?? {});
        if (beCost <= 0) return;
        const markup = unitPrice / beCost;
        setOverrideMarkup(item.id, markup);
    }, [value, setOverrideMarkup]);

    const setTotal = useCallback((item: SiteWorkPreset, total: number) => {
        // total = qty × beCost × markup → solve for qty
        const beCost = effectiveBeCost(item, value.overrides ?? {});
        const markup = effectiveMarkup(item, value.overrides ?? {});
        const denom = item.unit === "quote" ? markup : beCost * markup;
        if (denom <= 0) return;
        const qty = Math.max(0, total / denom);
        setQty(item.id, parseFloat(qty.toFixed(2)));
    }, [value, setQty]);

    const resetRowOverride = useCallback((itemId: string) => {
        const overrides = { ...(value.overrides ?? {}) };
        delete overrides[itemId];
        onChange({ ...value, overrides });
    }, [value, onChange]);

    const clearRow = useCallback((itemId: string) => {
        const overrides = { ...(value.overrides ?? {}) };
        delete overrides[itemId];
        onChange({ ...value, quantities: { ...value.quantities, [itemId]: 0 }, overrides });
    }, [value, onChange]);

    const addCustomItem = useCallback((catId: string) => {
        const newItem: CustomItemData = {
            id: crypto.randomUUID(),
            catId,
            label: "",
            qty: 1,
            beCost: 0,
            markup: 1.2,
        };
        onChange({ ...value, customItems: [...value.customItems, newItem] });
        setOpenCats((prev) => new Set(prev).add(catId));
    }, [value, onChange]);

    const updateCustomItem = useCallback((updated: CustomItemData) => {
        onChange({ ...value, customItems: value.customItems.map((ci) => ci.id === updated.id ? updated : ci) });
    }, [value, onChange]);

    const deleteCustomItem = useCallback((id: string) => {
        onChange({ ...value, customItems: value.customItems.filter((ci) => ci.id !== id) });
    }, [value, onChange]);

    // ── History ─────────────────────────────────────────────────────────────────

    function saveAndReset() {
        const snap: Snapshot = {
            state: value,
            ts: Date.now(),
            total: computeTotal(value, resolvedCategories),
            activeCount: activeItemCount(value, resolvedCategories),
        };
        setHistory((prev) => [snap, ...prev].slice(0, 10));
        onChange(createEmptyState(resolvedCategories));
        setOpenCats(new Set());
    }

    function restoreSnapshot(snap: Snapshot) {
        onChange(snap.state);
        // Re-open active categories
        const activeCats = new Set<string>();
        for (const cat of resolvedCategories)
            if (catActiveCount(cat.id, snap.state, resolvedCategories) > 0) activeCats.add(cat.id);
        setOpenCats(activeCats);
        setHistoryOpen(false);
    }

    // ── Computed ────────────────────────────────────────────────────────────────

    const total = useMemo(() => computeTotal(value, resolvedCategories), [value, resolvedCategories]);
    const activeCount = useMemo(() => activeItemCount(value, resolvedCategories), [value, resolvedCategories]);
    const snapshot = useMemo(() => buildActiveSnapshot(value, resolvedCategories), [value, resolvedCategories]);
    const overrides = value.overrides ?? {};

    return (
        <div className={s.wrap}>
            {aduName && (
                <div className={s.aduBar}>
                    <span className={s.aduName}>{aduName}</span>
                </div>
            )}

            {/* ── Top bar: totals + tabs ──────────────────────────────────── */}
            <div className={s.topBar}>
                <div className={s.topStats}>
                    <span className={s.topTotal}>{total > 0 ? money(total) : "—"}</span>
                    <span className={s.topMeta}>{activeCount} active item{activeCount !== 1 ? "s" : ""}</span>
                </div>
                <div className={s.tabs}>
                    <button
                        className={`${s.tab} ${tab === "all" ? s.tabActive : ""}`}
                        onClick={() => setTab("all")}
                    >
                        All items
                    </button>
                    <button
                        className={`${s.tab} ${tab === "active" ? s.tabActive : ""}`}
                        onClick={() => setTab("active")}
                    >
                        Active{activeCount > 0 ? ` (${activeCount})` : ""}
                    </button>
                </div>
            </div>

            {/* ── Tab: Active items editor ─────────────────────────────────── */}
            {tab === "active" && (
                <div className={s.inner}>
                    <ActiveItemsEditor
                        snapshot={snapshot}
                        grandTotal={total}
                        crossUnit={crossUnit}
                    />
                </div>
            )}

            {/* ── Tab: All items accordion ─────────────────────────────────── */}
            {tab === "all" && (
                <div className={s.inner}>
                    {/* Column header */}
                    <div className={s.colHead}>
                        <div>Item</div>
                        <div className={s.colRight}>Qty / SF / LF</div>
                        <div className={s.colRight}>BE Cost</div>
                        <div className={s.colRight}>Markup ×</div>
                        <div className={s.colRight}>Unit Price</div>
                        <div className={s.colRight}>Total</div>
                        <div />
                    </div>

                    {resolvedCategories.map((cat) => {
                        const isOpen = openCats.has(cat.id);
                        const catTotal = catCustomerTotal(cat.id, value, resolvedCategories);
                        const catActive = catActiveCount(cat.id, value, resolvedCategories);
                        const catCustomItems = value.customItems.filter((ci) => ci.catId === cat.id);

                        return (
                            <div key={cat.id} className={s.catBlock}>
                                <button className={s.catHeader} onClick={() => toggleCat(cat.id)}>
                                    <span className={`${s.catDot} ${catActive > 0 ? s.catDotActive : ""}`} />
                                    <span className={s.catTitle}>{cat.label}</span>
                                    <span className={`${s.catCount} ${catActive > 0 ? s.catCountActive : ""}`}>
                                        {catActive}/{cat.items.length + catCustomItems.length}
                                    </span>
                                    {catTotal > 0 && <span className={s.catTotal}>{money(catTotal)}</span>}
                                    <span className={`${s.catArrow} ${isOpen ? s.catArrowOpen : ""}`}>▾</span>
                                </button>

                                {isOpen && (
                                    <div className={s.catBody}>
                                        {cat.items.map((item) => (
                                            <PresetRow
                                                key={item.id}
                                                item={item}
                                                qty={value.quantities[item.id] ?? 0}
                                                overrides={overrides}
                                                onQtyChange={(v) => setQty(item.id, v)}
                                                onBeCostChange={(v) => setOverrideBeCost(item.id, v)}
                                                onMarkupChange={(v) => setOverrideMarkup(item.id, v)}
                                                onUnitPriceChange={(v) => setUnitPrice(item, v)}
                                                onTotalChange={(v) => setTotal(item, v)}
                                                onResetOverride={() => resetRowOverride(item.id)}
                                                onClear={() => clearRow(item.id)}
                                            />
                                        ))}
                                        {catCustomItems.map((ci) => (
                                            <CustomRow
                                                key={ci.id}
                                                item={ci}
                                                onChange={updateCustomItem}
                                                onDelete={() => deleteCustomItem(ci.id)}
                                            />
                                        ))}
                                        <div className={s.addItemRow}>
                                            <button className={s.addBtn} onClick={() => addCustomItem(cat.id)}>
                                                <span className={s.addBtnIcon}>+</span> Custom item
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {/* ── Footer ──────────────────────────────────────────────────── */}
            <div className={s.footer}>
                <div>
                    <div className={s.footerLabel}>Site work total</div>
                    <div className={s.footerTotal}>{total > 0 ? money(total) : "—"}</div>
                </div>
                <div className={s.footerActions}>
                    {history.length > 0 && (
                        <button className={s.histBtn} onClick={() => setHistoryOpen((o) => !o)}>
                            History ({history.length})
                        </button>
                    )}
                    <button
                        className={s.saveResetBtn}
                        onClick={saveAndReset}
                        disabled={activeCount === 0}
                        title="Save current estimate to history, then clear"
                    >
                        Save &amp; Reset
                    </button>
                </div>
            </div>

            {/* ── History panel ────────────────────────────────────────────── */}
            {historyOpen && history.length > 0 && (
                <div className={s.histPanel}>
                    <div className={s.histHead}>Version history — click Restore to load</div>
                    {history.map((snap, i) => (
                        <div key={snap.ts} className={s.histEntry}>
                            <div className={s.histMeta}>
                                <span className={s.histNum}>#{history.length - i}</span>
                                <span className={s.histTime}>{new Date(snap.ts).toLocaleString()}</span>
                                <span className={s.histSummary}>{snap.activeCount} items · {money(snap.total)}</span>
                            </div>
                            <button className={s.restoreBtn} onClick={() => restoreSnapshot(snap)}>
                                Restore
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
