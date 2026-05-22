// hooks/investment/useInvestmentModel.ts
"use client";

import { useMemo, useState } from "react";
import type { Floorplan, PropertyRecord, AvmValue, RentalListing } from "@/lib/rentcast/types";
import type { Defaults, Scenario, RowSpec } from "@/lib/investment/types";
import { DEFAULTS } from "@/lib/investment/types";
import { asNumber, clamp, median } from "@/lib/investment/format";
import { buildRows } from "@/lib/investment/rows";
import { buildScenarios } from "@/lib/investment/scenario";
import { useRentcastData } from "../rentcast/useRentcastData";

export function useInvestmentModel(input: {
    property: PropertyRecord | null;
    avm: AvmValue | null;
    rentals: RentalListing[];
    owed: string;
    selectedFloorplan: Floorplan | null;
    allFloorplans: Floorplan[];
    defaultsProp?: Partial<Defaults>;
}) {
    const { property, avm, rentals, owed, selectedFloorplan, allFloorplans, defaultsProp } = input;
    const { market } = useRentcastData();

    const owedNum = useMemo(() => asNumber(owed) ?? 0, [owed]);

    const subjectSqft = avm?.subjectProperty?.squareFootage ?? property?.squareFootage ?? undefined;

    const housePrice =
        avm?.price ?? avm?.priceRangeHigh ?? avm?.priceRangeLow ?? property?.lastSalePrice ?? undefined;

    const rentalMedian = useMemo(() => {
        const rents = rentals.map((r) => r.price).filter((v): v is number => typeof v === "number");
        return median(rents);
    }, [rentals]);

    const houseRentEstimate = useMemo(() => {
        if (!rentalMedian || !subjectSqft || !selectedFloorplan?.sqft) return undefined;
        const ratio = clamp(subjectSqft / selectedFloorplan.sqft, 1.2, 2.2);
        return rentalMedian * ratio;
    }, [rentalMedian, subjectSqft, selectedFloorplan?.sqft]);

    const [showDebug, setShowDebug] = useState(true);

    const [defaults, setDefaults] = useState<Defaults>({
        ...DEFAULTS,
        ...(defaultsProp ?? {}),
    });

    const [aduCompareIds, setAduCompareIds] = useState<string[]>(() => {
        const seed: string[] = [];
        if (selectedFloorplan?._id) seed.push(selectedFloorplan._id);

        const sortedByNearest =
            selectedFloorplan
                ? [...allFloorplans]
                    .filter((fp) => fp._id !== selectedFloorplan._id)
                    .sort((a, b) => Math.abs(a.sqft - selectedFloorplan.sqft) - Math.abs(b.sqft - selectedFloorplan.sqft))
                : [];

        for (const fp of sortedByNearest.slice(0, Math.max(0, DEFAULTS.maxAduComparisons - seed.length))) {
            seed.push(fp._id);
        }

        return seed.slice(0, DEFAULTS.maxAduComparisons);
    });

    const selectedAdus = useMemo(() => {
        const map = new Map(allFloorplans.map((f) => [f._id, f]));
        return aduCompareIds.map((id) => map.get(id)).filter(Boolean) as Floorplan[];
    }, [aduCompareIds, allFloorplans]);

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
            }),
        [defaults, housePrice, houseRentEstimate, rentals, selectedAdus, subjectSqft]
    );

    const columns = useMemo(
        () => scenarios.map((s) => ({ key: s.key, title: s.title, sqft: s.sqft })),
        [scenarios]
    );

    const rows = useMemo<RowSpec[]>(() => buildRows(defaults), [defaults]);

    function toggleAdu(id: string) {
        setAduCompareIds((prev) => {
            const exists = prev.includes(id);
            if (exists) return prev.filter((x) => x !== id);
            if (prev.length >= defaults.maxAduComparisons) return prev;
            return [...prev, id];
        });
    }

    function updateDefault<K extends keyof Defaults>(key: K, next: Defaults[K]) {
        setDefaults((d) => ({ ...d, [key]: next }));
    }

    // Convenience getters for other components
    const houseScenario = useMemo(() => scenarios.find((s) => s.key === "house") ?? null, [scenarios]);
    const aduScenarios = useMemo(() => scenarios.filter((s) => s.kind === "adu"), [scenarios]);

    return {
        // core model state
        owedNum,
        subjectSqft,
        housePrice,
        rentalMedian,
        houseRentEstimate,

        defaults,
        setDefaults,
        updateDefault,

        aduCompareIds,
        setAduCompareIds,
        selectedAdus,
        toggleAdu,

        scenarios,
        columns,
        rows,

        showDebug,
        setShowDebug,

        // handy selectors
        houseScenario,
        aduScenarios,
    };
}
