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
import { money, num } from "@/lib/investment/format";
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
    /** Called when the rep confirms the $10k upcharge prompt that fires
     *  after increasing a unit's bathroom count. */
    onAddBathroomUpcharge?: (unitId: string) => void;
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
    onAddCustomFloorplan,
    onRemoveFloorplan,
    onDuplicateFloorplan,
    onAddBathroomUpcharge,
}: Props) {
    const [bathPromptUnitId, setBathPromptUnitId] = useState<string | null>(null);
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

    const finalPrice = proration?.price ?? 0;

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
        setCustomImageUrl("");
        setCustomImageSource(null);
    }

    // ── Per-unit override handlers ──────────────────────────────────────
    function changeType(unitId: string, value: AduType) {
        setAduTypeByUnitId((prev) => ({ ...prev, [unitId]: value }));
    }
    function changeBeds(unitId: string, raw: string) {
        const n = Number(raw);
        if (!Number.isFinite(n)) return;
        setBedsByUnitId((prev) => ({ ...prev, [unitId]: Math.max(0, Math.round(n)) }));
    }
    function changeBaths(unitId: string, raw: string, previous: number) {
        const n = Number(raw);
        if (!Number.isFinite(n)) return;
        const next = Math.max(0, Math.round(n * 2) / 2);
        setBathsByUnitId((prev) => ({ ...prev, [unitId]: next }));
        if (next > previous && onAddBathroomUpcharge) {
            setBathPromptUnitId(unitId);
        }
    }

    return (
        <div className={s.root}>
            {/* ── Selected zone ──────────────────────────────────────── */}
            <div>
                <div className={s.zoneHead}>
                    <span className={s.zoneLabel}>Comparing</span>
                    <span className={s.zoneCount}>
                        {selectedUnits.length} of {defaults.maxAduComparisons}
                        <span style={{ marginLeft: 10 }}>
                            <span className={s.maxHint}>
                                Max&nbsp;
                                <input
                                    type="number"
                                    min={1}
                                    step={1}
                                    value={defaults.maxAduComparisons}
                                    onChange={(e) =>
                                        updateDefault(
                                            "maxAduComparisons",
                                            Math.max(1, Math.round(Number(e.target.value) || 1)) as any
                                        )
                                    }
                                />
                            </span>
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
                            const promptOpen = bathPromptUnitId === fp._id;

                            return (
                                <div key={fp._id} className={s.selectedCard}>
                                    {imgSrc ? (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img src={imgSrc} alt={`${fp.name} thumbnail`} className={s.selectedThumb} />
                                    ) : (
                                        <div className={s.selectedThumbFallback}>{isCustom ? "Custom" : "Unit"}</div>
                                    )}

                                    <div className={s.selectedBody}>
                                        <div className={s.selectedMeta}>
                                            <span className={s.selectedName}>{fp.name}</span>
                                            <span className={s.selectedSub}>
                                                {num(fp.sqft)} SF · {money(fp.price)}
                                            </span>
                                            {isCustom && <span className={s.customBadge}>custom</span>}
                                        </div>

                                        <div className={s.controls}>
                                            <div className={s.controlField}>
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
                                                <input
                                                    type="number"
                                                    min={0}
                                                    step={1}
                                                    className={s.controlInput}
                                                    value={beds}
                                                    onChange={(e) => changeBeds(fp._id, e.target.value)}
                                                />
                                            </div>

                                            <div className={s.controlField}>
                                                <label className={s.controlLabel}>Baths</label>
                                                <input
                                                    type="number"
                                                    min={0}
                                                    step={0.5}
                                                    className={s.controlInput}
                                                    value={baths}
                                                    onChange={(e) => changeBaths(fp._id, e.target.value, baths)}
                                                />
                                            </div>
                                        </div>

                                        {promptOpen && (
                                            <div className={s.upcharge} role="alert">
                                                <div className={s.upchargeBody}>
                                                    <span className={s.upchargeTitle}>Add bathroom to site work?</span>
                                                    <span className={s.upchargeMeta}>
                                                        We typically charge an extra $10,000 for an additional bathroom — apply it to this unit&apos;s site-specific work?
                                                    </span>
                                                </div>
                                                <div className={s.upchargeActions}>
                                                    <button
                                                        type="button"
                                                        className={s.upchargeNo}
                                                        onClick={() => setBathPromptUnitId(null)}
                                                    >
                                                        No, keep as-is
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className={s.upchargeYes}
                                                        onClick={() => {
                                                            onAddBathroomUpcharge?.(fp._id);
                                                            setBathPromptUnitId(null);
                                                        }}
                                                    >
                                                        Yes, add $10,000
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <div className={s.selectedActions}>
                                        {onDuplicateFloorplan && (
                                            <button
                                                type="button"
                                                className={s.actionBtn}
                                                title="Duplicate this unit — copies its site work & discounts"
                                                onClick={() => onDuplicateFloorplan(fp._id)}
                                            >
                                                Duplicate
                                            </button>
                                        )}
                                        <button
                                            type="button"
                                            className={`${s.actionBtn} ${s.actionRemove}`}
                                            onClick={() => {
                                                if (isCustom && onRemoveFloorplan) onRemoveFloorplan(fp._id);
                                                else toggleAdu(fp._id);
                                            }}
                                            title={isCustom ? "Remove this custom unit" : "Remove from comparison"}
                                        >
                                            ✕ Remove
                                        </button>
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
                        <span className={s.customLabel}>Add a custom size</span>
                        <span className={s.customHint}>
                            Price is prorated between the closest catalog sizes
                        </span>
                    </div>

                    <div className={s.customRow}>
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

                        {proration && proration.price > 0 ? (
                            <span className={s.customPrice}>{money(finalPrice)}</span>
                        ) : (
                            <span className={s.customPriceEmpty}>Enter square footage to preview price</span>
                        )}

                        <button
                            type="button"
                            className={s.customAddBtn}
                            disabled={customSqft == null || atMax}
                            onClick={handleAdd}
                            title={atMax ? "Remove a unit first" : "Add custom unit"}
                        >
                            + Add unit
                        </button>
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
                                    <input
                                        type="number"
                                        className={s.customInput}
                                        min={0}
                                        step={1}
                                        value={customBeds}
                                        onChange={(e) => {
                                            setCustomBedsTouched(true);
                                            setCustomBeds(e.target.value);
                                        }}
                                    />
                                </div>

                                <div className={s.customField}>
                                    <label className={s.customFieldLabel}>Baths</label>
                                    <input
                                        type="number"
                                        className={s.customInput}
                                        min={0}
                                        step={0.5}
                                        value={customBaths}
                                        onChange={(e) => {
                                            setCustomBathsTouched(true);
                                            setCustomBaths(e.target.value);
                                        }}
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

                    {atMax && (
                        <div className={s.warn}>
                            Max comparisons reached — remove a unit before adding a new one.
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
