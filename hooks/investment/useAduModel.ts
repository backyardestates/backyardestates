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
    computeTotal,
    createEmptyState,
    mergeEstimatorStates,
    buildActiveSnapshot,
} from "@/lib/investment/siteWorkItems";
import {
    computeDiscountTotal,
    createEmptyDiscountState,
    getDiscountLines,
    type DiscountState,
} from "@/lib/investment/discounts";
import type { RentcastMarketStats } from "@/hooks/rentcast/useRentcastData";


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
}: UseAduModelInput) {

    const [estimatorByAduId, setEstimatorByAduId] = useState<Record<string, EstimatorState>>({});
    const [baseCostByAduId, setBaseCostByAduId] = useState<Record<string, string>>({});
    const [sqftByAduId, setSqftByAduId] = useState<Record<string, string>>({});
    const [rentByAduId, setRentByAduId] = useState<Record<string, string>>({});
    const [discountAmountByAduId, setDiscountAmountByAduId] = useState<Record<string, number>>({});
    const [discountLinesByAduId, setDiscountLinesByAduId] = useState<Record<string, { label: string; amount: number }[]>>({});
    const [defaults, setDefaults] = useState<Defaults>({ ...DEFAULTS, ...(defaultsProp ?? {}) });
    const [showDebug, setShowDebug] = useState(false);

    const selectedAdus = useMemo(() => {
        const map = new Map(allFloorplans.map((f) => [f._id, f]));
        return aduCompareIds.map((id) => map.get(id)).filter(Boolean) as Floorplan[];
    }, [aduCompareIds, allFloorplans]);

    // Hydrate estimatorByAduId and discountAmountByAduId/discountLinesByAduId from
    // localStorage so data is available even when step panels are collapsed/unmounted.
    useEffect(() => {
        if (typeof window === "undefined") return;
        try {
            const swMaster: EstimatorState = JSON.parse(localStorage.getItem("swp_master") ?? "null") ?? createEmptyState();
            const swCustom: Record<string, EstimatorState | null> = JSON.parse(localStorage.getItem("swp_custom") ?? "null") ?? {};
            setEstimatorByAduId((prev) => {
                const next = { ...prev };
                for (const fp of selectedAdus) {
                    if (!next[fp._id]) next[fp._id] = swCustom[fp._id] ?? swMaster;
                }
                return next;
            });
        } catch { /* malformed */ }

        try {
            const dpMaster: DiscountState = JSON.parse(localStorage.getItem("dp_master") ?? "null") ?? createEmptyDiscountState();
            const dpCustom: Record<string, DiscountState | null> = JSON.parse(localStorage.getItem("dp_custom") ?? "null") ?? {};
            const amounts: Record<string, number> = {};
            const lines: Record<string, { label: string; amount: number }[]> = {};
            for (const fp of selectedAdus) {
                const effective = dpCustom[fp._id] ?? dpMaster;
                amounts[fp._id] = computeDiscountTotal(effective);
                lines[fp._id] = getDiscountLines(effective);
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
    }, [selectedAdus]);

    const subjectSqft = avm?.subjectProperty?.squareFootage ?? property?.squareFootage ?? undefined;
    const housePrice = avm?.price ?? avm?.priceRangeHigh ?? avm?.priceRangeLow ?? property?.lastSalePrice ?? undefined;

    const rentalMedian = useMemo(() => {
        const rents = rentals.map((r) => r.price).filter((v): v is number => typeof v === "number");
        return median(rents);
    }, [rentals]);

    const houseRentEstimate = useMemo(() => {
        if (!rentalMedian || !subjectSqft || !selectedFloorplan?.sqft) return undefined;
        const ratio = clamp(subjectSqft / selectedFloorplan.sqft, 1.2, 2.2);
        return rentalMedian * ratio;
    }, [rentalMedian, subjectSqft, selectedFloorplan?.sqft]);

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
                        computeTotal(estimatorByAduId[fp._id] ?? createEmptyState()),
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
            out[fp._id] = buildActiveSnapshot(estimatorByAduId[fp._id] ?? createEmptyState());
        }
        return out;
    }, [selectedAdus, estimatorByAduId]);

    function toggleAdu(id: string) {
        setAduCompareIds((prev) => {
            const exists = prev.includes(id);
            if (exists) return prev.filter((x) => x !== id);
            if (prev.length >= maxAduComparisons) return prev;
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
                const target = next[other._id] ?? createEmptyState();
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
