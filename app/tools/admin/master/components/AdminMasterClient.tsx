// app/admin/AdminMasterClient.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import styles from "./AdminMasterClient.module.css";
import { AddressAutocomplete } from "./address/AddressAutocomplete";

import { AdminHeader } from "../components/AdminHeader/AdminHeader";
import { DealForm } from "../components/DealForm/DealForm";
import { StepSidebar } from "../components/StepSidebar/StepSidebar";

import { Step1_WhoAndWhere } from "../components/steps/Step1_WhoAndWhere";
import { Step2_ChooseUnits } from "../components/steps/Step2_ChooseUnits";
import { Step3_EstimateJob } from "../components/steps/Step3_EstimateJob";
import { Step4_Discounts } from "../components/steps/Step4_Discounts";
import { Step5_RentalMarket } from "../components/steps/Step5_RentalMarket";
import { Step6_ReviewAndGenerate } from "../components/steps/Step6_ReviewAndGenerate";

import { InvestmentControls } from "../components/Investment/InvestmentControls";
import { InvestmentCompareSummary } from "../components/Investment/InvestmentCompareSummary";
import { ModelTable } from "../components/Investment/ModelTable";
import { SiteWorkPanel } from "../components/SiteWorkEstimator/SiteWorkPanel";
import { DiscountsPanel } from "../components/DiscountsPanel/DiscountsPanel";
import { RentalsPanel } from "../components/RentalsPanel/RentalsPanel";
import { FinancingTable } from "../components/Financing/FinancingTable";

import sectionStyles from "../components/Investment/InvestmentSection.module.css";
import tableStyles from "../components/investmentModel/InvestmentModelTable.module.css";

import type { Floorplan } from "@/lib/rentcast/types";
import { useRentcastData } from "@/hooks/rentcast/useRentcastData";
import { useAduModel } from "@/hooks/investment/useAduModel";
import { money } from "@/lib/investment/format";
import { usePresentationWire, openPresenterWindow } from "@/hooks/presentation/usePresentationWire";


