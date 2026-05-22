// app/admin/_components/investment/InvestmentControls.tsx
"use client";

import React, { useState, useMemo } from "react";
import type { Defaults } from "@/lib/investment/types";
import { DEFAULTS } from "@/lib/investment/types";
import type { Floorplan } from "@/lib/rentcast/types";
import { money, num } from "@/lib/investment/format";

import styles from "../investmentModel/InvestmentModelTable.module.css";

// ─── Proration ────────────────────────────────────────────────────────────────

const EXTRA_BATH_PREMIUM = 10_000;

interface ProrateResult {
    price: number;
    lowerUnit: Floorplan | null;
    upperUnit: Floorplan | null;
    exact: boolean;
}

function computeProration(sqft: number, catalogFloorplans: Floorplan[]): ProrateResult {
    const catalog = catalogFloorplans.filter((fp) => !fp._id.startsWith("custom_"));
    if (catalog.length === 0) return { price: 0, lowerUnit: null, upperUnit: null, exact: false };

    // For each unique sqft level, use the lowest-priced unit as the interpolation anchor.
    // This means 750+ (extra bath) doesn't skew the base curve.
    const bySquft = new Map<number, Floorplan>();
    for (const fp of catalog) {
        const existing = bySquft.get(fp.sqft);
        if (!existing || fp.price < existing.price) bySquft.set(fp.sqft, fp);
    }
    const unique = [...bySquft.values()].sort((a, b) => a.sqft - b.sqft);

    if (unique.length === 1) {
        return { price: unique[0].price, lowerUnit: unique[0], upperUnit: unique[0], exact: true };
    }

    // Exact match
    if (bySquft.has(sqft)) {
        const fp = bySquft.get(sqft)!;
        return { price: fp.price, lowerUnit: fp, upperUnit: fp, exact: true };
    }

    // Below catalog minimum
    if (sqft < unique[0].sqft) {
        return { price: unique[0].price, lowerUnit: unique[0], upperUnit: unique[0], exact: false };
    }

    // Above catalog maximum
    if (sqft > unique[unique.length - 1].sqft) {
        const last = unique[unique.length - 1];
        return { price: last.price, lowerUnit: last, upperUnit: last, exact: false };
    }

    // Find the two flanking neighbors
    let lo = unique[0];
    let hi = unique[unique.length - 1];
    for (let i = 0; i < unique.length - 1; i++) {
        if (unique[i].sqft <= sqft && unique[i + 1].sqft >= sqft) {
            lo = unique[i];
            hi = unique[i + 1];
            break;
        }
    }

    const t = (sqft - lo.sqft) / (hi.sqft - lo.sqft);
    const price = Math.round(lo.price + t * (hi.price - lo.price));
    return { price, lowerUnit: lo, upperUnit: hi, exact: false };
}

// ─── Component ────────────────────────────────────────────────────────────────

