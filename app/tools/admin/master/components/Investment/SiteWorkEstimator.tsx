"use client";

import React from "react";
import { asNumber } from "@/lib/investment/format";
import styles from "./SiteWorkEstimator.module.css";

// ─── Item types ───────────────────────────────────────────────────────────────
//
// fixed:  customer price = beCost × markup × qty  (qty=1 when unit='flat')
// quote:  customer price = subQuote × markup
//
// All numeric fields stored as strings to match the existing codebase pattern
// (raw input values → asNumber() at compute time).

export type FixedItem = {
    id: string;
    label: string;
    type: "fixed";
    fromPreset: boolean;
    beCost: string;
    markup: string;
    qty: string;
    unit: "flat" | "SF" | "LF";
};

export type QuoteItem = {
    id: string;
    label: string;
    type: "quote";
    fromPreset: boolean;
    subQuote: string;
    markup: string;
};

export type SiteWorkItem = FixedItem | QuoteItem;

// ─── Price calculation (exported for use in InvestmentSection) ───────────────

export function customerPrice(item: SiteWorkItem): number {
    if (item.type === "quote") {
        const sq = asNumber(item.subQuote) ?? 0;
        if (sq <= 0) return 0;
        return sq * (asNumber(item.markup) ?? 1);
    }
    const be = asNumber(item.beCost) ?? 0;
    const m = asNumber(item.markup) ?? 1;
    if (item.unit === "flat") return be > 0 ? be * m : 0;
    const q = asNumber(item.qty) ?? 0;
    return q > 0 ? be * m * q : 0;
}

// ─── Preset definitions ───────────────────────────────────────────────────────

type FixedPreset = {
    label: string;
    type: "fixed";
    unit: "flat" | "SF" | "LF";
    beCost: number;
    markup: number;
    helperText?: string;
    note?: string;
};

type QuotePreset = {
    label: string;
    type: "quote";
    markup: number;
    note?: string;
};

type Preset = FixedPreset | QuotePreset;
type Category = { label: string; presets: Preset[] };

const CATEGORIES: Category[] = [
    {
        label: "Site prep & demo",
        presets: [
            { label: "Concrete cut & repour", type: "fixed", unit: "SF", beCost: 0, markup: 1.1, helperText: "Enter square footage" },
            { label: "Concrete cut & haul away", type: "fixed", unit: "SF", beCost: 0, markup: 1.1, helperText: "Enter square footage" },
            { label: "Demo wall", type: "fixed", unit: "flat", beCost: 0, markup: 1.1 },
            { label: "Wood arch demo", type: "fixed", unit: "flat", beCost: 0, markup: 1.1 },
            { label: "Patio cover demo", type: "fixed", unit: "flat", beCost: 0, markup: 1.1 },
            { label: "Tree removal", type: "fixed", unit: "flat", beCost: 0, markup: 1.1 },
        ],
    },
    {
        label: "Plans & engineering",
        presets: [
            { label: "Draw up house", type: "fixed", unit: "flat", beCost: 0, markup: 1.1 },
            { label: "Survey", type: "fixed", unit: "flat", beCost: 0, markup: 1.1 },
            { label: "MEP plans", type: "fixed", unit: "flat", beCost: 0, markup: 1.1 },
            { label: "Elec calcs", type: "fixed", unit: "flat", beCost: 0, markup: 1.1 },
            { label: "Soils report", type: "fixed", unit: "flat", beCost: 0, markup: 1.1 },
            { label: "Fire flow", type: "fixed", unit: "flat", beCost: 0, markup: 1.1 },
        ],
    },
    {
        label: "Utilities",
        presets: [
            { label: "Sewer scope", type: "fixed", unit: "flat", beCost: 0, markup: 1.1 },
            { label: "Additional utility lengths", type: "fixed", unit: "LF", beCost: 0, markup: 1.1, helperText: "Enter linear feet" },
            { label: "Jet under walkway", type: "fixed", unit: "LF", beCost: 0, markup: 1.1, helperText: "Enter linear feet" },
            { label: "Area drains", type: "fixed", unit: "flat", beCost: 0, markup: 1.1 },
            { label: "Water meter upgrade allowance", type: "fixed", unit: "flat", beCost: 10000, markup: 1.0 },
        ],
    },
    {
        label: "Structural & exterior",
        presets: [
            { label: "Tile roof", type: "fixed", unit: "SF", beCost: 0, markup: 1.1, helperText: "Enter square footage" },
            { label: "Slope of roof", type: "fixed", unit: "flat", beCost: 0, markup: 1.1 },
            { label: "Attached ADU", type: "fixed", unit: "flat", beCost: 0, markup: 1.1 },
            { label: "Rain gutters", type: "fixed", unit: "flat", beCost: 0, markup: 1.1 },
            { label: "Retaining wall + grading", type: "fixed", unit: "flat", beCost: 0, markup: 1.1 },
            { label: "Trellis with concrete patio", type: "fixed", unit: "flat", beCost: 0, markup: 1.1 },
            { label: "Exterior trim", type: "fixed", unit: "flat", beCost: 2800, markup: 1.1 },
        ],
    },
    {
        label: "Interior & upgrades",
        presets: [
            { label: "10ft ceilings", type: "fixed", unit: "flat", beCost: 9000, markup: 1.0, note: "$12k for 750+" },
            { label: "Main house tie-in with interior door", type: "fixed", unit: "flat", beCost: 2500, markup: 1.0 },
            { label: "Taller windows and doors", type: "quote", markup: 1.1 },
            { label: "12ft ceilings", type: "quote", markup: 1.1 },
            { label: "Cabinet increase", type: "quote", markup: 1.2 },
        ],
    },
    {
        label: "Safety & equipment",
        presets: [
            { label: "Pool safety equipment", type: "quote", markup: 1.0 },
        ],
    },
];