export default function AdminMasterClient({ initialFloorplans }: { initialFloorplans: Floorplan[] }) {
    const [address, setAddress] = useState("");
    const [owed, setOwed] = useState("");
    const [customerName, setCustomerName] = useState("");
    const [propertyPhotoUrl, setPropertyPhotoUrl] = useState<string | null>(null);
    const [customerMotivation, setCustomerMotivation] = useState<import("@/lib/store/presentationStore").CustomerMotivation>(null);
    const [aduType, setAduType] = useState<"detached" | "attached" | "garage" | "">("detached");

    const [floorplans, setFloorplans] = useState<Floorplan[]>(initialFloorplans);
    const [floorplanId, setFloorplanId] = useState<string>(initialFloorplans?.[0]?._id ?? "");

    const [currentFirstPmtMonthly, setCurrentFirstPmtMonthly] = useState("");
    const [siteWorkConfirmed, setSiteWorkConfirmed] = useState(false);
    const [activeStep, setActiveStep] = useState<1 | 2 | 3 | 4 | 5 | 6>(1);

    useEffect(() => {
        setFloorplans(initialFloorplans);
        setFloorplanId((prev) => prev || initialFloorplans?.[0]?._id || "");
    }, [initialFloorplans]);

    // Scroll to the top of the active step's section whenever it changes.
    // Skip the first mount so the page doesn't jump on initial load.
    const isFirstStepMount = React.useRef(true);
    useEffect(() => {
        if (isFirstStepMount.current) {
            isFirstStepMount.current = false;
            return;
        }
        const id = `step-${activeStep}`;
        // requestAnimationFrame lets React commit the new expanded body first
        // so scrollIntoView measures the post-expansion layout correctly.
        requestAnimationFrame(() => {
            const el = document.getElementById(id);
            el?.scrollIntoView({ behavior: "smooth", block: "start" });
        });
    }, [activeStep]);

    const selectedFloorplan = useMemo(
        () => floorplans.find((fp) => fp._id === floorplanId) ?? null,
        [floorplans, floorplanId]
    );

    const { loading, error, property, avm, rentals, market, getApiData } = useRentcastData();

    function pickCompareIdsWindow(input: {
        allFloorplans: Floorplan[];
        selected: Floorplan | null;
        max: number;
    }) {
        const { allFloorplans, selected, max } = input;
        if (!selected) return [];
        const k = Math.max(1, Math.min(max, allFloorplans.length));

        const sorted = [...allFloorplans].sort((a, b) => {
            const da = (a.sqft ?? 0) - (b.sqft ?? 0);
            if (da !== 0) return da;
            return (a.name ?? "").localeCompare(b.name ?? "");
        });

        const idx = sorted.findIndex((fp) => fp._id === selected._id);
        if (idx === -1) return sorted.slice(0, k).map((x) => x._id);

        let start = idx - Math.floor(k / 2);
        start = Math.max(0, Math.min(start, sorted.length - k));
        return sorted.slice(start, start + k).map((x) => x._id);
    }

    const maxAduComparisons = 3;

    const [aduCompareIds, setAduCompareIds] = useState<string[]>(() => {
        const seed: string[] = [];
        if (selectedFloorplan?._id) seed.push(selectedFloorplan._id);

        const sortedByNearest =
            selectedFloorplan
                ? [...floorplans]
                    .filter((fp) => fp._id !== selectedFloorplan._id)
                    .sort(
                        (a, b) =>
                            Math.abs((a.sqft ?? 0) - (selectedFloorplan.sqft ?? 0)) -
                            Math.abs((b.sqft ?? 0) - (selectedFloorplan.sqft ?? 0))
                    )
                : [];

        for (const fp of sortedByNearest.slice(0, Math.max(0, maxAduComparisons - seed.length))) {
            seed.push(fp._id);
        }
        return seed.slice(0, maxAduComparisons);
    });

    const lastSelectedIdRef = React.useRef<string | null>(null);

    useEffect(() => {
        const selectedId = selectedFloorplan?._id ?? null;
        if (lastSelectedIdRef.current === selectedId) return;
        lastSelectedIdRef.current = selectedId;

        const nextIds = pickCompareIdsWindow({
            allFloorplans: floorplans,
            selected: selectedFloorplan,
            max: maxAduComparisons,
        });

        setAduCompareIds(nextIds);
    }, [selectedFloorplan?._id, floorplans, maxAduComparisons]);

    // ── ADU model state + computation ─────────────────────────────────────────
    const adu = useAduModel({
        allFloorplans: floorplans,
        aduCompareIds,
        setAduCompareIds,
        maxAduComparisons,
        property,
        avm,
        rentals,
        market,
        selectedFloorplan,
        owed,
    });

    // ── Custom floorplan handlers ─────────────────────────────────────────────
    function addCustomFloorplan(sqft: number, price: number, extraBath: boolean) {
        const id = `custom_${crypto.randomUUID()}`;
        const fp: Floorplan = {
            _id: id,
            name: `Custom ${sqft} SF${extraBath ? " +Bath" : ""}`,
            sqft,
            price,
            beds: 0,
            baths: extraBath ? 2 : 1,
            bedrooms: undefined,
            bathrooms: extraBath ? 2 : 1,
            key: id,
        };
        setFloorplans((prev) => [...prev, fp]);
        setAduCompareIds((prev) =>
            prev.length < maxAduComparisons ? [...prev, id] : prev
        );
    }

    function removeCustomFloorplan(id: string) {
        setFloorplans((prev) => prev.filter((fp) => fp._id !== id));
        setAduCompareIds((prev) => prev.filter((x) => x !== id));
    }

    // ── Step state model ──────────────────────────────────────────────────────
    // Two separate concepts:
    //  • hasData[n]   — required form data is present for step n
    //  • doneSteps[n] — user explicitly clicked Done on step n
    // "Complete" = both true (so editing the data invalidates a prior Done).
    const [doneSteps, setDoneSteps] = useState<Set<number>>(new Set());

    function markDone(n: 1 | 2 | 3 | 4 | 5 | 6) {
        setDoneSteps((prev) => {
            const next = new Set(prev);
            next.add(n);
            return next;
        });
        if (n < 6) setActiveStep(((n + 1) as 1 | 2 | 3 | 4 | 5 | 6));
    }

    // Per-step required-data validation
    const step1HasData = address.length > 5;
    const step2HasData = aduCompareIds.length > 0;
    const step3HasData = adu.selectedAdus.length > 0;
    const step4HasData = true; // discounts are optional
    const step5HasData = true; // review-only
    const step6HasData = true; // review-only
    const hasData = [step1HasData, step2HasData, step3HasData, step4HasData, step5HasData, step6HasData];

    const completions = [1, 2, 3, 4, 5, 6].map((n) => doneSteps.has(n) && hasData[n - 1]);

    const completedSteps = completions
        .map((done, i) => (done ? i + 1 : null))
        .filter((n): n is number => n !== null);

    const needsInputSteps = [1, 2, 3, 4, 5, 6].filter((n) => !hasData[n - 1]);

    function stepState(n: 1 | 2 | 3 | 4 | 5 | 6) {
        const isComplete = completions[n - 1];
        return {
            isActive: activeStep === n,
            isPending: !isComplete && activeStep !== n,
            isComplete,
            onEdit: () => setActiveStep(n),
        };
    }

    // ── Presentation sync ─────────────────────────────────────────────────────
    usePresentationWire({
        customerName,
        propertyAddress: address,
        aduType,
        propertyPhotoUrl,
        customerMotivation,
        comparedUnitIds: aduCompareIds,
        scenarios: adu.scenarios,
        rentalComps: rentals,
        rentByUnitId: adu.rentByAduId,
        activeSnapshotByAduId: adu.activeSnapshotByAduId,
        discountLinesByAduId: adu.discountLinesByAduId,
    });

    return (
        <div className={styles.appShell}>
            <AdminHeader onOpenPresenter={openPresenterWindow} />

            <div className={styles.appBody}>
                <StepSidebar
                    activeStep={activeStep}
                    completedSteps={completedSteps}
                    needsInputSteps={needsInputSteps}
                    onStepClick={(n) => setActiveStep(n as 1 | 2 | 3 | 4 | 5 | 6)}
                />

                <main className={styles.main}>

                    {/* ── Step 1 · Who & Where ─────────────────────────────── */}
                    <Step1_WhoAndWhere
                        {...stepState(1)}
                        kind="data"
                        needsInput={!step1HasData}
                        needsInputMessage="Enter the property address to continue"
                        onDone={() => markDone(1)}
                        completeSummary={address || "No address yet"}
                    >
                        <DealForm
                            styles={styles}
                            AddressAutocomplete={AddressAutocomplete}
                            customerName={customerName}
                            setCustomerName={setCustomerName}
                            address={address}
                            setAddress={setAddress}
                            owed={owed}
                            setOwed={setOwed}
                            propertyPhotoUrl={propertyPhotoUrl}
                            setPropertyPhotoUrl={setPropertyPhotoUrl}
                            customerMotivation={customerMotivation}
                            setCustomerMotivation={setCustomerMotivation}
                            floorplans={floorplans}
                            floorplanId={floorplanId}
                            setFloorplanId={setFloorplanId}
                            selectedFloorplan={selectedFloorplan}
                            loading={loading}
                            error={error}
                            onSubmit={() => {
                                getApiData({ address, selectedFloorplan });
                                if (address.length > 5) setActiveStep(2);
                            }}
                            currentFirstPmtMonthly={currentFirstPmtMonthly}
                            setCurrentFirstPmtMonthly={setCurrentFirstPmtMonthly}
                            aduType={aduType}
                            setAduType={setAduType}
                        />
                    </Step1_WhoAndWhere>

                    {/* ── Step 2 · Choose Units ─────────────────────────────── */}
                    <Step2_ChooseUnits
                        {...stepState(2)}
                        kind="data"
                        needsInput={!step2HasData}
                        needsInputMessage="Select at least one floor plan to continue"
                        onDone={() => markDone(2)}
                        completeSummary={
                            aduCompareIds.length > 0
                                ? `${aduCompareIds.length} unit${aduCompareIds.length > 1 ? "s" : ""} selected`
                                : "No units selected"
                        }
                    >
                        <InvestmentControls
                            defaults={adu.defaults}
                            defaultsProp={undefined}
                            setDefaults={adu.setDefaults}
                            updateDefault={adu.updateDefault}
                            allFloorplans={floorplans}
                            aduCompareIds={aduCompareIds}
                            toggleAdu={adu.toggleAdu}
                            view="picker"
                            onAddCustomFloorplan={addCustomFloorplan}
                            onRemoveFloorplan={removeCustomFloorplan}
                        />
                    </Step2_ChooseUnits>

                    {/* ── Step 3 · Estimate the Job ─────────────────────────── */}
                    <Step3_EstimateJob
                        {...stepState(3)}
                        kind="data"
                        needsInput={!step3HasData}
                        needsInputMessage="Select units in Step 2 before estimating site work"
                        onDone={() => { setSiteWorkConfirmed(true); markDone(3); }}
                        completeSummary="Site work confirmed"
                    >
                        {adu.selectedAdus.length === 0 ? (
                            <div className={sectionStyles.emptyState}>
                                Select one or more ADUs in Step 2 to enter site-specific work.
                            </div>
                        ) : (
                            <SiteWorkPanel
                                selectedAdus={adu.selectedAdus}
                                estimatorByAduId={adu.estimatorByAduId}
                                setEstimatorByAduId={adu.setEstimatorByAduId}
                            />
                        )}
                    </Step3_EstimateJob>

                    {/* ── Step 4 · Discounts ────────────────────────────────── */}
                    <Step4_Discounts
                        {...stepState(4)}
                        kind="data"
                        onDone={() => markDone(4)}
                        completeSummary="Discounts applied"
                    >
                        <DiscountsPanel
                            selectedAdus={adu.selectedAdus}
                            setDiscountAmountByAduId={adu.setDiscountAmountByAduId}
                            setDiscountLinesByAduId={adu.setDiscountLinesByAduId}
                        />
                    </Step4_Discounts>

                    {/* ── Step 5 · Rental Market ────────────────────────────── */}
                    <Step5_RentalMarket
                        {...stepState(5)}
                        kind="review"
                        onDone={() => markDone(5)}
                        completeSummary="Rental market reviewed"
                    >
                        {adu.selectedAdus.length > 0 && (
                            <div className={sectionStyles.rentRow}>
                                {adu.selectedAdus.map((fp) => (
                                    <div key={fp._id} className={sectionStyles.rentBadge}>
                                        <span className={sectionStyles.rentBadgeLabel}>{fp.name}</span>
                                        <input
                                            type="number"
                                            min={0}
                                            step={50}
                                            placeholder="Rent / mo"
                                            className={sectionStyles.rentBadgeInput}
                                            value={adu.rentByAduId[fp._id] ?? ""}
                                            onChange={(e) =>
                                                adu.setRentByAduId((prev) => ({ ...prev, [fp._id]: e.target.value }))
                                            }
                                        />
                                    </div>
                                ))}
                            </div>
                        )}
                        <RentalsPanel
                            styles={styles}
                            rentals={rentals}
                            targetSqft={selectedFloorplan?.sqft}
                            onRentPick={
                                adu.selectedAdus.length === 1
                                    ? (rent) =>
                                        adu.setRentByAduId((prev) => ({
                                            ...prev,
                                            [adu.selectedAdus[0]._id]: String(rent),
                                        }))
                                    : undefined
                            }
                        />
                    </Step5_RentalMarket>

                    {/* ── Step 6 · Review & Generate ────────────────────────── */}
                    <Step6_ReviewAndGenerate
                        {...stepState(6)}
                        kind="review"
                        completeSummary="Ready to present"
                    >
                        <InvestmentCompareSummary
                            styles={styles}
                            adus={adu.aduScenarios}
                            baseCostByAduId={adu.baseCostByAduId}
                            setBaseCostByAduId={adu.setBaseCostByAduId}
                            sqftByAduId={adu.sqftByAduId}
                            setSqftByAduId={adu.setSqftByAduId}
                            rentByAduId={adu.rentByAduId}
                            setRentByAduId={adu.setRentByAduId}
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
                            comparedFloorplans={adu.selectedAdus}
                            selectedFloorplanId={selectedFloorplan?._id ?? null}
                            termYears={30}
                            currentFirstPmtMonthly={Number(currentFirstPmtMonthly) || 0}
                        />

                        <details className={tableStyles.assumptionsDetails}>
                            <summary className={tableStyles.assumptionsSummary}>Full Model (Internal)</summary>

                            <details className={tableStyles.assumptionsDetails}>
                                <summary className={tableStyles.assumptionsSummary}>Assumptions</summary>
                                <InvestmentControls
                                    defaults={adu.defaults}
                                    defaultsProp={undefined}
                                    setDefaults={adu.setDefaults}
                                    updateDefault={adu.updateDefault}
                                    allFloorplans={floorplans}
                                    aduCompareIds={aduCompareIds}
                                    toggleAdu={adu.toggleAdu}
                                    view="assumptions"
                                />
                            </details>

                            <div className={tableStyles.topActions}>
                                <label className={tableStyles.toggle}>
                                    <input
                                        type="checkbox"
                                        checked={adu.showDebug}
                                        onChange={(e) => adu.setShowDebug(e.target.checked)}
                                    />
                                    <span>Show Calculations</span>
                                </label>
                            </div>

                            <ModelTable
                                rows={adu.rows}
                                columns={adu.columns}
                                scenarios={adu.scenarios}
                                showDebug={adu.showDebug}
                            />

                            <div className={tableStyles.footerNote}>
                                <span className={tableStyles.footerLabel}>Debug tip:</span> If a value looks off, check the formula + inputs under that cell.
                            </div>
                        </details>
                    </Step6_ReviewAndGenerate>

                </main>
            </div>
        </div>
    );
}
