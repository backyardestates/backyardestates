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
import { Step7_FeatureBuilds } from "../components/steps/Step7_FeatureBuilds";
import { Step8_FeatureStories } from "../components/steps/Step8_FeatureStories";
import { Step9_FeatureRentals } from "../components/steps/Step9_FeatureRentals";
import { Step10_SlideOrder } from "../components/steps/Step10_SlideOrder";
import { Step11_Timeline } from "../components/steps/Step11_Timeline";
import { Step12_PaymentSchedule } from "../components/steps/Step12_PaymentSchedule";
import { FeaturePropertiesPanel } from "../components/FeaturePropertiesPanel/FeaturePropertiesPanel";
import { FeatureStoriesPanel } from "../components/FeatureStoriesPanel/FeatureStoriesPanel";
import { FeatureRentalsPanel } from "../components/FeatureRentalsPanel/FeatureRentalsPanel";
import { SlideOrderPanel } from "../components/SlideOrderPanel/SlideOrderPanel";
import { TimelineEditorPanel } from "../components/TimelineEditorPanel/TimelineEditorPanel";
import { PaymentSchedulePanel } from "../components/PaymentSchedulePanel/PaymentSchedulePanel";

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
import type { SanityProperty, SanityStory, FeaturedRental, ProjectTimeline } from "@/lib/store/presentationStore";
import type { ProposalPaymentSchedule } from "@/lib/investment/proposalPaymentSchedule";
import {
    getProposal,
    getDraft,
    hasProposal,
    saveProposal,
    saveDraft,
    deleteDraft,
    normalizeAddress,
    captureCompanionStorage,
    restoreCompanionStorage,
    companionStorageFingerprint,
    type ProposalSnapshot,
    PROPOSAL_SCHEMA_VERSION,
} from "@/lib/proposalSnapshot";
import { SavedProposals } from "../components/SavedProposals/SavedProposals";
import { useRentcastData } from "@/hooks/rentcast/useRentcastData";
import { useAduModel } from "@/hooks/investment/useAduModel";
import { money } from "@/lib/investment/format";
import { DEFAULTS } from "@/lib/investment/types";
import { usePresentationWire, openPresenterWindow } from "@/hooks/presentation/usePresentationWire";