// flat lookup for helperText from preset definitions
const PRESET_MAP = new Map<string, Preset>(
    CATEGORIES.flatMap((c) => c.presets).map((p) => [p.label, p])
);

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtMoney(n: number): string {
    if (!Number.isFinite(n)) return "$0";
    return n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}

function totalCustomerPrice(items: SiteWorkItem[]): number {
    return items.reduce((sum, item) => sum + customerPrice(item), 0);
}

function itemFromPreset(preset: Preset): SiteWorkItem {
    const id = crypto.randomUUID();
    if (preset.type === "fixed") {
        return {
            id,
            label: preset.label,
            type: "fixed",
            fromPreset: true,
            beCost: preset.beCost > 0 ? String(preset.beCost) : "",
            markup: String(preset.markup),
            qty: "",
            unit: preset.unit,
        };
    }
    return {
        id,
        label: preset.label,
        type: "quote",
        fromPreset: true,
        subQuote: "",
        markup: String(preset.markup),
    };
}

function blankCustomFixed(): FixedItem {
    return { id: crypto.randomUUID(), label: "", type: "fixed", fromPreset: false, beCost: "", markup: "1.1", qty: "", unit: "flat" };
}

function blankCustomQuote(): QuoteItem {
    return { id: crypto.randomUUID(), label: "", type: "quote", fromPreset: false, subQuote: "", markup: "1.1" };
}

// ─── Main component ───────────────────────────────────────────────────────────

