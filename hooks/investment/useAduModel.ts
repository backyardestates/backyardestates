"use client";

import { useEffect, useMemo, useState } from "react";
import type { Floorplan, PropertyRecord, AvmValue, RentalListing } from "@/lib/rentcast/types";
import type { Defaults, Scenario, RowSpec } from "@/lib/investment/types";
import { DEFAULTS } from "@/lib/investment/types";
import { asNumber, clamp, median } from "@/lib/investment/format";
import { buildRows } from "@/lib/investment/rows";
import { buildScenarios } from "@/lib/investment/scenario";
import {
    type EstimatorState,
    type ActiveLineItem,
    type SiteWorkCatalogData,
    type SiteWorkCategory,
    SITE_WORK_CATEGORIES,
    computeTotal,
    createEmptyState,
    mergeEstimatorStates,
    buildActiveSnapshot,
    catalogToSiteWorkCategories,
} from "@/lib/investment/siteWorkItems";
import {
    computeDiscountTotal,
    createEmptyDiscountState,
    getDiscountLines,
    catalogToPresets,
    PRESETS,
    type DiscountState,
    type PresetLike,
    type DiscountsCatalogSummary,
} from "@/lib/investment/discounts";
import type { RentcastMarketStats } from "@/hooks/rentcast/useRentcastData";
import { scopedCompanionKey } from "@/lib/admin/companionKeys";


export interface UseAduModelInput {
    allFloorplans: Floorplan[];
    aduCompareIds: string[];
    setAduCompareIds: React.Dispatch<React.SetStateAction<string[]>>;
    maxAduComparisons: number;
    property: PropertyRecord | null;
    avm: AvmValue | null;
    rentals: RentalListing[];
    market: RentcastMarketStats | null;
    selectedFloorplan: Floorplan | null;
    owed: string;
    defaultsProp?: Partial<Defaults>;
    discountsCatalog?: DiscountsCatalogSummary;
    siteWorkCatalog?: SiteWorkCatalogData;
}