export default function AdminMasterClient({
    initialFloorplans,
    initialCompletedProperties,
    initialStories,
}: {
    initialFloorplans: Floorplan[];
    initialCompletedProperties: SanityProperty[];
    initialStories: SanityStory[];
}) {
    const [address, setAddress] = useState("");
    const [owed, setOwed] = useState("");
    const [customerName, setCustomerName] = useState("");
    const [propertyPhotoUrl, setPropertyPhotoUrl] = useState<string | null>(null);
    const [customerMotivation, setCustomerMotivation] = useState<import("@/lib/store/presentationStore").CustomerMotivation>(null);
    const [aduType, setAduType] = useState<"detached" | "attached" | "garage" | "">("detached");

    const [floorplans, setFloorplans] = useState<Floorplan[]>(initialFloorplans);
    const [floorplanId, setFloorplanId] = useState<string>(initialFloorplans?.[0]?._id ?? "");

    const [featuredPropertyIds, setFeaturedPropertyIds] = useState<string[]>([]);
    const [featuredStoryIds, setFeaturedStoryIds] = useState<string[]>([]);
    const [featuredRentals, setFeaturedRentals] = useState<FeaturedRental[]>([]);
    const [slideOrder, setSlideOrder] = useState<number[]>([]);
    const [projectTimeline, setProjectTimeline] = useState<ProjectTimeline | null>(null);
    const [proposalPaymentSchedule, setProposalPaymentSchedule] = useState<ProposalPaymentSchedule | null>(null);

    // ── Save / Saved Proposals ────────────────────────────────────────────────
    const [savedModalOpen, setSavedModalOpen] = useState(false);
    const [justSaved, setJustSaved] = useState(false);

    type DraftStatus =
        | { state: "idle"; message?: string }
        | { state: "pending" }
        | { state: "saved"; at: Date }
        | { state: "error"; message: string };
    const [draftStatus, setDraftStatus] = useState<DraftStatus>({
        state: "idle",
        message: "Add address to enable autosave",
    });

    const [currentFirstPmtMonthly, setCurrentFirstPmtMonthly] = useState("");
    const [siteWorkConfirmed, setSiteWorkConfirmed] = useState(false);
    const [activeStep, setActiveStep] = useState<1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12>(1);

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

    const { loading, error, property, avm, rentals, market, getApiData, hydrate: hydrateRentcast } = useRentcastData();

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

    function markDone(n: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12) {
        setDoneSteps((prev) => {
            const next = new Set(prev);
            next.add(n);
            return next;
        });
        if (n < 12) setActiveStep(((n + 1) as 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12));
    }

    // Per-step required-data validation
    const step1HasData = address.length > 5;
    const step2HasData = aduCompareIds.length > 0;
    const step3HasData = adu.selectedAdus.length > 0;
    const step4HasData = true; // discounts are optional
    const step5HasData = true; // review-only
    const step6HasData = true; // review-only
    const step7HasData = true; // selection is optional (falls back to featured)
    const step8HasData = true; // selection is optional (falls back to featured)
    const step9HasData = true; // selection is optional (falls back to first N rentals)
    const step10HasData = true; // slide order is optional (falls back to natural order)
    const step11HasData = true; // timeline is optional (falls back to CITY_TIMELINES defaults)
    const step12HasData = true; // payment schedule is optional (drives the future contract slide)
    const hasData = [step1HasData, step2HasData, step3HasData, step4HasData, step5HasData, step6HasData, step7HasData, step8HasData, step9HasData, step10HasData, step11HasData, step12HasData];

    const completions = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((n) => doneSteps.has(n) && hasData[n - 1]);

    const completedSteps = completions
        .map((done, i) => (done ? i + 1 : null))
        .filter((n): n is number => n !== null);

    const needsInputSteps = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].filter((n) => !hasData[n - 1]);

    function stepState(n: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12) {
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
        featuredPropertyIds,
        featuredStoryIds,
        featuredRentals,
        slideOrder,
        projectTimeline,
        proposalPaymentSchedule,
        scenarios: adu.scenarios,
        rentalComps: rentals,
        rentByUnitId: adu.rentByAduId,
        activeSnapshotByAduId: adu.activeSnapshotByAduId,
        discountLinesByAduId: adu.discountLinesByAduId,
    });

    // ── Snapshot build / apply ────────────────────────────────────────────────

    function buildSnapshot(): ProposalSnapshot {
        // Only persist custom (admin-added) floorplans — Sanity ones reload from
        // server on next visit and matching by _id is sufficient to restore the
        // selection.
        const customFloorplans = floorplans.filter((fp) => fp._id.startsWith("custom_"));
        return {
            schemaVersion: PROPOSAL_SCHEMA_VERSION,
            savedAt: new Date().toISOString(),
            addressKey: normalizeAddress(address),

            customerName,
            address,
            owed,
            propertyPhotoUrl,
            customerMotivation,
            aduType,
            floorplanId,
            currentFirstPmtMonthly,

            customFloorplans,
            aduCompareIds,

            defaults: adu.defaults,
            estimatorByAduId: adu.estimatorByAduId,
            rentByAduId: adu.rentByAduId,
            baseCostByAduId: adu.baseCostByAduId,
            sqftByAduId: adu.sqftByAduId,
            discountAmountByAduId: adu.discountAmountByAduId,
            discountLinesByAduId: adu.discountLinesByAduId,

            rentcast: { property, avm, rentals, market },

            featuredPropertyIds,
            featuredStoryIds,
            featuredRentals,
            slideOrder,
            projectTimeline,
            proposalPaymentSchedule,

            activeStep,
            doneSteps: Array.from(doneSteps),
            siteWorkConfirmed,

            companionStorage: captureCompanionStorage(),
        };
    }

    function applySnapshot(snap: ProposalSnapshot) {
        // Restore panel-owned localStorage keys FIRST so that when Step 3/4
        // mount and hydrate, they read the snapshot's data, not stale data.
        restoreCompanionStorage(snap.companionStorage);

        // Simple state
        setCustomerName(snap.customerName ?? "");
        setAddress(snap.address ?? "");
        setOwed(snap.owed ?? "");
        setPropertyPhotoUrl(snap.propertyPhotoUrl ?? null);
        setCustomerMotivation(snap.customerMotivation ?? null);
        setAduType(snap.aduType ?? "detached");
        setFloorplanId(snap.floorplanId ?? "");
        setCurrentFirstPmtMonthly(snap.currentFirstPmtMonthly ?? "");
        setSiteWorkConfirmed(!!snap.siteWorkConfirmed);

        // Replace the floorplan list: Sanity baseline + only this snapshot's
        // custom floorplans. Merging with `prev` would leak custom floorplans
        // from a previously-loaded proposal into this one.
        setFloorplans([...initialFloorplans, ...(snap.customFloorplans ?? [])]);

        setAduCompareIds(snap.aduCompareIds ?? []);
        // Block the "selected floorplan changed → recompute compare window" effect
        // from clobbering the loaded selection on the next render.
        lastSelectedIdRef.current = snap.floorplanId ?? null;

        // Investment model
        adu.setDefaults(snap.defaults);
        adu.setEstimatorByAduId(snap.estimatorByAduId ?? {});
        adu.setRentByAduId(snap.rentByAduId ?? {});
        adu.setBaseCostByAduId(snap.baseCostByAduId ?? {});
        adu.setSqftByAduId(snap.sqftByAduId ?? {});
        adu.setDiscountAmountByAduId(snap.discountAmountByAduId ?? {});
        adu.setDiscountLinesByAduId(snap.discountLinesByAduId ?? {});

        // Rentcast API results
        hydrateRentcast({
            property: snap.rentcast?.property ?? null,
            avm: snap.rentcast?.avm ?? null,
            rentals: snap.rentcast?.rentals ?? [],
            market: snap.rentcast?.market ?? null,
        });

        // Slide curation
        setFeaturedPropertyIds(snap.featuredPropertyIds ?? []);
        setFeaturedStoryIds(snap.featuredStoryIds ?? []);
        setFeaturedRentals(snap.featuredRentals ?? []);
        setSlideOrder(snap.slideOrder ?? []);
        setProjectTimeline(snap.projectTimeline ?? null);
        setProposalPaymentSchedule(snap.proposalPaymentSchedule ?? null);

        // Step status
        setActiveStep((snap.activeStep ?? 1) as 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12);
        setDoneSteps(new Set(snap.doneSteps ?? []));

        // Seed the autosave fingerprint with the just-loaded content so the
        // post-load autosave timer doesn't create a duplicate draft from a
        // snapshot the user hasn't edited yet.
        lastDraftFpRef.current = snapshotFingerprint(snap);
    }

    function handleSave() {
        const key = normalizeAddress(address);
        if (!key) {
            window.alert("Add a property address before saving.");
            return;
        }
        if (hasProposal(key)) {
            const ok = window.confirm(
                `There is an existing proposal with the same address saved. Are you sure you want to override it and save this one?`
            );
            if (!ok) return;
        }
        try {
            const snap = buildSnapshot();
            saveProposal(snap);
            // The draft for this address has been promoted to a proposal —
            // remove it so the dashboard doesn't show a duplicate entry.
            deleteDraft(key);
            // Block the pending autosave (and any future one) from re-creating
            // an identical draft until the user actually edits something.
            lastDraftFpRef.current = snapshotFingerprint(snap);
            setJustSaved(true);
            setTimeout(() => setJustSaved(false), 1800);
        } catch (err) {
            window.alert(
                `Failed to save proposal: ${err instanceof Error ? err.message : String(err)}`
            );
        }
    }

    function handleLoad(addressKey: string) {
        const snap = getProposal(addressKey);
        if (!snap) {
            window.alert("That saved proposal could not be loaded.");
            return;
        }
        applySnapshot(snap);
    }

    function handleLoadDraft(addressKey: string) {
        const snap = getDraft(addressKey);
        if (!snap) {
            window.alert("That draft could not be loaded.");
            return;
        }
        applySnapshot(snap);
    }

    function handleNew() {
        const hasContent =
            address.trim().length > 0 ||
            customerName.trim().length > 0 ||
            aduCompareIds.length > 0;
        if (hasContent) {
            const ok = window.confirm(
                "Start a new proposal? Your current work remains autosaved as a draft."
            );
            if (!ok) return;
        }

        // Form fields
        setCustomerName("");
        setAddress("");
        setOwed("");
        setPropertyPhotoUrl(null);
        setCustomerMotivation(null);
        setAduType("detached");
        setCurrentFirstPmtMonthly("");
        setSiteWorkConfirmed(false);

        // Drop any custom floorplans from prior session
        setFloorplans(initialFloorplans);
        const firstFp = initialFloorplans?.[0]?._id ?? "";
        setFloorplanId(firstFp);

        // Reset comparisons; force the auto-seed effect to re-fire
        setAduCompareIds([]);
        lastSelectedIdRef.current = null;

        // Investment model state
        adu.setDefaults(DEFAULTS);
        adu.setEstimatorByAduId({});
        adu.setRentByAduId({});
        adu.setBaseCostByAduId({});
        adu.setSqftByAduId({});
        adu.setDiscountAmountByAduId({});
        adu.setDiscountLinesByAduId({});

        // Rentcast API results
        hydrateRentcast({ property: null, avm: null, rentals: [], market: null });

        // Slide curation
        setFeaturedPropertyIds([]);
        setFeaturedStoryIds([]);
        setFeaturedRentals([]);
        setSlideOrder([]);
        setProjectTimeline(null);
        setProposalPaymentSchedule(null);

        // Step navigation
        setActiveStep(1);
        setDoneSteps(new Set());

        // Clear panel-owned localStorage so Step 3/4 don't bring back stale data
        restoreCompanionStorage({
            swp_master: null,
            swp_custom: null,
            dp_master: null,
            dp_custom: null,
        });

        // Reset autosave fingerprint so the next edit (after the user enters a
        // valid address) triggers a fresh draft save.
        lastDraftFpRef.current = "";
    }

    // ── Autosave (debounced) ──────────────────────────────────────────────────
    //
    // Build snapshot ref so the timer always reads the latest state without
    // putting `buildSnapshot` itself in the effect deps.
    const buildSnapshotRef = React.useRef(buildSnapshot);
    buildSnapshotRef.current = buildSnapshot;

    // Content fingerprint of the last saved/loaded snapshot. The autosave skips
    // when the current content matches this — prevents a "ghost draft" from
    // being re-created right after Save/Load/New.
    const lastDraftFpRef = React.useRef<string>("");
    function snapshotFingerprint(snap: ProposalSnapshot): string {
        const { savedAt: _ignored, ...rest } = snap;
        return JSON.stringify(rest);
    }

    // The SiteWorkPanel (Step 3) and DiscountsPanel (Step 4) write straight to
    // their own localStorage keys without going through React state, so changes
    // there don't trigger React deps. Poll the companion fingerprint and bump a
    // counter that we *do* feed into the autosave deps below.
    const [companionVersion, setCompanionVersion] = useState(0);
    const lastCompanionFpRef = React.useRef<string>("");
    useEffect(() => {
        if (typeof window === "undefined") return;
        function check() {
            const fp = companionStorageFingerprint();
            if (fp !== lastCompanionFpRef.current) {
                lastCompanionFpRef.current = fp;
                setCompanionVersion((v) => v + 1);
            }
        }
        check();
        const id = setInterval(check, 1500);
        return () => clearInterval(id);
    }, []);

    useEffect(() => {
        const addressKey = normalizeAddress(address);
        if (addressKey.length < 6) {
            setDraftStatus({ state: "idle", message: "Add address to enable autosave" });
            return;
        }

        setDraftStatus({ state: "pending" });
        const t = setTimeout(() => {
            try {
                const snap = buildSnapshotRef.current();
                const fp = snapshotFingerprint(snap);
                if (fp === lastDraftFpRef.current) {
                    // Nothing actually changed (e.g. just after Save/Load/New).
                    // Don't touch the draft store or the visible status.
                    return;
                }
                saveDraft(snap);
                lastDraftFpRef.current = fp;
                setDraftStatus({ state: "saved", at: new Date() });
            } catch (err) {
                setDraftStatus({
                    state: "error",
                    message: err instanceof Error ? err.message : "Save failed",
                });
            }
        }, 1500);

        return () => clearTimeout(t);
    }, [
        address, customerName, owed, propertyPhotoUrl, customerMotivation, aduType,
        floorplanId, currentFirstPmtMonthly,
        aduCompareIds, floorplans,
        adu.defaults, adu.estimatorByAduId, adu.rentByAduId, adu.baseCostByAduId,
        adu.sqftByAduId, adu.discountAmountByAduId, adu.discountLinesByAduId,
        property, avm, rentals, market,
        featuredPropertyIds, featuredStoryIds, featuredRentals, slideOrder,
        projectTimeline, proposalPaymentSchedule,
        activeStep, doneSteps, siteWorkConfirmed,
        companionVersion,
    ]);

    return (
        <div className={styles.appShell}>
            <AdminHeader
                onOpenPresenter={openPresenterWindow}
                onSave={handleSave}
                onOpenSaved={() => setSavedModalOpen(true)}
                onNew={handleNew}
                saveDisabled={normalizeAddress(address).length === 0}
                justSaved={justSaved}
                draftStatus={draftStatus}
            />
            <SavedProposals
                open={savedModalOpen}
                onClose={() => setSavedModalOpen(false)}
                onLoadProposal={handleLoad}
                onLoadDraft={handleLoadDraft}
            />

            <div className={styles.appBody}>
                <StepSidebar
                    activeStep={activeStep}
                    completedSteps={completedSteps}
                    needsInputSteps={needsInputSteps}
                    onStepClick={(n) => setActiveStep(n as 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12)}
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

                    {/* ── Step 7 · Feature Builds (curate Slide 5) ──────────── */}
                    <Step7_FeatureBuilds
                        {...stepState(7)}
                        kind="data"
                        onDone={() => markDone(7)}
                        completeSummary={
                            featuredPropertyIds.length > 0
                                ? `${featuredPropertyIds.length} build${featuredPropertyIds.length > 1 ? "s" : ""} curated`
                                : "Using Sanity featured"
                        }
                    >
                        <FeaturePropertiesPanel
                            properties={initialCompletedProperties}
                            selectedIds={featuredPropertyIds}
                            onChange={setFeaturedPropertyIds}
                        />
                    </Step7_FeatureBuilds>

                    {/* ── Step 8 · Feature Stories (curate Slide 6) ─────────── */}
                    <Step8_FeatureStories
                        {...stepState(8)}
                        kind="data"
                        onDone={() => markDone(8)}
                        completeSummary={
                            featuredStoryIds.length > 0
                                ? `${featuredStoryIds.length} stor${featuredStoryIds.length > 1 ? "ies" : "y"} curated`
                                : "Using Sanity featured"
                        }
                    >
                        <FeatureStoriesPanel
                            stories={initialStories}
                            selectedIds={featuredStoryIds}
                            onChange={setFeaturedStoryIds}
                        />
                    </Step8_FeatureStories>

                    {/* ── Step 9 · Feature Rentals (curate Slide 10) ────────── */}
                    <Step9_FeatureRentals
                        {...stepState(9)}
                        kind="data"
                        onDone={() => markDone(9)}
                        completeSummary={
                            featuredRentals.length > 0
                                ? `${featuredRentals.length} rental${featuredRentals.length > 1 ? "s" : ""} curated`
                                : "Using first 4 from RentCast"
                        }
                    >
                        <FeatureRentalsPanel
                            rentals={rentals}
                            selected={featuredRentals}
                            onChange={setFeaturedRentals}
                            maxSelected={4}
                        />
                    </Step9_FeatureRentals>

                    {/* ── Step 10 · Slide Order (drag-and-drop) ─────────────── */}
                    <Step10_SlideOrder
                        {...stepState(10)}
                        kind="data"
                        onDone={() => markDone(10)}
                        completeSummary={
                            slideOrder.length > 0
                                ? "Custom slide order"
                                : "Default slide order"
                        }
                    >
                        <SlideOrderPanel
                            value={slideOrder}
                            onChange={setSlideOrder}
                        />
                    </Step10_SlideOrder>

                    {/* ── Step 11 · Project Timeline (Slide 7 source) ───────── */}
                    <Step11_Timeline
                        {...stepState(11)}
                        kind="data"
                        onDone={() => markDone(11)}
                        completeSummary={
                            projectTimeline
                                ? "Custom timeline entered"
                                : "Using default timeline"
                        }
                    >
                        <TimelineEditorPanel
                            value={projectTimeline}
                            onChange={setProjectTimeline}
                            onReset={() => setProjectTimeline(null)}
                        />
                    </Step11_Timeline>

                    {/* ── Step 12 · Payment Schedule (drives the future contract slide) ── */}
                    <Step12_PaymentSchedule
                        {...stepState(12)}
                        kind="data"
                        onDone={() => markDone(12)}
                        completeSummary={
                            proposalPaymentSchedule
                                ? "Schedule entered"
                                : "Not yet generated"
                        }
                    >
                        <PaymentSchedulePanel
                            selectedAdus={adu.selectedAdus}
                            aduScenarios={adu.aduScenarios}
                            value={proposalPaymentSchedule}
                            onChange={setProposalPaymentSchedule}
                        />
                    </Step12_PaymentSchedule>

                </main>
            </div>
        </div>
    );
}
