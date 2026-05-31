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
import { SiteWorkEstimator } from "../SiteWorkEstimator/SiteWorkEstimator";
import { RentalsPanel } from "../RentalsPanel/RentalsPanel";
import { StepSection } from "../StepSection/StepSection";
import {
    type EstimatorState,
    computeTotal,
    createEmptyState,
    mergeEstimatorStates,
} from "@/lib/investment/siteWorkItems";
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
    siteWorkConfirmed: boolean;
    setSiteWorkConfirmed: React.Dispatch<React.SetStateAction<boolean>>;
}) {
    const { market } = useRentcastData();
    const [estimatorByAduId, setEstimatorByAduId] = useState<Record<string, EstimatorState>>({});
    const [baseCostByAduId, setBaseCostByAduId] = useState<Record<string, string>>({});
    const [sqftByAduId, setSqftByAduId] = useState<Record<string, string>>({});
    const [rentByAduId, setRentByAduId] = useState<Record<string, string>>({});
    const [discountsByAduId, setDiscountsByAduId] = useState<Record<string, DiscountKey[]>>({});
    const [specialAmountByAduId, setSpecialAmountByAduId] = useState<Record<string, string>>({});

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
                if (key === "special") {
                    return sum + Math.max(0, Number(specialAmountByAduId[fp._id] || "0"));
                }
                return sum + (DISCOUNT_OPTIONS[key]?.amount ?? 0);
            }, 0);
        }

        return out;
    }, [selectedAdus, discountsByAduId, specialAmountByAduId]);

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
            }),
        [
            defaults,
            housePrice,
            houseRentEstimate,
            rentals,
            selectedAdus,
            subjectSqft,
            market,
            estimatorByAduId,
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

            {/* ── Step 2 — Unit Selection ──────────────────────────────────────── */}
            <StepSection step={2} title="Unit Selection">
                <InvestmentControls
                    defaults={defaults}
                    defaultsProp={defaultsProp}
                    setDefaults={setDefaults}
                    updateDefault={updateDefault}
                    allFloorplans={allFloorplans}
                    aduCompareIds={aduCompareIds}
                    toggleAdu={toggleAdu}
                    view="picker"
                />
            </StepSection>

            {/* ── Step 3 — Site Work Estimator ─────────────────────────────────── */}
            <StepSection step={3} title="Site Work Estimator">
                <p className={sectionStyles.panelSubtitle}>
                    Add line items per ADU. Use presets or custom entries. &ldquo;Copy &amp; merge to all&rdquo; copies this ADU&apos;s items to others, skipping labels that already exist.
                </p>
                {selectedAdus.length === 0 ? (
                    <div className={sectionStyles.emptyState}>
                        Select one or more ADUs in Unit Selection to enter site-specific work.
                    </div>
                ) : (
                    selectedAdus.map((fp) => (
                        <SiteWorkEstimator
                            key={fp._id}
                            aduName={fp.name}
                            value={estimatorByAduId[fp._id] ?? createEmptyState()}
                            onChange={(next) =>
                                setEstimatorByAduId((prev) => ({ ...prev, [fp._id]: next }))
                            }
                        />
                    ))
                )}
            </StepSection>

            {/* ── Step 4 — Discounts ───────────────────────────────────────────── */}
            <StepSection step={4} title="Discounts">
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

                {selectedAdus.length === 0 ? (
                    <div className={sectionStyles.emptyState}>
                        Select one or more ADUs in Unit Selection to manage discounts.
                    </div>
                ) : (
                    <div className={sectionStyles.grid}>
                        {selectedAdus.map((fp) => {
                            const selectedDiscounts = discountsByAduId[fp._id] ?? [];
                            const totalDiscount = selectedDiscounts.reduce(
                                (sum, key) => sum + (DISCOUNT_OPTIONS[key]?.amount ?? 0),
                                0
                            );

                            return (
                                <div key={fp._id} className={sectionStyles.card}>
                                    <div className={sectionStyles.cardHeader}>
                                        <div className={sectionStyles.cardTitle}>{fp.name}</div>
                                        {totalDiscount > 0 && (
                                            <div className={sectionStyles.cardMeta}>
                                                {money(totalDiscount)} total discount
                                            </div>
                                        )}
                                    </div>

                                    <div className={sectionStyles.optionRow}>
                                        {Object.entries(DISCOUNT_OPTIONS).map(([key, opt]) => {
                                            const discountKey = key as DiscountKey;
                                            const checked = selectedDiscounts.includes(discountKey);
                                            const isSpecial = discountKey === "special";

                                            return (
                                                <React.Fragment key={discountKey}>
                                                    <label className={sectionStyles.checkPill}>
                                                        <input
                                                            type="checkbox"
                                                            checked={checked}
                                                            onChange={() => toggleDiscountForAdu(fp._id, discountKey)}
                                                        />
                                                        <span className={sectionStyles.checkPillText}>
                                                            {opt.label}
                                                            {!isSpecial && (
                                                                <span className={sectionStyles.checkPillMeta}>
                                                                    ({money(opt.amount)} off)
                                                                </span>
                                                            )}
                                                        </span>
                                                    </label>
                                                    {isSpecial && checked && (
                                                        <input
                                                            type="number"
                                                            min={0}
                                                            step={100}
                                                            placeholder="Custom amount ($)"
                                                            className={sectionStyles.specialInput}
                                                            value={specialAmountByAduId[fp._id] ?? ""}
                                                            onChange={(e) =>
                                                                setSpecialAmountByAduId((prev) => ({
                                                                    ...prev,
                                                                    [fp._id]: e.target.value,
                                                                }))
                                                            }
                                                        />
                                                    )}
                                                </React.Fragment>
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </StepSection>

            {/* ── Step 5 — Rental Analysis ─────────────────────────────────────── */}
            <StepSection step={5} title="Rental Analysis">
                {selectedAdus.length > 0 && (
                    <div className={sectionStyles.rentRow}>
                        {selectedAdus.map((fp) => (
                            <div key={fp._id} className={sectionStyles.rentBadge}>
                                <span className={sectionStyles.rentBadgeLabel}>{fp.name}</span>
                                <input
                                    type="number"
                                    min={0}
                                    step={50}
                                    placeholder="Rent / mo"
                                    className={sectionStyles.rentBadgeInput}
                                    value={rentByAduId[fp._id] ?? ""}
                                    onChange={(e) =>
                                        setRentByAduId((prev) => ({ ...prev, [fp._id]: e.target.value }))
                                    }
                                />
                            </div>
                        ))}
                    </div>
                )}
                <RentalsPanel
                    rentals={rentals}
                    targetSqft={selectedFloorplan?.sqft}
                    onRentPick={
                        selectedAdus.length === 1
                            ? (rent) => setRentByAduId((prev) => ({ ...prev, [selectedAdus[0]._id]: String(rent) }))
                            : undefined
                    }
                />
            </StepSection>

            {/* ── Step 6 — Financial Summary ───────────────────────────────────── */}
            <StepSection step={6} title="Financial Summary">
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
            </StepSection>

            {/* ── Step 7 — Financing Options ───────────────────────────────────── */}
            <StepSection step={7} title="Financing Options">
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
            </StepSection>

            {/* ── Step 8 — Full Model (internal) ───────────────────────────────── */}
            <StepSection step={8} title="Full Model" badge="INTERNAL">
                <details className={tableStyles.assumptionsDetails}>
                    <summary className={tableStyles.assumptionsSummary}>Assumptions</summary>
                    <InvestmentControls
                        defaults={defaults}
                        defaultsProp={defaultsProp}
                        setDefaults={setDefaults}
                        updateDefault={updateDefault}
                        allFloorplans={allFloorplans}
                        aduCompareIds={aduCompareIds}
                        toggleAdu={toggleAdu}
                        view="assumptions"
                    />
                </details>

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
            </StepSection>

        </div>
    );
}
