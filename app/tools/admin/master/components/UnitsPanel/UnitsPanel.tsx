// Merged ADU picker + per-unit customizer.
//
// Replaces the previous two-component stack (InvestmentControls picker view +
// UnitOverridesPanel) with a single coherent surface:
//
//   • Selected zone — full-width cards. Each card shows the unit's thumbnail,
//     name, sqft & price, and inline type/beds/baths controls. Catalog units
//     can be duplicated; custom units can be duplicated or removed; any unit
//     can be deselected.
//   • Available zone — compact "+ Name (sqft)" chips. One click adds.
//   • Add a custom size — single-line affordance that progressively discloses
//     pricing preview + optional name/beds/baths/image when a sqft is entered.
//
// Pricing proration logic for custom units is preserved verbatim from the
// original InvestmentControls. State plumbing for per-unit overrides matches
// UnitOverridesPanel's setters.

"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import type { Floorplan } from "@/lib/rentcast/types";
import type { Defaults } from "@/lib/investment/types";
import { resolveBeds, resolveBaths, type AduType } from "@/lib/units/resolveUnitSpec";
import { unitNameParts } from "@/lib/units/displayName";
import { money, num } from "@/lib/investment/format";
import { Stepper } from "../Stepper/Stepper";
import s from "./UnitsPanel.module.css";

const EXTRA_BATH_PREMIUM = 10_000;

const TYPE_OPTIONS: { value: AduType; label: string }[] = [
    { value: "detached", label: "Detached" },
    { value: "attached", label: "Attached" },
    { value: "garage",   label: "Garage Conversion" },
];

// ── Proration helper (unchanged from InvestmentControls) ────────────────────

interface ProrateResult {
    price: number;
    lowerUnit: Floorplan | null;
    upperUnit: Floorplan | null;
    exact: boolean;
}