export function useAduModel({
    allFloorplans,
    aduCompareIds,
    setAduCompareIds,
    maxAduComparisons,
    property,
    avm,
    rentals,
    market,
    selectedFloorplan,
    owed,
    defaultsProp,
    discountsCatalog,
    siteWorkCatalog,
}: UseAduModelInput) {

    // Resolve presets from the DB catalog when available; otherwise fall back
    // to the legacy hardcoded PRESETS. Memoized on the catalog reference.
    const resolvedPresets: PresetLike[] = useMemo(() => {
        if (discountsCatalog && discountsCatalog.items.length > 0) {
            const fromCatalog = catalogToPresets(discountsCatalog.items);
            if (fromCatalog.length > 0) return fromCatalog;
        }
        return PRESETS;
    }, [discountsCatalog]);

    // Same pattern for site-work categories.
    const resolvedSiteWorkCategories: SiteWorkCategory[] = useMemo(() => {
        if (siteWorkCatalog && siteWorkCatalog.categories.length > 0) {
            const fromCatalog = catalogToSiteWorkCategories(siteWorkCatalog);
            if (fromCatalog.length > 0) return fromCatalog;
        }
        return SITE_WORK_CATEGORIES;
    }, [siteWorkCatalog]);

    const [estimatorByAduId, setEstimatorByAduId] = useState<Record<string, EstimatorState>>({});
    const [baseCostByAduId, setBaseCostByAduId] = useState<Record<string, string>>({});
    const [sqftByAduId, setSqftByAduId] = useState<Record<string, string>>({});
    const [rentByAduId, setRentByAduId] = useState<Record<string, string>>({});
    const [discountAmountByAduId, setDiscountAmountByAduId] = useState<Record<string, number>>({});
    const [discountLinesByAduId, setDiscountLinesByAduId] = useState<Record<string, { label: string; amount: number }[]>>({});
    const [defaults, setDefaults] = useState<Defaults>({ ...DEFAULTS, ...(defaultsProp ?? {}) });
    const [showDebug, setShowDebug] = useState(false);
    // Rep override for the MAIN HOUSE monthly rent (drives the house column on
    // the "ADU vs buying a house" slide). Empty string = use the automatic
    // estimate (Zillow rentZestimate → median-scaled fallback).
    const [houseRentOverride, setHouseRentOverride] = useState<string>("");

    const selectedAdus = useMemo(() => {
        const map = new Map(allFloorplans.map((f) => [f._id, f]));
        return aduCompareIds.map((id) => map.get(id)).filter(Boolean) as Floorplan[];
    }, [aduCompareIds, allFloorplans]);

    // Hydrate estimatorByAduId and discountAmountByAduId/discountLinesByAduId from
    // localStorage so data is available even when step panels are collapsed/unmounted.
    useEffect(() => {
        if (typeof window === "undefined") return;
        try {
            const swMaster: EstimatorState = JSON.parse(localStorage.getItem(scopedCompanionKey("swp_master")) ?? "null") ?? createEmptyState(resolvedSiteWorkCategories);
            const swCustom: Record<string, EstimatorState | null> = JSON.parse(localStorage.getItem(scopedCompanionKey("swp_custom")) ?? "null") ?? {};
            setEstimatorByAduId((prev) => {
                const next = { ...prev };
                for (const fp of selectedAdus) {
                    if (!next[fp._id]) next[fp._id] = swCustom[fp._id] ?? swMaster;
                }
                return next;
            });
        } catch { /* malformed */ }

        try {
            const dpMaster: DiscountState = JSON.parse(localStorage.getItem(scopedCompanionKey("dp_master")) ?? "null") ?? createEmptyDiscountState();
            const dpCustom: Record<string, DiscountState | null> = JSON.parse(localStorage.getItem(scopedCompanionKey("dp_custom")) ?? "null") ?? {};
            const amounts: Record<string, number> = {};
            const lines: Record<string, { label: string; amount: number }[]> = {};
            for (const fp of selectedAdus) {
                const effective = dpCustom[fp._id] ?? dpMaster;
                amounts[fp._id] = computeDiscountTotal(effective, resolvedPresets);
                lines[fp._id] = getDiscountLines(effective, resolvedPresets);
            }
            setDiscountAmountByAduId((prev) => {
                const next = { ...prev };
                for (const fp of selectedAdus) {
                    if (!next[fp._id]) next[fp._id] = amounts[fp._id];
                }
                return next;
            });
            setDiscountLinesByAduId((prev) => {
                const next = { ...prev };
                for (const fp of selectedAdus) {
                    if (!next[fp._id]) next[fp._id] = lines[fp._id];
                }
                return next;
            });
        } catch { /* malformed */ }
    }, [selectedAdus, resolvedPresets, resolvedSiteWorkCategories]);

    const subjectSqft = avm?.subjectProperty?.squareFootage ?? property?.squareFootage ?? undefined;
    const housePrice = avm?.price ?? avm?.priceRangeHigh ?? avm?.priceRangeLow ?? property?.lastSalePrice ?? undefined;

    const rentalMedian = useMemo(() => {
        const rents = rentals.map((r) => r.price).filter((v): v is number => typeof v === "number");
        return median(rents);
    }, [rentals]);

    // ── Zillow rent for the customer's main house, via HasData ──
    // Source of truth for the house's rentMonthly (and therefore its cashflow).
    // Falls back to the median-scaled estimate when Zillow returns nothing.
    const [zillowRentEstimate, setZillowRentEstimate] = useState<number | null>(null);
    const propertyAddress = property?.formattedAddress;

    useEffect(() => {
        if (!propertyAddress) {
            setZillowRentEstimate(null);
            return;
        }
        let cancelled = false;
        fetch(`/api/hasdata/zillow-rent?address=${encodeURIComponent(propertyAddress)}`)
            .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
            .then((data) => {
                if (cancelled) return;
                const v = data?.rentZestimate;
                setZillowRentEstimate(typeof v === "number" && v > 0 ? v : null);
            })
            .catch(() => {
                if (!cancelled) setZillowRentEstimate(null);
            });
        return () => {
            cancelled = true;
        };
    }, [propertyAddress]);

    // Automatic main-house rent estimate (no override applied) — also surfaced
    // to the UI so the rep sees what "auto" would be while overriding.
    const houseRentAuto = useMemo(() => {
        // Prefer Zillow's rentZestimate for the main house.
        if (zillowRentEstimate && zillowRentEstimate > 0) return zillowRentEstimate;
        // Fall back to the median-scaled calculation when Zillow is unavailable.
        if (!rentalMedian || !subjectSqft || !selectedFloorplan?.sqft) return undefined;
        const ratio = clamp(subjectSqft / selectedFloorplan.sqft, 1.2, 2.2);
        return rentalMedian * ratio;
    }, [zillowRentEstimate, rentalMedian, subjectSqft, selectedFloorplan?.sqft]);

    // Effective value fed into the scenarios: rep override wins when set.
    const houseRentEstimate = useMemo(() => {
        const override = asNumber(houseRentOverride);
        if (override !== undefined && override > 0) return override;
        return houseRentAuto;
    }, [houseRentOverride, houseRentAuto]);

    const scenarios = useMemo<Scenario[]>(
        () =>
            buildScenarios({
                defaults,
                housePrice,
                houseRentEstimate,
                rentals,
                selectedAdus,
                subjectSqft,
                market,
                siteWorkByAduId: Object.fromEntries(
                    selectedAdus.map((fp) => [
                        fp._id,
                        computeTotal(
                            estimatorByAduId[fp._id] ?? createEmptyState(resolvedSiteWorkCategories),
                            resolvedSiteWorkCategories,
                        ),
                    ])
                ),
                rentByAduId: Object.fromEntries(
                    selectedAdus.map((fp) => [fp._id, asNumber(rentByAduId[fp._id]) ?? undefined])
                ),
                baseCostByAduId: Object.fromEntries(
                    selectedAdus.map((fp) => [fp._id, asNumber(baseCostByAduId[fp._id]) ?? undefined])
                ),
                sqftByAduId: Object.fromEntries(
                    selectedAdus.map((fp) => [fp._id, asNumber(sqftByAduId[fp._id]) ?? undefined])
                ),
                discountByAduId: discountAmountByAduId,
                discountLinesByAduId,
            }),
        [
            defaults, housePrice, houseRentEstimate, rentals, selectedAdus,
            subjectSqft, market, estimatorByAduId, rentByAduId, baseCostByAduId,
            sqftByAduId, discountAmountByAduId, discountLinesByAduId,
        ]
    );

    const aduScenarios = useMemo(() => scenarios.filter((s) => s.kind === "adu"), [scenarios]);
    const columns = useMemo(() => scenarios.map((s) => ({ key: s.key, title: s.title, sqft: s.sqft })), [scenarios]);
    const rows = useMemo<RowSpec[]>(() => buildRows(defaults), [defaults]);

    // Auto-fill the per-unit rent input from each scenario's computed rentMonthly.
    // Step 5 and Step 6 both read from rentByAduId, so once it's populated they
    // stay tied to the same value and propagate edits through the model.
    // Only fills truly-empty entries — once the user types anything (including 0),
    // we preserve their value.
    useEffect(() => {
        setRentByAduId((prev) => {
            let changed = false;
            const next = { ...prev };
            for (const sc of aduScenarios) {
                const id = sc.key.replace(/^adu_/, "");
                const cur = next[id];
                const estimated = Math.round(sc.rentMonthly ?? 0);
                if ((cur === undefined || cur === "") && estimated > 0) {
                    next[id] = String(estimated);
                    changed = true;
                }
            }
            return changed ? next : prev;
        });
    }, [aduScenarios]);

    // Drop rent overrides for ADUs no longer in the comparison so a re-add starts
    // fresh from the latest estimate.
    useEffect(() => {
        setRentByAduId((prev) => {
            const allowed = new Set(selectedAdus.map((fp) => fp._id));
            let changed = false;
            const next: Record<string, string> = {};
            for (const [id, v] of Object.entries(prev)) {
                if (allowed.has(id)) {
                    next[id] = v;
                } else {
                    changed = true;
                }
            }
            return changed ? next : prev;
        });
    }, [selectedAdus]);

    const activeSnapshotByAduId = useMemo<Record<string, ActiveLineItem[]>>(() => {
        const out: Record<string, ActiveLineItem[]> = {};
        for (const fp of selectedAdus) {
            out[fp._id] = buildActiveSnapshot(
                estimatorByAduId[fp._id] ?? createEmptyState(resolvedSiteWorkCategories),
                resolvedSiteWorkCategories,
            );
        }
        return out;
    }, [selectedAdus, estimatorByAduId, resolvedSiteWorkCategories]);

    function toggleAdu(id: string) {
        setAduCompareIds((prev) => {
            const exists = prev.includes(id);
            if (exists) return prev.filter((x) => x !== id);
            // Use the live `defaults.maxAduComparisons` (which the UnitsPanel's
            // "Max" input edits via updateDefault) rather than the prop, which
            // is only an initial-mount value. Without this, raising the Max
            // input would have no effect on the add-blocker.
            if (prev.length >= defaults.maxAduComparisons) return prev;
            return [...prev, id];
        });
    }

    function updateDefault<K extends keyof Defaults>(key: K, next: Defaults[K]) {
        setDefaults((d) => ({ ...d, [key]: next }));
    }

    function copyEstimatorToOthers(sourceId: string, source: EstimatorState) {
        setEstimatorByAduId((prev) => {
            const next = { ...prev };
            for (const other of selectedAdus) {
                if (other._id === sourceId) continue;
                const target = next[other._id] ?? createEmptyState(resolvedSiteWorkCategories);
                next[other._id] = mergeEstimatorStates(source, target);
            }
            return next;
        });
    }

    return {
        // estimator
        estimatorByAduId, setEstimatorByAduId,
        copyEstimatorToOthers,
        createEmptyState,
        // cost/sqft/rent overrides
        baseCostByAduId, setBaseCostByAduId,
        sqftByAduId, setSqftByAduId,
        rentByAduId, setRentByAduId,
        houseRentOverride, setHouseRentOverride, houseRentAuto,
        // discounts
        discountAmountByAduId, setDiscountAmountByAduId,
        discountLinesByAduId, setDiscountLinesByAduId,
        // model defaults
        defaults, setDefaults, updateDefault,
        // debug
        showDebug, setShowDebug,
        // computed
        selectedAdus,
        scenarios, aduScenarios,
        columns, rows,
        activeSnapshotByAduId,
        // adu toggle
        toggleAdu,
        // derived helpers for step 3
        owed,
    };
}
