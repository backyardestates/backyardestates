// app/admin/components/Investment/InvestmentSection.tsx
"use client";

import React, { useMemo, useState } from "react";
import type { Floorplan, PropertyRecord, AvmValue, RentalListing } from "@/lib/rentcast/types";
import type { Defaults, Scenario, RowSpec } from "@/lib/investment/types";
import { DEFAULTS } from "@/lib/investment/types";
import { asNumber, clamp, median, money } from "@/lib/investment/format";
import { buildRows } from "@/lib/investment/rows";
import { buildScenarios } from "@/lib/investment/scenario";

import tableStyles from "../investmentModel/InvestmentModelTable.module.css";
import adminStyles from "../AdminMasterClient.module.css";
import sectionStyles from "./InvestmentSection.module.css";

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
    const [baseCostByAduId, setBaseCostByAduId] = useState<Record<string, string>>({});
    const [sqftByAduId, setSqftByAduId] = useState<Record<string, string>>({});
    const [rentByAduId, setRentByAduId] = useState<Record<string, string>>({});
    const [discountsByAduId, setDiscountsByAduId] = useState<Record<string, DiscountKey[]>>({});

    type DiscountKey = "solarPanels" | "educators" | "firstResponders" | "openHouse" | "special";

    const DISCOUNT_OPTIONS: Record<DiscountKey, { label: string; amount: number }> = {
        solarPanels: {
            label: "Solar Panels",
            amount: 7500,
        },
        educators: {
            label: "Educators",
            amount: 1500,
        },
        firstResponders: {
            label: "First Responders",
            amount: 1500,
        },
        openHouse: {
            label: "Open House",
            amount: 1500,
        },
        special: {
            label: "Special",
            amount: 0,
        },
    };

    function toggleDiscountForAdu(aduId: string, discountKey: DiscountKey) {
        setDiscountsByAduId((prev) => {
            const current = prev[aduId] ?? [];
            const exists = current.includes(discountKey);

            return {
                ...prev,
                [aduId]: exists
                    ? current.filter((k) => k !== discountKey)
                    : [...current, discountKey],
            };
        });
    }

    function applyDiscountToAll(discountKey: DiscountKey) {
        setDiscountsByAduId((prev) => {
            const next = { ...prev };

            for (const fp of selectedAdus) {
                const current = next[fp._id] ?? [];
                if (!current.includes(discountKey)) {
                    next[fp._id] = [...current, discountKey];
                }
            }

            return next;
        });
    }

    function removeDiscountFromAll(discountKey: DiscountKey) {
        setDiscountsByAduId((prev) => {
            const next = { ...prev };

            for (const fp of selectedAdus) {
                next[fp._id] = (next[fp._id] ?? []).filter((k) => k !== discountKey);
            }

            return next;
        });
    }

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

    const discountAmountByAduId = useMemo<Record<string, number>>(() => {
        const out: Record<string, number> = {};

        for (const fp of selectedAdus) {
            const selectedDiscounts = discountsByAduId[fp._id] ?? [];
            out[fp._id] = selectedDiscounts.reduce((sum, key) => {
                return sum + (DISCOUNT_OPTIONS[key]?.amount ?? 0);
            }, 0);
        }

        return out;
    }, [selectedAdus, discountsByAduId]);

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
            baseCostByAduId,
            sqftByAduId,
            discountAmountByAduId,
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
            <div className={sectionStyles.sectionStack}>
                <section className={sectionStyles.panel}>
                    <div className={sectionStyles.panelHeader}>
                        <div className={sectionStyles.panelTitleWrap}>
                            <div className={sectionStyles.panelTitle}>Site-specific work</div>
                            <div className={sectionStyles.panelSubtitle}>
                                Set a default site work amount, then fine-tune each compared ADU individually.
                            </div>
                        </div>
                    </div>

                    <div className={sectionStyles.grid}>
                        <div className={`${sectionStyles.field} ${sectionStyles.full}`}>
                            <label className={sectionStyles.label}>Default site work for compared ADUs</label>
                            <div className={sectionStyles.inlineActions}>
                                <div className={sectionStyles.inputWrap} style={{ minWidth: 220, flex: "0 1 260px" }}>
                                    <span className={sectionStyles.prefix}>$</span>
                                    <input
                                        type="number"
                                        inputMode="decimal"
                                        min="0"
                                        step="100"
                                        className={sectionStyles.moneyInput}
                                        value={defaultSiteWork}
                                        onChange={(e) => setDefaultSiteWork(e.target.value)}
                                        placeholder="0"
                                    />
                                </div>

                                <button
                                    className={adminStyles.button}
                                    type="button"
                                    onClick={() => {
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
                            <div className={sectionStyles.helpText}>
                                Use this when most compared options share similar site conditions.
                            </div>
                        </div>

                        {selectedAdus.length === 0 ? (
                            <div className={sectionStyles.full}>
                                <div className={sectionStyles.emptyState}>
                                    Select one or more ADUs in the compare controls to enter site-specific work.
                                </div>
                            </div>
                        ) : (
                            selectedAdus.map((fp) => (
                                <div key={fp._id} className={sectionStyles.card}>
                                    <div className={sectionStyles.cardHeader}>
                                        <div className={sectionStyles.cardTitle}>{fp.name}</div>
                                        <div className={sectionStyles.cardMeta}>
                                            {fp.sqft ? `${fp.sqft} sq ft` : "Compared ADU"}
                                        </div>
                                    </div>

                                    <div className={sectionStyles.field}>
                                        <label className={sectionStyles.label}>Site work amount</label>
                                        <div className={sectionStyles.inputWrap}>
                                            <span className={sectionStyles.prefix}>$</span>
                                            <input
                                                type="number"
                                                inputMode="decimal"
                                                min="0"
                                                step="100"
                                                className={sectionStyles.moneyInput}
                                                value={siteWorkByAduId[fp._id] ?? ""}
                                                onChange={(e) =>
                                                    setSiteWorkByAduId((prev) => ({
                                                        ...prev,
                                                        [fp._id]: e.target.value,
                                                    }))
                                                }
                                                placeholder="0"
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </section>

                <section className={sectionStyles.panel}>
                    <div className={sectionStyles.panelHeader}>
                        <div className={sectionStyles.panelTitleWrap}>
                            <div className={sectionStyles.panelTitle}>Discounts</div>
                            <div className={sectionStyles.panelSubtitle}>
                                Apply discounts globally or customize them for each compared ADU.
                            </div>
                        </div>
                    </div>

                    <div className={sectionStyles.field}>
                        <label className={sectionStyles.label}>Apply to all compared ADUs</label>
                        <div className={sectionStyles.optionRow}>
                            {Object.entries(DISCOUNT_OPTIONS).map(([key, opt]) => {
                                const discountKey = key as DiscountKey;

                                const allSelected =
                                    selectedAdus.length > 0 &&
                                    selectedAdus.every((fp) => (discountsByAduId[fp._id] ?? []).includes(discountKey));

                                return (
                                    <label key={discountKey} className={sectionStyles.checkPill}>
                                        <input
                                            type="checkbox"
                                            checked={allSelected}
                                            onChange={(e) => {
                                                if (e.target.checked) applyDiscountToAll(discountKey);
                                                else removeDiscountFromAll(discountKey);
                                            }}
                                        />
                                        <span className={sectionStyles.checkPillText}>
                                            {opt.label}
                                            <span className={sectionStyles.checkPillMeta}>({money(opt.amount)} off)</span>
                                        </span>
                                    </label>
                                );
                            })}
                        </div>
                    </div>

                    <div className={sectionStyles.grid}>
                        {selectedAdus.length === 0 ? (
                            <div className={sectionStyles.full}>
                                <div className={sectionStyles.emptyState}>
                                    Select one or more ADUs in the compare controls to manage discounts.
                                </div>
                            </div>
                        ) : (
                            selectedAdus.map((fp) => {
                                const selectedDiscounts = discountsByAduId[fp._id] ?? [];
                                const totalDiscount = selectedDiscounts.reduce(
                                    (sum, key) => sum + (DISCOUNT_OPTIONS[key]?.amount ?? 0),
                                    0
                                );

                                return (
                                    <div key={fp._id} className={sectionStyles.card}>
                                        <div className={sectionStyles.cardHeader}>
                                            <div className={sectionStyles.cardTitle}>{fp.name}</div>
                                        </div>

                                        <div className={sectionStyles.optionRow}>
                                            {Object.entries(DISCOUNT_OPTIONS).map(([key, opt]) => {
                                                const discountKey = key as DiscountKey;
                                                const checked = selectedDiscounts.includes(discountKey);

                                                return (
                                                    <label key={discountKey} className={sectionStyles.checkPill}>
                                                        <input
                                                            type="checkbox"
                                                            checked={checked}
                                                            onChange={() => toggleDiscountForAdu(fp._id, discountKey)}
                                                        />
                                                        <span className={sectionStyles.checkPillText}>
                                                            {opt.label}
                                                            <span className={sectionStyles.checkPillMeta}>
                                                                ({money(opt.amount)} off)
                                                            </span>
                                                        </span>
                                                    </label>
                                                );
                                            })}
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </section>
            </div>
            <InvestmentCompareSummary
                styles={adminStyles}
                adus={aduScenarios}
                baseCostByAduId={baseCostByAduId}
                setBaseCostByAduId={setBaseCostByAduId}
                sqftByAduId={sqftByAduId}
                setSqftByAduId={setSqftByAduId}
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