export function SiteWorkEstimator({
    aduId: _aduId,
    aduName,
    sqft,
    items,
    onChange,
    onCopyToAll,
}: {
    aduId: string;
    aduName: string;
    sqft?: number;
    items: SiteWorkItem[];
    onChange: (items: SiteWorkItem[]) => void;
    onCopyToAll: (items: SiteWorkItem[]) => void;
}) {
    function addPreset(preset: Preset) {
        onChange([...items, itemFromPreset(preset)]);
    }

    function addCustom() {
        onChange([...items, blankCustomFixed()]);
    }

    function updateItem(id: string, patch: Partial<SiteWorkItem>) {
        onChange(
            items.map((item) => (item.id === id ? ({ ...item, ...patch } as SiteWorkItem) : item))
        );
    }

    function toggleType(id: string) {
        onChange(
            items.map((item): SiteWorkItem => {
                if (item.id !== id) return item;
                if (item.type === "fixed") {
                    const q: QuoteItem = { id: item.id, label: item.label, type: "quote", fromPreset: false, subQuote: "", markup: item.markup };
                    return q;
                }
                const f: FixedItem = { id: item.id, label: item.label, type: "fixed", fromPreset: false, beCost: "", markup: item.markup, qty: "", unit: "flat" };
                return f;
            })
        );
    }

    function deleteItem(id: string) {
        onChange(items.filter((item) => item.id !== id));
    }

    const total = totalCustomerPrice(items);

    return (
        <div className={styles.estimatorCard}>
            {/* Header */}
            <div className={styles.cardHeader}>
                <div className={styles.cardTitleGroup}>
                    <div className={styles.cardTitle}>{aduName}</div>
                    {sqft ? <div className={styles.cardMeta}>{sqft.toLocaleString()} sq ft</div> : null}
                </div>
                <div className={styles.cardActions}>
                    <div className={styles.totalBadge}>Total: {fmtMoney(total)}</div>
                    <button
                        type="button"
                        className={styles.copyBtn}
                        title="Merge these items into all other compared ADUs — skips labels that already exist"
                        onClick={() => onCopyToAll(items)}
                    >
                        Copy &amp; merge to all
                    </button>
                </div>
            </div>

            {/* Active items */}
            <div className={styles.itemList}>
                {items.length === 0 ? (
                    <div className={styles.emptyItems}>No items yet — add from a category below.</div>
                ) : (
                    items.map((item) =>
                        item.type === "fixed" ? (
                            <FixedRow
                                key={item.id}
                                item={item}
                                onUpdate={(patch) => updateItem(item.id, patch as Partial<SiteWorkItem>)}
                                onDelete={() => deleteItem(item.id)}
                                onToggleType={item.fromPreset ? undefined : () => toggleType(item.id)}
                            />
                        ) : (
                            <QuoteRow
                                key={item.id}
                                item={item}
                                onUpdate={(patch) => updateItem(item.id, patch as Partial<SiteWorkItem>)}
                                onDelete={() => deleteItem(item.id)}
                                onToggleType={item.fromPreset ? undefined : () => toggleType(item.id)}
                            />
                        )
                    )
                )}
            </div>

            <hr className={styles.divider} />

            {/* Preset categories */}
            <div className={styles.presetArea}>
                {CATEGORIES.map((cat) => (
                    <div key={cat.label} className={styles.categorySection}>
                        <div className={styles.categoryTitle}>{cat.label}</div>

                        <div className={styles.presetChips}>
                            {cat.presets.map((preset) => (
                                <button
                                    key={preset.label}
                                    type="button"
                                    className={`${styles.presetChip} ${preset.type === "quote" ? styles.presetChipQuote : ""}`}
                                    title={
                                        preset.type === "quote"
                                            ? `Sub-quote based · ${preset.markup}× markup applied`
                                            : preset.note ?? ""
                                    }
                                    onClick={() => addPreset(preset)}
                                >
                                    {preset.label}
                                    {preset.type === "fixed" && preset.unit !== "flat" && (
                                        <span className={styles.presetChipUnit}>/{preset.unit}</span>
                                    )}
                                    {preset.type === "fixed" && preset.beCost > 0 && preset.unit === "flat" && (
                                        <span className={styles.presetChipCost}>{fmtMoney(preset.beCost)}</span>
                                    )}
                                    {preset.type === "quote" && (
                                        <span className={styles.presetChipQuoteTag}>quote</span>
                                    )}
                                    {preset.note && (
                                        <span className={styles.presetChipNote}>{preset.note}</span>
                                    )}
                                </button>
                            ))}
                        </div>

                        <div className={styles.customItemRow}>
                            <button type="button" className={styles.addCustomBtn} onClick={addCustom}>
                                + Custom item
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

// ─── Row renderers ────────────────────────────────────────────────────────────

function FixedRow({
    item,
    onUpdate,
    onDelete,
    onToggleType,
}: {
    item: FixedItem;
    onUpdate: (patch: Partial<FixedItem>) => void;
    onDelete: () => void;
    onToggleType?: () => void;
}) {
    const preset = PRESET_MAP.get(item.label);
    const helperText = preset?.type === "fixed" ? preset.helperText : undefined;
    const price = customerPrice(item);
    const active = price > 0;

    return (
        <div className={styles.itemCard}>
            {/* Row 1: label + type badge */}
            <div className={styles.itemRowTop}>
                <input
                    className={styles.itemLabelInput}
                    type="text"
                    value={item.label}
                    onChange={(e) => onUpdate({ label: e.target.value })}
                    placeholder="Line item description"
                />
                {onToggleType ? (
                    <button
                        type="button"
                        className={`${styles.typeTag} ${styles.typeTagFixed}`}
                        title="Click to switch to sub-quote type"
                        onClick={onToggleType}
                    >
                        {item.unit === "flat" ? "fixed" : `$/${item.unit}`}
                    </button>
                ) : (
                    <span className={`${styles.typeTag} ${styles.typeTagFixed}`}>
                        {item.unit === "flat" ? "fixed" : `$/${item.unit}`}
                    </span>
                )}
            </div>

            {/* Row 2: math inputs */}
            <div className={styles.itemRowInputs}>
                {item.unit === "flat" ? (
                    /* Flat: just a dollar amount */
                    <div className={styles.inputGroup}>
                        <span className={styles.inputPrefix}>$</span>
                        <input
                            className={styles.compactInput}
                            type="number"
                            inputMode="decimal"
                            min="0"
                            step="100"
                            value={item.beCost}
                            onChange={(e) => onUpdate({ beCost: e.target.value })}
                            placeholder="0"
                            style={{ paddingLeft: 22, width: 120 }}
                        />
                    </div>
                ) : (
                    /* SF / LF: quantity × per-unit cost */
                    <>
                        <div className={styles.inputGroup}>
                            <input
                                className={styles.compactInput}
                                type="number"
                                inputMode="decimal"
                                min="0"
                                step="1"
                                value={item.qty}
                                onChange={(e) => onUpdate({ qty: e.target.value })}
                                placeholder="0"
                                style={{ width: 72 }}
                            />
                            <span className={styles.unitTag}>{item.unit}</span>
                        </div>
                        <span className={styles.operatorSymbol}>×</span>
                        <div className={styles.inputGroup}>
                            <span className={styles.inputPrefix}>$</span>
                            <input
                                className={styles.compactInput}
                                type="number"
                                inputMode="decimal"
                                min="0"
                                step="0.5"
                                value={item.beCost}
                                onChange={(e) => onUpdate({ beCost: e.target.value })}
                                placeholder="0"
                                style={{ paddingLeft: 22, width: 76 }}
                            />
                            <span className={styles.unitTag}>/{item.unit}</span>
                        </div>
                    </>
                )}

                <span className={styles.operatorSymbol}>×</span>

                {/* Markup */}
                <div className={styles.inputGroup}>
                    <input
                        className={styles.compactInput}
                        type="number"
                        inputMode="decimal"
                        min="1"
                        step="0.05"
                        value={item.markup}
                        onChange={(e) => onUpdate({ markup: e.target.value })}
                        placeholder="1.1"
                        style={{ width: 60 }}
                    />
                    <span className={styles.unitTag}>×</span>
                </div>

                <span className={styles.operatorSymbol}>=</span>

                <div className={`${styles.priceResult} ${active ? styles.priceResultActive : styles.priceResultZero}`}>
                    {fmtMoney(price)}
                </div>

                <button type="button" className={styles.deleteBtn} onClick={onDelete} title="Remove item">
                    ×
                </button>
            </div>

            {/* Helper text for SF/LF items that have no qty yet */}
            {helperText && item.unit !== "flat" && !item.qty && (
                <div className={styles.helperText}>{helperText}</div>
            )}
        </div>
    );
}

function QuoteRow({
    item,
    onUpdate,
    onDelete,
    onToggleType,
}: {
    item: QuoteItem;
    onUpdate: (patch: Partial<QuoteItem>) => void;
    onDelete: () => void;
    onToggleType?: () => void;
}) {
    const price = customerPrice(item);
    const active = price > 0;

    return (
        <div className={styles.itemCard}>
            {/* Row 1: label + type badge */}
            <div className={styles.itemRowTop}>
                <input
                    className={styles.itemLabelInput}
                    type="text"
                    value={item.label}
                    onChange={(e) => onUpdate({ label: e.target.value })}
                    placeholder="Line item description"
                />
                {onToggleType ? (
                    <button
                        type="button"
                        className={`${styles.typeTag} ${styles.typeTagQuote}`}
                        title="Click to switch to fixed type"
                        onClick={onToggleType}
                    >
                        sub quote
                    </button>
                ) : (
                    <span className={`${styles.typeTag} ${styles.typeTagQuote}`}>sub quote</span>
                )}
            </div>

            {/* Row 2: math inputs */}
            <div className={styles.itemRowInputs}>
                <span className={styles.quoteLabel}>Sub quote:</span>

                <div className={styles.inputGroup}>
                    <span className={styles.inputPrefix}>$</span>
                    <input
                        className={styles.compactInput}
                        type="number"
                        inputMode="decimal"
                        min="0"
                        step="100"
                        value={item.subQuote}
                        onChange={(e) => onUpdate({ subQuote: e.target.value })}
                        placeholder="0"
                        style={{ paddingLeft: 22, width: 120 }}
                    />
                </div>

                <span className={styles.operatorSymbol}>×</span>

                {/* Markup */}
                <div className={styles.inputGroup}>
                    <input
                        className={styles.compactInput}
                        type="number"
                        inputMode="decimal"
                        min="1"
                        step="0.05"
                        value={item.markup}
                        onChange={(e) => onUpdate({ markup: e.target.value })}
                        placeholder="1.1"
                        style={{ width: 60 }}
                    />
                    <span className={styles.unitTag}>×</span>
                </div>

                <span className={styles.operatorSymbol}>=</span>

                <div className={`${styles.priceResult} ${active ? styles.priceResultActive : styles.priceResultZero}`}>
                    {fmtMoney(price)}
                </div>

                <button type="button" className={styles.deleteBtn} onClick={onDelete} title="Remove item">
                    ×
                </button>
            </div>
        </div>
    );
}