function computeProration(sqft: number, catalogFloorplans: Floorplan[]): ProrateResult {
    const catalog = catalogFloorplans.filter((fp) => !fp._id.startsWith("custom_"));
    if (catalog.length === 0) return { price: 0, lowerUnit: null, upperUnit: null, exact: false };

    const bySquft = new Map<number, Floorplan>();
    for (const fp of catalog) {
        const existing = bySquft.get(fp.sqft);
        if (!existing || fp.price < existing.price) bySquft.set(fp.sqft, fp);
    }
    const unique = [...bySquft.values()].sort((a, b) => a.sqft - b.sqft);

    if (unique.length === 1) {
        return { price: unique[0].price, lowerUnit: unique[0], upperUnit: unique[0], exact: true };
    }
    if (bySquft.has(sqft)) {
        const fp = bySquft.get(sqft)!;
        return { price: fp.price, lowerUnit: fp, upperUnit: fp, exact: true };
    }
    if (sqft < unique[0].sqft) {
        return { price: unique[0].price, lowerUnit: unique[0], upperUnit: unique[0], exact: false };
    }
    if (sqft > unique[unique.length - 1].sqft) {
        const last = unique[unique.length - 1];
        return { price: last.price, lowerUnit: last, upperUnit: last, exact: false };
    }

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

// ── Props ───────────────────────────────────────────────────────────────────

interface Props {
    allFloorplans: Floorplan[];
    aduCompareIds: string[];
    toggleAdu: (id: string) => void;

    defaults: Defaults;
    updateDefault: <K extends keyof Defaults>(key: K, next: Defaults[K]) => void;

    globalAduType: AduType | "";

    aduTypeByUnitId: Record<string, AduType>;
    setAduTypeByUnitId: (
        update: (prev: Record<string, AduType>) => Record<string, AduType>
    ) => void;
    bedsByUnitId: Record<string, number>;
    setBedsByUnitId: (update: (prev: Record<string, number>) => Record<string, number>) => void;
    bathsByUnitId: Record<string, number>;
    setBathsByUnitId: (update: (prev: Record<string, number>) => Record<string, number>) => void;
    labelByUnitId: Record<string, string>;
    setLabelByUnitId: (update: (prev: Record<string, string>) => Record<string, string>) => void;

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
    /** Idempotently reprices a unit when its bath count changes: base price =
     *  the floorplan's standard price + $10k per bath above its standard count. */
    setBaseCostByAduId?: React.Dispatch<React.SetStateAction<Record<string, string>>>;
}

// ── Component ───────────────────────────────────────────────────────────────

export function UnitsPanel({
    allFloorplans,
    aduCompareIds,
    toggleAdu,
    defaults,
    updateDefault,
    globalAduType,
    aduTypeByUnitId,
    setAduTypeByUnitId,
    bedsByUnitId,
    setBedsByUnitId,
    bathsByUnitId,
    setBathsByUnitId,
    labelByUnitId,
    setLabelByUnitId,
    onAddCustomFloorplan,
    onRemoveFloorplan,
    onDuplicateFloorplan,
    setBaseCostByAduId,
}: Props) {
    const selectedUnits = useMemo(
        () => aduCompareIds
            .map((id) => allFloorplans.find((fp) => fp._id === id))
            .filter((fp): fp is Floorplan => fp != null),
        [aduCompareIds, allFloorplans]
    );

    const [showAllCatalog, setShowAllCatalog] = useState(false);

    // The full available list (everything in catalog the rep hasn't already
    // selected), sorted by sqft.
    const allAvailable = useMemo(
        () => allFloorplans
            .filter((fp) => !aduCompareIds.includes(fp._id))
            .sort((a, b) => (a.sqft ?? 0) - (b.sqft ?? 0)),
        [allFloorplans, aduCompareIds]
    );

    // Narrow to the 2 nearest-sized units around each currently-selected
    // unit. So if the rep picked the 1200, they see 950 + 800 (its closest
    // neighbours) — not the entire catalog. They can still hit "Show all
    // sizes" to break out of this filter.
    const NEAREST_PER_SELECTED = 2;
    const availableUnits = useMemo(() => {
        if (showAllCatalog || aduCompareIds.length === 0) return allAvailable;

        const selectedFps = aduCompareIds
            .map((id) => allFloorplans.find((fp) => fp._id === id))
            .filter((fp): fp is Floorplan => fp != null);

        const wantedIds = new Set<string>();
        for (const sel of selectedFps) {
            const sorted = [...allAvailable].sort(
                (a, b) =>
                    Math.abs((a.sqft ?? 0) - (sel.sqft ?? 0)) -
                    Math.abs((b.sqft ?? 0) - (sel.sqft ?? 0))
            );
            for (let i = 0; i < Math.min(NEAREST_PER_SELECTED, sorted.length); i++) {
                wantedIds.add(sorted[i]._id);
            }
        }
        return allAvailable.filter((fp) => wantedIds.has(fp._id));
    }, [allAvailable, aduCompareIds, allFloorplans, showAllCatalog]);

    const hiddenCount = allAvailable.length - availableUnits.length;

    const atMax = aduCompareIds.length >= defaults.maxAduComparisons;
    const fallbackType: AduType =
        globalAduType === "attached" || globalAduType === "garage" ? globalAduType : "detached";

    // ── Custom-unit creator state ───────────────────────────────────────
    const [customSqftRaw, setCustomSqftRaw] = useState("");
    const [customName, setCustomName] = useState("");
    const [customBeds, setCustomBeds] = useState("");
    const [customBaths, setCustomBaths] = useState("");
    // Track whether the rep has manually touched the beds/baths inputs.
    // Until they do, the inputs auto-fill from the catalog inference (closest
    // catalog sqft → beds/baths). Once touched, we leave their value alone.
    const [customBedsTouched, setCustomBedsTouched] = useState(false);
    const [customBathsTouched, setCustomBathsTouched] = useState(false);
    // Custom-unit price: auto-fills from the prorated value until the rep
    // types their own, after which we leave their number alone.
    const [customPriceRaw, setCustomPriceRaw] = useState("");
    const [customPriceTouched, setCustomPriceTouched] = useState(false);
    // The user's explicit image choice (catalog URL or base64 upload). Empty
    // when they haven't picked anything; we fall back to the closest catalog
    // drawing inferred from sqft below.
    const [customImageUrl, setCustomImageUrl] = useState("");
    // Label of the image source for the "Auto-picked"/"From {name}" caption.
    const [customImageSource, setCustomImageSource] = useState<string | null>(null);
    const [dragOver, setDragOver] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const catalogFloorplans = useMemo(
        () => allFloorplans
            .filter((fp) => !fp._id.startsWith("custom_") && (fp.floorPlanUrl || fp.imageUrl))
            .sort((a, b) => (a.sqft ?? 0) - (b.sqft ?? 0)),
        [allFloorplans]
    );

    const customSqft = useMemo(() => {
        const n = parseInt(customSqftRaw, 10);
        return Number.isFinite(n) && n > 0 ? n : null;
    }, [customSqftRaw]);

    const proration = useMemo(
        () => (customSqft != null ? computeProration(customSqft, allFloorplans) : null),
        [customSqft, allFloorplans]
    );

    // The rep can override the prorated price via the editable Price field.
    const manualPrice = parseOptionalNumber(customPriceRaw);
    const finalPrice = manualPrice ?? (proration?.price ?? 0);

    const anchorLabel = useMemo(() => {
        if (!proration || !proration.lowerUnit) return null;
        const lo = proration.lowerUnit;
        const hi = proration.upperUnit;
        if (!hi || lo._id === hi._id) return `Matched to ${lo.name} (${num(lo.sqft)} SF)`;
        return `Prorated between ${lo.name} (${num(lo.sqft)} SF) and ${hi.name} (${num(hi.sqft)} SF)`;
    }, [proration]);

    // Linearly-interpolated beds/baths from the two flanking catalog units —
    // mirrors the price proration. Used to auto-fill the inputs as the rep
    // enters sqft so they see the bed/bath defaults before clicking Add.
    const inferredBedsBaths = useMemo(() => {
        if (customSqft == null || catalogFloorplans.length === 0) return null;
        const table = catalogFloorplans.map((fp) => ({
            sqft: fp.sqft,
            beds: fp.beds ?? fp.bed ?? fp.bedrooms ?? 0,
            baths: fp.baths ?? fp.bath ?? fp.bathrooms ?? 1,
        }));
        if (table.length === 1) return { beds: table[0].beds, baths: table[0].baths };
        if (customSqft <= table[0].sqft) return { beds: table[0].beds, baths: table[0].baths };
        const last = table[table.length - 1];
        if (customSqft >= last.sqft) return { beds: last.beds, baths: last.baths };
        let lo = table[0]; let hi = last;
        for (let i = 0; i < table.length - 1; i++) {
            if (table[i].sqft <= customSqft && table[i + 1].sqft >= customSqft) {
                lo = table[i]; hi = table[i + 1]; break;
            }
        }
        const t = (customSqft - lo.sqft) / (hi.sqft - lo.sqft);
        return {
            beds: Math.round(lo.beds + t * (hi.beds - lo.beds)),
            baths: Math.round((lo.baths + t * (hi.baths - lo.baths)) * 2) / 2,
        };
    }, [customSqft, catalogFloorplans]);

    // Auto-fill the beds/baths inputs from inference as sqft changes — but
    // only if the rep hasn't typed something explicit in those fields yet.
    useEffect(() => {
        if (!inferredBedsBaths) return;
        if (!customBedsTouched) setCustomBeds(String(inferredBedsBaths.beds));
        if (!customBathsTouched) setCustomBaths(String(inferredBedsBaths.baths));
    }, [inferredBedsBaths, customBedsTouched, customBathsTouched]);

    // Auto-fill the price field with the prorated value until the rep edits it.
    useEffect(() => {
        if (customPriceTouched) return;
        setCustomPriceRaw(proration && proration.price > 0 ? String(proration.price) : "");
    }, [proration, customPriceTouched]);

    // Closest-sqft catalog floorplan — used as the default drawing preview
    // when the rep hasn't picked or uploaded anything yet.
    const inferredImage = useMemo(() => {
        if (customSqft == null || catalogFloorplans.length === 0) return null;
        let closest = catalogFloorplans[0];
        let best = Math.abs(closest.sqft - customSqft);
        for (const fp of catalogFloorplans) {
            const d = Math.abs(fp.sqft - customSqft);
            if (d < best) { closest = fp; best = d; }
        }
        return { url: closest.floorPlanUrl ?? closest.imageUrl ?? "", name: closest.name };
    }, [customSqft, catalogFloorplans]);

    const effectiveImageUrl = customImageUrl || inferredImage?.url || "";
    const effectiveImageCaption = customImageUrl
        ? (customImageSource ?? "Uploaded image")
        : inferredImage
            ? `Auto-picked from ${inferredImage.name}`
            : "No image yet";

    function parseOptionalNumber(raw: string): number | undefined {
        if (!raw.trim()) return undefined;
        const n = Number(raw);
        return Number.isFinite(n) && n >= 0 ? n : undefined;
    }

    function readFileAsDataUrl(file: File) {
        if (!file.type.startsWith("image/")) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            const result = ev.target?.result;
            if (typeof result === "string") {
                setCustomImageUrl(result);
                setCustomImageSource(`Uploaded: ${file.name}`);
            }
        };
        reader.readAsDataURL(file);
    }

    function handleDrop(e: React.DragEvent<HTMLLabelElement>) {
        e.preventDefault();
        setDragOver(false);
        const file = e.dataTransfer.files?.[0];
        if (file) readFileAsDataUrl(file);
    }

    function handleAdd() {
        if (customSqft == null || finalPrice <= 0 || !onAddCustomFloorplan) return;
        onAddCustomFloorplan({
            name: customName.trim() || undefined,
            sqft: customSqft,
            price: finalPrice,
            bedrooms: parseOptionalNumber(customBeds),
            bathrooms: parseOptionalNumber(customBaths),
            imageUrl: effectiveImageUrl || undefined,
        });
        setCustomSqftRaw("");
        setCustomName("");
        setCustomBeds("");
        setCustomBaths("");
        setCustomBedsTouched(false);
        setCustomBathsTouched(false);
        setCustomPriceRaw("");
        setCustomPriceTouched(false);
        setCustomImageUrl("");
        setCustomImageSource(null);
    }

    // ── Per-unit override handlers ──────────────────────────────────────
    function changeType(unitId: string, value: AduType) {
        setAduTypeByUnitId((prev) => ({ ...prev, [unitId]: value }));
    }
    // Set a unit's bath count and idempotently reprice it. Base price =
    // the floorplan's standard price + $10k for every bath above the
    // floorplan's standard count. It's recomputed from the baseline on
    // every change, so lowering the count removes the premium and repeated
    // edits never double-count (the old approach appended a $10k site-work
    // line per click and never removed it).
    function setBathsValue(unitId: string, next: number, fp: Floorplan) {
        const v = Math.max(0, Math.round(next * 2) / 2);
        setBathsByUnitId((prev) => ({ ...prev, [unitId]: v }));
        if (setBaseCostByAduId) {
            const baselineBaths = resolveBaths(fp, {});
            const standardPrice = Number(fp.price) || 0;
            const extraBaths = Math.max(0, v - baselineBaths);
            const repriced = standardPrice + extraBaths * EXTRA_BATH_PREMIUM;
            setBaseCostByAduId((prev) => ({ ...prev, [unitId]: String(repriced) }));
        }
    }

    return (
        <div className={s.root}>
            {/* ── Selected zone ──────────────────────────────────────── */}
            <div>
                <div className={s.zoneHead}>
                    <span className={s.zoneLabel}>Comparing</span>
                    <span className={s.zoneCount}>
                        <span className={s.zoneCountNum}>
                            {selectedUnits.length} of {defaults.maxAduComparisons}
                        </span>
                        <span className={s.maxHint}>
                            <span className={s.maxHintLabel}>Max</span>
                            <Stepper
                                value={defaults.maxAduComparisons}
                                onChange={(n) =>
                                    updateDefault(
                                        "maxAduComparisons",
                                        Math.max(1, Math.round(n)) as any
                                    )
                                }
                                min={1}
                                step={1}
                                size="sm"
                                ariaLabel="Maximum units to compare"
                            />
                        </span>
                    </span>
                </div>

                {selectedUnits.length === 0 ? (
                    <div className={s.emptyState}>
                        <span className={s.emptyArrow}>↓</span>
                        Pick units from the catalog below to start comparing.
                    </div>
                ) : (
                    <div className={s.selectedList}>
                        {selectedUnits.map((fp) => {
                            const isCustom = fp._id.startsWith("custom_");
                            const type = aduTypeByUnitId[fp._id] ?? fallbackType;
                            // Use the resolver helpers so Sanity's singular
                            // `bed`/`bath` fields are picked up alongside the
                            // override map.
                            const beds = resolveBeds(fp, bedsByUnitId);
                            const baths = resolveBaths(fp, bathsByUnitId);
                            const imgSrc = fp.floorPlanUrl || fp.imageUrl || null;
                            // Extra-bath premium baked into the base price (see setBathsValue).
                            const baselineBaths = resolveBaths(fp, {});
                            const bathPremium = Math.max(0, baths - baselineBaths) * EXTRA_BATH_PREMIUM;
                            const nm = unitNameParts(fp.name, labelByUnitId[fp._id]);

                            return (
                                <div key={fp._id} className={s.selectedCard}>
                                    <div className={s.selectedThumbWrap}>
                                        <button
                                            type="button"
                                            className={s.removeCorner}
                                            aria-label={isCustom ? `Remove ${fp.name} (custom unit)` : `Remove ${fp.name} from comparison`}
                                            title={isCustom ? "Remove this custom unit" : "Remove from comparison"}
                                            onClick={() => {
                                                if (isCustom && onRemoveFloorplan) onRemoveFloorplan(fp._id);
                                                else toggleAdu(fp._id);
                                            }}
                                        >
                                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
                                                <path d="M6 6l12 12M18 6L6 18" />
                                            </svg>
                                        </button>
                                        {imgSrc ? (
                                            // eslint-disable-next-line @next/next/no-img-element
                                            <img src={imgSrc} alt={`${fp.name} thumbnail`} className={s.selectedThumb} />
                                        ) : (
                                            <div className={s.selectedThumbFallback}>{isCustom ? "Custom" : "Unit"}</div>
                                        )}
                                    </div>

                                    <div className={s.selectedBody}>
                                        <div className={s.selectedMeta}>
                                            <span className={s.selectedName}>
                                                {nm.base}
                                                {nm.tag ? (
                                                    <span className={s.selectedTag}> · {nm.tag}</span>
                                                ) : nm.dupNum ? (
                                                    ` (${nm.dupNum})`
                                                ) : null}
                                            </span>
                                            {isCustom && <span className={s.customBadge}>custom</span>}
                                        </div>
                                        <div className={s.selectedSub}>
                                            {num(fp.sqft)} SF · {money(fp.price)}
                                        </div>
                                        <div className={s.labelField}>
                                            <svg className={s.labelIcon} width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                                <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
                                                <line x1="7" y1="7" x2="7.01" y2="7" />
                                            </svg>
                                            <input
                                                type="text"
                                                className={s.labelInput}
                                                placeholder="Add a label — e.g. Hillside"
                                                value={labelByUnitId[fp._id] ?? ""}
                                                maxLength={40}
                                                onChange={(e) =>
                                                    setLabelByUnitId((prev) => ({ ...prev, [fp._id]: e.target.value }))
                                                }
                                                aria-label={`Custom label for ${nm.base}`}
                                            />
                                        </div>

                                        <div className={s.controls}>
                                            <div className={`${s.controlField} ${s.controlFieldWide}`}>
                                                <label className={s.controlLabel}>Type</label>
                                                <select
                                                    className={s.controlInput}
                                                    value={type}
                                                    onChange={(e) => changeType(fp._id, e.target.value as AduType)}
                                                >
                                                    {TYPE_OPTIONS.map((o) => (
                                                        <option key={o.value} value={o.value}>{o.label}</option>
                                                    ))}
                                                </select>
                                            </div>

                                            <div className={s.controlField}>
                                                <label className={s.controlLabel}>Beds</label>
                                                <Stepper
                                                    value={beds}
                                                    onChange={(n) =>
                                                        setBedsByUnitId((prev) => ({ ...prev, [fp._id]: Math.max(0, Math.round(n)) }))
                                                    }
                                                    min={0}
                                                    step={1}
                                                    ariaLabel={`${fp.name} bedrooms`}
                                                />
                                            </div>

                                            <div className={s.controlField}>
                                                <label className={s.controlLabel}>
                                                    Baths
                                                    {bathPremium > 0 && (
                                                        <span className={s.premiumTag} title="Added to this unit's base price for the extra bathroom(s)">
                                                            +{money(bathPremium)}
                                                        </span>
                                                    )}
                                                </label>
                                                <Stepper
                                                    value={baths}
                                                    onChange={(n) => setBathsValue(fp._id, n, fp)}
                                                    min={0}
                                                    step={0.5}
                                                    ariaLabel={`${fp.name} bathrooms`}
                                                />
                                            </div>
                                        </div>

                                        {onDuplicateFloorplan && (
                                            <div className={s.cardFooter}>
                                                <button
                                                    type="button"
                                                    className={s.duplicateBtn}
                                                    title="Duplicate this unit — copies its site work & discounts"
                                                    onClick={() => onDuplicateFloorplan(fp._id)}
                                                >
                                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                                        <rect x="9" y="9" width="11" height="11" rx="2" />
                                                        <path d="M5 15V5a2 2 0 0 1 2-2h10" />
                                                    </svg>
                                                    Duplicate
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* ── Available zone ─────────────────────────────────────── */}
            <div>
                <div className={s.zoneHead}>
                    <span className={s.zoneLabel}>
                        Catalog
                        {!showAllCatalog && aduCompareIds.length > 0 && availableUnits.length > 0 && (
                            <span className={s.zoneSubLabel}>Closest sizes to your selection</span>
                        )}
                    </span>
                    <span className={s.zoneCount}>
                        {availableUnits.length} shown
                        {hiddenCount > 0 && (
                            <button
                                type="button"
                                className={s.zoneAction}
                                onClick={() => setShowAllCatalog((v) => !v)}
                            >
                                {showAllCatalog ? "Show closest only" : `Show all ${allAvailable.length} sizes`}
                            </button>
                        )}
                    </span>
                </div>

                {availableUnits.length === 0 ? (
                    <div className={s.availableEmpty}>All catalog units are in the comparison.</div>
                ) : (
                    <div className={s.availableList}>
                        {availableUnits.map((fp) => (
                            <button
                                key={fp._id}
                                type="button"
                                className={s.availableChip}
                                onClick={() => {
                                    // Auto-bump the cap so clicking a chip is
                                    // never a silent no-op when at-max. Matches
                                    // the duplicate-unit behavior in the parent.
                                    if (atMax) {
                                        updateDefault(
                                            "maxAduComparisons",
                                            aduCompareIds.length + 1
                                        );
                                    }
                                    toggleAdu(fp._id);
                                }}
                                title={`Add ${fp.name}`}
                            >
                                <span className={s.plus} aria-hidden="true">+</span>
                                <span className={s.availableChipName}>{fp.name}</span>
                                <span className={s.availableChipSub}>{num(fp.sqft)} SF</span>
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* ── Custom-size creator ────────────────────────────────── */}
            {onAddCustomFloorplan && (
                <div className={s.customSection}>
                    <div className={s.customHead}>
                        <span className={s.customLabel}>Add a custom unit</span>
                        <span className={s.customHint}>
                            Price is prorated between the closest catalog sizes
                        </span>
                    </div>

                    <div className={s.customRow}>
                        <div className={s.customField}>
                            <label className={s.customFieldLabel}>Square footage</label>
                            <div className={s.customSqftWrap}>
                                <input
                                    type="number"
                                    className={s.customSqftInput}
                                    placeholder="700"
                                    min={1}
                                    step={10}
                                    value={customSqftRaw}
                                    onChange={(e) => setCustomSqftRaw(e.target.value)}
                                    onKeyDown={(e) => e.key === "Enter" && handleAdd()}
                                />
                                <span className={s.customSqftSuffix}>SF</span>
                            </div>
                        </div>

                        <div className={s.customField}>
                            <label className={s.customFieldLabel}>Price</label>
                            <div className={s.customMoneyWrap}>
                                <span className={s.customMoneyPrefix}>$</span>
                                <input
                                    className={s.customPriceInput}
                                    inputMode="numeric"
                                    placeholder={proration && proration.price > 0 ? num(proration.price) : "—"}
                                    value={customPriceRaw}
                                    onChange={(e) => {
                                        setCustomPriceTouched(true);
                                        setCustomPriceRaw(e.target.value.replace(/[^0-9.]/g, ""));
                                    }}
                                    onKeyDown={(e) => e.key === "Enter" && handleAdd()}
                                />
                            </div>
                        </div>
                    </div>

                    {proration && proration.price > 0 && (
                        <div className={s.customDetails}>
                            <div className={s.customAnchor}>{anchorLabel}</div>

                            <div className={s.customDetailsGrid}>
                                <div className={s.customField}>
                                    <label className={s.customFieldLabel}>Name (optional)</label>
                                    <input
                                        type="text"
                                        className={s.customInput}
                                        placeholder={`Custom ${customSqft ?? ""} SF`}
                                        value={customName}
                                        onChange={(e) => setCustomName(e.target.value)}
                                    />
                                </div>

                                <div className={s.customField}>
                                    <label className={s.customFieldLabel}>Beds</label>
                                    <Stepper
                                        value={Number(customBeds) || 0}
                                        onChange={(n) => {
                                            setCustomBedsTouched(true);
                                            setCustomBeds(String(Math.max(0, Math.round(n))));
                                        }}
                                        min={0}
                                        step={1}
                                        ariaLabel="Custom unit bedrooms"
                                    />
                                </div>

                                <div className={s.customField}>
                                    <label className={s.customFieldLabel}>Baths</label>
                                    <Stepper
                                        value={Number(customBaths) || 0}
                                        onChange={(n) => {
                                            setCustomBathsTouched(true);
                                            setCustomBaths(String(Math.max(0, Math.round(n * 2) / 2)));
                                        }}
                                        min={0}
                                        step={0.5}
                                        ariaLabel="Custom unit bathrooms"
                                    />
                                </div>
                            </div>

                            {/* ── Floorplan drawing picker ─────────────────── */}
                            <div className={s.imagePicker}>
                                <span className={s.customFieldLabel}>Floorplan drawing</span>
                                <div className={s.imagePickerBody}>
                                    <div className={s.imagePreviewWrap}>
                                        {effectiveImageUrl ? (
                                            // eslint-disable-next-line @next/next/no-img-element
                                            <img
                                                src={effectiveImageUrl}
                                                alt="Floorplan preview"
                                                className={s.imagePreview}
                                            />
                                        ) : (
                                            <div className={s.imagePreviewEmpty}>No drawing</div>
                                        )}
                                        <span className={s.imageCaption}>{effectiveImageCaption}</span>
                                    </div>

                                    <div className={s.imagePickerControls}>
                                        <select
                                            className={s.customInput}
                                            value={
                                                customImageUrl
                                                    ? catalogFloorplans.find(
                                                          (fp) =>
                                                              (fp.floorPlanUrl ?? fp.imageUrl) ===
                                                              customImageUrl
                                                      )?._id ?? "__upload__"
                                                    : ""
                                            }
                                            onChange={(e) => {
                                                const v = e.target.value;
                                                if (v === "") {
                                                    setCustomImageUrl("");
                                                    setCustomImageSource(null);
                                                    return;
                                                }
                                                const fp = catalogFloorplans.find((f) => f._id === v);
                                                if (fp) {
                                                    setCustomImageUrl(fp.floorPlanUrl ?? fp.imageUrl ?? "");
                                                    setCustomImageSource(`From ${fp.name}`);
                                                }
                                            }}
                                        >
                                            <option value="">Auto-pick by sqft</option>
                                            {catalogFloorplans.map((fp) => (
                                                <option key={fp._id} value={fp._id}>
                                                    {fp.name} — {num(fp.sqft)} SF
                                                </option>
                                            ))}
                                            {customImageUrl && customImageUrl.startsWith("data:") && (
                                                <option value="__upload__">{customImageSource ?? "Uploaded image"}</option>
                                            )}
                                        </select>

                                        <label
                                            className={`${s.dropZone} ${dragOver ? s.dropZoneActive : ""}`}
                                            onDragOver={(e) => {
                                                e.preventDefault();
                                                setDragOver(true);
                                            }}
                                            onDragLeave={() => setDragOver(false)}
                                            onDrop={handleDrop}
                                        >
                                            <input
                                                ref={fileInputRef}
                                                type="file"
                                                accept="image/*"
                                                style={{ display: "none" }}
                                                onChange={(e) => {
                                                    const file = e.target.files?.[0];
                                                    if (file) readFileAsDataUrl(file);
                                                    e.target.value = "";
                                                }}
                                            />
                                            <span className={s.dropZoneLabel}>
                                                Drag &amp; drop or <strong>click to upload</strong>
                                            </span>
                                        </label>

                                        {customImageUrl && (
                                            <button
                                                type="button"
                                                className={s.clearImageBtn}
                                                onClick={() => {
                                                    setCustomImageUrl("");
                                                    setCustomImageSource(null);
                                                }}
                                            >
                                                Reset to auto-picked
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className={s.customFooter}>
                        {atMax ? (
                            <span className={s.warn}>
                                Max reached — remove a unit before adding another.
                            </span>
                        ) : (
                            <span className={s.footerHint}>
                                {customSqft == null
                                    ? "Enter a square footage to enable"
                                    : "Adds this unit to the comparison"}
                            </span>
                        )}
                        <button
                            type="button"
                            className={s.customAddBtn}
                            disabled={customSqft == null || atMax}
                            onClick={handleAdd}
                            title={atMax ? "Remove a unit first" : "Add custom unit"}
                        >
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true">
                                <path d="M12 5v14M5 12h14" />
                            </svg>
                            Add unit
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
