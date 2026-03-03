// app/admin/components/Investment/InvestmentSection.tsx
"use client";

import React, { useMemo, useState } from "react";
import type { Floorplan, PropertyRecord, AvmValue, RentalListing } from "@/lib/rentcast/types";
import type { Defaults, Scenario, RowSpec } from "@/lib/investment/types";
import { DEFAULTS } from "@/lib/investment/types";
import { asNumber, clamp, median } from "@/lib/investment/format";
import { buildRows } from "@/lib/investment/rows";
import { buildScenarios } from "@/lib/investment/scenario";

import tableStyles from "../investmentModel/InvestmentModelTable.module.css";
import adminStyles from "../AdminMasterClient.module.css";

import { InvestmentControls } from "./InvestmentControls";
import { ModelTable } from "./ModelTable";
import { InvestmentCompareSummary } from "../Investment/InvestmentCompareSummary";
import { useInvestmentModel } from "@/hooks/investment/useInvestmentModel";
import { useRentcastData } from "@/hooks/rentcast/useRentcastData";
import { FinancingTable } from "../Financing/FinancingTable";

export function InvestmentSection({
    property,
    avm,
    rentals,
    owed,
    selectedFloorplan,
    allFloorplans,
    defaults: defaultsProp,

    // ✅ controlled compare selection from parent
    aduCompareIds,
    setAduCompareIds,
    maxAduComparisons,
    currentFirstPmtMonthly,
    setCurrentFirstPmtMonthly
}: {
    property: PropertyRecord | null;
    avm: AvmValue | null;
    rentals: RentalListing[];
    owed: string;
    selectedFloorplan: Floorplan | null;
    allFloorplans: Floorplan[];
    defaults?: Partial<Defaults>;

    aduCompareIds: string[];
    setAduCompareIds: React.Dispatch<React.SetStateAction<string[]>>;
    maxAduComparisons: number;
    currentFirstPmtMonthly: string;
    setCurrentFirstPmtMonthly: React.Dispatch<React.SetStateAction<string>>;
}) {
    const { market } = useRentcastData();
    const [siteWorkByAduId, setSiteWorkByAduId] = useState<Record<string, string>>({});
    const [defaultSiteWork, setDefaultSiteWork] = useState<string>(""); // optional global default
    const [rentByAduId, setRentByAduId] = useState<Record<string, string>>({});

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

    const [showDebug, setShowDebug] = useState(false);

    const [defaults, setDefaults] = useState<Defaults>({
        ...DEFAULTS,
        ...(defaultsProp ?? {}),
    });

    // ✅ derive actual selected floorplan objects from ids + allFloorplans
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

                siteWorkByAduId: Object.fromEntries(
                    selectedAdus.map((fp) => [fp._id, asNumber(siteWorkByAduId[fp._id] ?? defaultSiteWork) ?? 0])
                ),

                // ✅ NEW: rent overrides (per ADU)
                rentByAduId: Object.fromEntries(
                    selectedAdus.map((fp) => [fp._id, asNumber(rentByAduId[fp._id]) ?? undefined])
                ),
            }),
        [
            defaults,
            housePrice,
            houseRentEstimate,
            rentals,
            selectedAdus,
            subjectSqft,
            market,
            siteWorkByAduId,
            defaultSiteWork,
            rentByAduId,
        ]
    );

    const columns = useMemo(() => scenarios.map((s) => ({ key: s.key, title: s.title, sqft: s.sqft })), [scenarios]);
    const rows = useMemo<RowSpec[]>(() => buildRows(defaults), [defaults]);

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

    const aduScenarios = useMemo(() => scenarios.filter((s) => s.kind === "adu"), [scenarios]);

    // (optional) keeping your existing model hook usage
    const model = useInvestmentModel({
        property,
        avm,
        rentals,
        owed,
        selectedFloorplan,
        allFloorplans,
    });

    return (
        <div className={tableStyles.wrap}>
            <div className={tableStyles.topActions} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                    <label style={{ minWidth: 220 }}>Default site-specific work</label>
                    <input
                        className={adminStyles.input} // or tableStyles.input, whichever you use
                        value={defaultSiteWork}
                        onChange={(e) => setDefaultSiteWork(e.target.value)}
                        placeholder="$0"
                    />
                    <button
                        className={adminStyles.button}
                        type="button"
                        onClick={() => {
                            // apply default to currently selected ADUs (optional helper)
                            setSiteWorkByAduId((prev) => {
                                const next = { ...prev };
                                for (const fp of selectedAdus) next[fp._id] = defaultSiteWork;
                                return next;
                            });
                        }}
                    >
                        Apply to compared ADUs
                    </button>
                </div>

                <div style={{ display: "flex", gap: 8, justifyContent: "space-between", flexWrap: "wrap", width: "100%" }}>
                    {selectedAdus.map((fp) => (
                        <div key={fp._id} style={{ display: "flex", gap: 10, alignItems: "center" }}>
                            <label style={{ minWidth: 220 }}>{fp.name} site work</label>
                            <input
                                className={adminStyles.input}
                                value={siteWorkByAduId[fp._id] ?? ""}
                                onChange={(e) =>
                                    setSiteWorkByAduId((prev) => ({ ...prev, [fp._id]: e.target.value }))
                                }
                                placeholder="$0"
                            />
                        </div>
                    ))}
                </div>
            </div>
            <InvestmentCompareSummary
                styles={adminStyles}
                adus={aduScenarios}
                rentByAduId={rentByAduId}
                setRentByAduId={setRentByAduId}
            />

            <InvestmentControls
                defaults={defaults}
                defaultsProp={defaultsProp}
                setDefaults={setDefaults}
                updateDefault={updateDefault}
                allFloorplans={allFloorplans}
                aduCompareIds={aduCompareIds}
                toggleAdu={toggleAdu}
            />
            <FinancingTable
                owed={owed}
                propertyValue={
                    avm?.price ??
                    avm?.priceRangeHigh ??
                    avm?.priceRangeLow ??
                    property?.lastSalePrice ??
                    0
                }
                comparedFloorplans={selectedAdus}
                selectedFloorplanId={selectedFloorplan?._id ?? null}
                termYears={30}
                currentFirstPmtMonthly={Number(currentFirstPmtMonthly) || 0}
            />

            <div className={tableStyles.topActions}>
                <label className={tableStyles.toggle}>
                    <input type="checkbox" checked={showDebug} onChange={(e) => setShowDebug(e.target.checked)} />
                    <span>Show Calculations</span>
                </label>
            </div>

            <ModelTable rows={rows} columns={columns} scenarios={scenarios} showDebug={showDebug} />

            <div className={tableStyles.footerNote}>
                <span className={tableStyles.footerLabel}>Debug tip:</span> If a value looks off, check the formula + inputs under that cell.
            </div>
        </div>
    );
}