export function InvestmentControls({
    defaults,
    defaultsProp,
    setDefaults,
    updateDefault,
    allFloorplans,
    aduCompareIds,
    toggleAdu,
    view = "all",
    onAddCustomFloorplan,
    onRemoveFloorplan,
    onDuplicateFloorplan,
}: {
    styles?: any;
    defaults: Defaults;
    defaultsProp?: Partial<Defaults>;
    setDefaults: React.Dispatch<React.SetStateAction<Defaults>>;
    updateDefault: <K extends keyof Defaults>(key: K, next: Defaults[K]) => void;
    allFloorplans: Floorplan[];
    aduCompareIds: string[];
    toggleAdu: (id: string) => void;
    view?: "picker" | "assumptions" | "all";
    onAddCustomFloorplan?: (input: {
        name?: string;
        sqft: number;
        price: number;
        bedrooms?: number;
        bathrooms?: number;
        imageUrl?: string;
    }) => void;
    onRemoveFloorplan?: (id: string) => void;
    onDuplicateFloorplan?: (sourceId: string) => void;
}) {
    const showPicker = view !== "assumptions";
    const showAssumptions = view !== "picker";

    const [customSqftRaw, setCustomSqftRaw] = useState("");
    const [customName, setCustomName] = useState("");
    const [customBedrooms, setCustomBedrooms] = useState<string>("");
    const [customBathrooms, setCustomBathrooms] = useState<string>("");
    const [extraBath, setExtraBath] = useState(false);
    const [customImageUrl, setCustomImageUrl] = useState("");

    const customSqft = useMemo(() => {
        const n = parseInt(customSqftRaw, 10);
        return Number.isFinite(n) && n > 0 ? n : null;
    }, [customSqftRaw]);

    const proration = useMemo(
        () => (customSqft != null ? computeProration(customSqft, allFloorplans) : null),
        [customSqft, allFloorplans]
    );

    const finalPrice = proration != null
        ? proration.price + (extraBath ? EXTRA_BATH_PREMIUM : 0)
        : 0;

    const atMax = aduCompareIds.length >= defaults.maxAduComparisons;

    function parseOptionalNumber(raw: string): number | undefined {
        if (!raw.trim()) return undefined;
        const n = Number(raw);
        return Number.isFinite(n) && n >= 0 ? n : undefined;
    }

    function handleAdd() {
        if (customSqft == null || finalPrice <= 0 || !onAddCustomFloorplan) return;
        const beds = parseOptionalNumber(customBedrooms);
        const baths = parseOptionalNumber(customBathrooms) ?? (extraBath ? 2 : undefined);
        onAddCustomFloorplan({
            name: customName.trim() || undefined,
            sqft: customSqft,
            price: finalPrice,
            bedrooms: beds,
            bathrooms: baths,
            imageUrl: customImageUrl.trim() || undefined,
        });
        setCustomSqftRaw("");
        setCustomName("");
        setCustomBedrooms("");
        setCustomBathrooms("");
        setExtraBath(false);
        setCustomImageUrl("");
    }

    // Describe the interpolation anchor to the user
    const anchorLabel = useMemo(() => {
        if (!proration || !proration.lowerUnit) return null;
        const lo = proration.lowerUnit;
        const hi = proration.upperUnit;
        if (!hi || lo._id === hi._id) return `Matched to ${lo.name} (${num(lo.sqft)} SF)`;
        return `Prorated between ${lo.name} (${num(lo.sqft)} SF) and ${hi.name} (${num(hi.sqft)} SF)`;
    }, [proration]);

    return (
        <div className={view === "all" ? styles.controls : styles.controlsSingle}>
            {showPicker && (
                <div className={styles.controlCard}>
                    <div className={styles.controlTitle}>Compare ADUs</div>
                    <div className={styles.controlSub}>
                        Pick up to {defaults.maxAduComparisons} floorplans to compare.
                    </div>

                    <Field label="Max ADU Comparisons">
                        <NumberInput
                            value={defaults.maxAduComparisons}
                            onChange={(v) =>
                                updateDefault("maxAduComparisons", Math.max(1, Math.round(v)) as any)
                            }
                            step={1}
                        />
                    </Field>

                    <div className={styles.fpList}>
                        {allFloorplans.map((fp) => {
                            const isCustomUnit = fp._id.startsWith("custom_");
                            const checked = aduCompareIds.includes(fp._id);
                            const disabled = !checked && aduCompareIds.length >= defaults.maxAduComparisons;

                            return (
                                <label
                                    key={fp._id}
                                    className={`${styles.fpItem} ${disabled ? styles.fpDisabled : ""} ${isCustomUnit ? styles.fpItemCustom : ""}`}
                                >
                                    <input
                                        type="checkbox"
                                        checked={checked}
                                        disabled={disabled}
                                        onChange={() => toggleAdu(fp._id)}
                                    />
                                    <div className={styles.fpMeta}>
                                        <div className={styles.fpName}>
                                            {fp.name}
                                            {isCustomUnit && (
                                                <span className={styles.fpCustomBadge}>custom</span>
                                            )}
                                        </div>
                                        <div className={styles.fpSub}>
                                            {num(fp.sqft)} SF • {money(fp.price)}
                                        </div>
                                    </div>
                                    {(onDuplicateFloorplan || (isCustomUnit && onRemoveFloorplan)) && (
                                        <div className={styles.fpRowActions}>
                                            {onDuplicateFloorplan && (
                                                <button
                                                    className={styles.fpDuplicateBtn}
                                                    type="button"
                                                    title="Duplicate this unit (copies site work & discounts)"
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        e.stopPropagation();
                                                        onDuplicateFloorplan(fp._id);
                                                    }}
                                                >
                                                    Duplicate
                                                </button>
                                            )}
                                            {isCustomUnit && onRemoveFloorplan && (
                                                <button
                                                    className={styles.fpRemoveBtn}
                                                    type="button"
                                                    title="Remove custom unit"
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        e.stopPropagation();
                                                        onRemoveFloorplan(fp._id);
                                                    }}
                                                >
                                                    ×
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </label>
                            );
                        })}
                    </div>

                    {aduCompareIds.length === 0 && (
                        <div className={styles.warn}>Select at least 1 ADU to compare.</div>
                    )}

                    {/* ── Custom unit creator ──────────────────────────────── */}
                    {onAddCustomFloorplan && (
                        <div className={styles.customUnitForm}>
                            <div className={styles.customUnitLabel}>
                                Add a custom unit
                            </div>

                            <div className={styles.customUnitRow}>
                                <div className={styles.sqftInputWrap}>
                                    <input
                                        type="number"
                                        className={styles.sqftInput}
                                        placeholder="Enter SF"
                                        min={1}
                                        step={10}
                                        value={customSqftRaw}
                                        onChange={(e) => setCustomSqftRaw(e.target.value)}
                                        onKeyDown={(e) => e.key === "Enter" && handleAdd()}
                                    />
                                    <span className={styles.sqftSuffix}>SF</span>
                                </div>

                                {proration && proration.price > 0 && (
                                    <div className={styles.proratedPreview}>
                                        <span className={styles.proratedValue}>{money(finalPrice)}</span>
                                    </div>
                                )}

                                <button
                                    type="button"
                                    className={styles.addCustomBtn}
                                    disabled={customSqft == null || atMax}
                                    onClick={handleAdd}
                                    title={atMax ? "Remove a unit first" : "Add custom unit"}
                                >
                                    Add
                                </button>
                            </div>

                            {/* Anchor info + optional fields */}
                            {proration && proration.price > 0 && (
                                <div className={styles.prorateInfo}>
                                    <div className={styles.prorateAnchor}>{anchorLabel}</div>

                                    {/* Optional name override */}
                                    <input
                                        type="text"
                                        className={styles.sqftInput}
                                        placeholder={`Name (default: Custom ${customSqft ?? ""} SF)`}
                                        value={customName}
                                        onChange={(e) => setCustomName(e.target.value)}
                                        style={{ marginTop: 8, width: "100%" }}
                                    />

                                    {/* Bedrooms / bathrooms inputs */}
                                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 8 }}>
                                        <input
                                            type="number"
                                            className={styles.sqftInput}
                                            placeholder="Bedrooms"
                                            min={0}
                                            step={1}
                                            value={customBedrooms}
                                            onChange={(e) => setCustomBedrooms(e.target.value)}
                                        />
                                        <input
                                            type="number"
                                            className={styles.sqftInput}
                                            placeholder="Bathrooms"
                                            min={0}
                                            step={0.5}
                                            value={customBathrooms}
                                            onChange={(e) => setCustomBathrooms(e.target.value)}
                                        />
                                    </div>

                                    {/* Optional image URL */}
                                    <input
                                        type="url"
                                        className={styles.sqftInput}
                                        placeholder="Floorplan image URL (optional)"
                                        value={customImageUrl}
                                        onChange={(e) => setCustomImageUrl(e.target.value)}
                                        style={{ marginTop: 8, width: "100%" }}
                                    />
                                    <div style={{ fontSize: 11, color: "#8A8278", fontStyle: "italic", marginTop: 4 }}>
                                        Leave blank to inherit the nearest matching floorplan&apos;s image.
                                    </div>

                                    {/* Legacy quick-toggle: only auto-bumps the price if bathrooms input is empty */}
                                    {customBathrooms.trim() === "" && (
                                        <label className={styles.extraBathToggle} style={{ marginTop: 8 }}>
                                            <input
                                                type="checkbox"
                                                checked={extraBath}
                                                onChange={(e) => setExtraBath(e.target.checked)}
                                            />
                                            <span className={styles.extraBathLabel}>
                                                Extra bathroom
                                                <span className={styles.extraBathAmount}>+{money(EXTRA_BATH_PREMIUM)}</span>
                                            </span>
                                        </label>
                                    )}

                                    {extraBath && customBathrooms.trim() === "" && (
                                        <div className={styles.prorateBreakdown}>
                                            <span>Base {money(proration.price)}</span>
                                            <span className={styles.breakdownPlus}>+</span>
                                            <span>Bath {money(EXTRA_BATH_PREMIUM)}</span>
                                            <span className={styles.breakdownPlus}>=</span>
                                            <span className={styles.breakdownTotal}>{money(finalPrice)}</span>
                                        </div>
                                    )}
                                </div>
                            )}

                            {atMax && (
                                <div className={styles.customUnitWarn}>
                                    Max comparisons reached — deselect a unit first.
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}

            {showAssumptions && (
                <div className={styles.controlCard}>
                    <div className={styles.controlTitle}>Assumptions</div>
                    <div className={styles.controlSub}>
                        Edit any default and the table updates instantly.
                    </div>

                    <div className={styles.assumptionGrid}>
                        <Field label="Interest Rate" hint="Annual (e.g. 0.065)">
                            <NumberInput value={defaults.interestRate} onChange={(v) => updateDefault("interestRate", v as any)} step={0.0005} />
                        </Field>
                        <Field label="Term Years">
                            <NumberInput value={defaults.termYears} onChange={(v) => updateDefault("termYears", Math.max(1, Math.round(v)) as any)} step={1} />
                        </Field>
                        <Field label="Tax Rate" hint="Annual (e.g. 0.0122)">
                            <NumberInput value={defaults.effectiveTaxRate} onChange={(v) => updateDefault("effectiveTaxRate", v as any)} step={0.0001} />
                        </Field>
                        <Field label="ADU Tax Discount" hint="0.50 = 50%">
                            <NumberInput value={defaults.propertyTaxDiscountAdu} onChange={(v) => updateDefault("propertyTaxDiscountAdu", v as any)} step={0.01} />
                        </Field>
                        <Field label="House Down Payment" hint="0.20 = 20%">
                            <NumberInput value={defaults.downPaymentRateHouse} onChange={(v) => updateDefault("downPaymentRateHouse", v as any)} step={0.01} />
                        </Field>
                        <Field label="ADU Down Payment">
                            <NumberInput value={defaults.downPaymentRateAdu} onChange={(v) => updateDefault("downPaymentRateAdu", v as any)} step={0.01} />
                        </Field>
                        <Field label="House Maintenance (Annual)">
                            <NumberInput value={defaults.maintenanceAnnualHouse} onChange={(v) => updateDefault("maintenanceAnnualHouse", v as any)} step={100} />
                        </Field>
                        <Field label="ADU Maintenance (Annual)">
                            <NumberInput value={defaults.maintenanceAnnualAdu} onChange={(v) => updateDefault("maintenanceAnnualAdu", v as any)} step={50} />
                        </Field>
                        <Field label="House Insurance (Annual)">
                            <NumberInput value={defaults.insuranceAnnualHouse} onChange={(v) => updateDefault("insuranceAnnualHouse", v as any)} step={50} />
                        </Field>
                        <Field label="ADU Insurance (Annual)">
                            <NumberInput value={defaults.insuranceAnnualAdu} onChange={(v) => updateDefault("insuranceAnnualAdu", v as any)} step={25} />
                        </Field>
                        <Field label="NOI Expense Ratio" hint="0.20 = 20%">
                            <NumberInput value={defaults.noiExpenseRatio} onChange={(v) => updateDefault("noiExpenseRatio", v as any)} step={0.01} />
                        </Field>
                        <Field label="ADU Cap Rate">
                            <NumberInput value={defaults.capRateAdu} onChange={(v) => updateDefault("capRateAdu", v as any)} step={0.001} />
                        </Field>
                        <Field label="House Cap Rate">
                            <NumberInput value={defaults.capRateHouse} onChange={(v) => updateDefault("capRateHouse", v as any)} step={0.001} />
                        </Field>
                        <Field label="Equity Premium" hint="0.30 = 30%">
                            <NumberInput value={defaults.equityPremium} onChange={(v) => updateDefault("equityPremium", v as any)} step={0.01} />
                        </Field>
                        <Field label="Equity Growth (Annual)">
                            <NumberInput value={defaults.equityGrowthAnnual} onChange={(v) => updateDefault("equityGrowthAnnual", v as any)} step={0.005} />
                        </Field>
                        <Field label="House Remodel Cost">
                            <NumberInput value={defaults.remodelCostHouse} onChange={(v) => updateDefault("remodelCostHouse", v as any)} step={1000} />
                        </Field>
                    </div>

                    <div className={styles.assumptionActions}>
                        <button
                            type="button"
                            className={styles.reset}
                            onClick={() => setDefaults({ ...DEFAULTS, ...(defaultsProp ?? {}) })}
                        >
                            Reset to defaults
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
    return (
        <div className={styles.assumptionField}>
            <div className={styles.assumptionLabel}>
                {label}
                {hint ? <span className={styles.assumptionHint}>{hint}</span> : null}
            </div>
            {children}
        </div>
    );
}

function NumberInput({ value, onChange, step }: { value: number; onChange: (n: number) => void; step?: number }) {
    return (
        <input
            className={styles.assumptionInput}
            type="number"
            step={step ?? 0.01}
            value={Number.isFinite(value) ? value : 0}
            onChange={(e) => onChange(Number(e.target.value))}
        />
    );
}
