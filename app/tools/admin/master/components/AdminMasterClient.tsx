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
import { CatalogDriftBanner } from "../components/CatalogDriftBanner/CatalogDriftBanner";
import { detectCatalogDrift, type CatalogDriftReport } from "@/lib/investment/catalogDrift";

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
import type { SanityProperty, SanityStory, FeaturedRental, ProjectTimeline, CityData } from "@/lib/store/presentationStore";
import type { ProposalPaymentSchedule, PaymentMilestoneDefData } from "@/lib/investment/proposalPaymentSchedule";
import type { DiscountsCatalogSummary } from "../page";
import type { SiteWorkCatalogData } from "@/lib/investment/siteWorkItems";
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
    syncFromServer,
    type ProposalSnapshot,
    PROPOSAL_SCHEMA_VERSION,
} from "@/lib/proposalSnapshot";
import { SavedProposals } from "../components/SavedProposals/SavedProposals";
import { buildAgreementData } from "@/lib/agreement/buildAgreementData";
import { useRentcastData } from "@/hooks/rentcast/useRentcastData";
import { useAduModel } from "@/hooks/investment/useAduModel";
import { money } from "@/lib/investment/format";
import { DEFAULTS, type Defaults } from "@/lib/investment/types";
import { usePresentationWire, openPresenterWindow } from "@/hooks/presentation/usePresentationWire";


export default function AdminMasterClient({
    initialFloorplans,
    initialCompletedProperties,
    initialStories,
    initialFinancialDefaults,
    initialCitiesCatalog,
    initialSlideOrder,
    initialMilestoneDefs,
    initialSiteWorkCatalogData,
    initialDiscountsCatalog,
}: {
    initialFloorplans: Floorplan[];
    initialCompletedProperties: SanityProperty[];
    initialStories: SanityStory[];
    /** Catalog-sourced financial defaults (Pattern A — seeded at proposal creation). */
    initialFinancialDefaults?: Defaults;
    /** DB-backed city catalog. Used by Step 11 to auto-populate the timeline
     *  when the address matches a known city, and broadcast to the presenter. */
    initialCitiesCatalog?: CityData[];
    /** Catalog default slide order. New proposals inherit this; existing keep theirs. */
    initialSlideOrder?: number[];
    /** DB-backed payment milestone defs — Step 12 generates balloon schedules
     *  against this catalog (with the legacy hardcoded list as fallback). */
    initialMilestoneDefs?: PaymentMilestoneDefData[];
    /** Runtime-shaped site-work catalog with full item rows. The SiteWorkPanel,
     *  useAduModel, and presenter wire all derive their effective category
     *  list from this; falls back to SITE_WORK_CATEGORIES when empty. */
    initialSiteWorkCatalogData?: SiteWorkCatalogData;
    initialDiscountsCatalog?: DiscountsCatalogSummary;
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
    // Seed slide order from the DB catalog (empty array if not yet fetched —
    // applySnapshot() will overwrite on proposal load, so existing proposals
    // still keep their frozen copy).
    const [slideOrder, setSlideOrder] = useState<number[]>(initialSlideOrder ?? []);
    const [projectTimeline, setProjectTimeline] = useState<ProjectTimeline | null>(null);
    // Tracks whether the user has manually edited the timeline. We only
    // auto-populate from the city catalog while this is false; once the rep
    // makes an edit we stop clobbering their work.
    const projectTimelineTouchedRef = React.useRef(false);
    const [proposalPaymentSchedule, setProposalPaymentSchedule] = useState<ProposalPaymentSchedule | null>(null);
    const [proposalPaymentSchedulesByAduId, setProposalPaymentSchedulesByAduId] = useState<Record<string, ProposalPaymentSchedule>>({});

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
    const [driftReport, setDriftReport] = useState<CatalogDriftReport | null>(null);
    const [activeStep, setActiveStep] = useState<1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12>(1);

    useEffect(() => {
        setFloorplans(initialFloorplans);
        setFloorplanId((prev) => prev || initialFloorplans?.[0]?._id || "");
    }, [initialFloorplans]);

    // ── One-shot sync with server on mount ──────────────────────────────────
    // Pulls any proposals/drafts saved on other devices into localStorage and
    // pushes any local-only entries up to the server. Runs once per admin
    // session; fails silently so the tool still works fully offline.
    const didSyncRef = React.useRef(false);
    useEffect(() => {
        if (didSyncRef.current) return;
        didSyncRef.current = true;
        void syncFromServer();
    }, []);

    // ── Auto-populate Step 11 timeline from the city catalog ────────────────
    // When the address contains a city we have data for, seed `projectTimeline`
    // with that city's BE + city averages. Skip if the rep has already manually
    // edited the timeline (we don't want to silently clobber their work).
    useEffect(() => {
        if (projectTimelineTouchedRef.current) return;
        if (!initialCitiesCatalog || initialCitiesCatalog.length === 0) return;
        if (!address || address.trim().length === 0) return;
        const a = address.toLowerCase();
        const match = initialCitiesCatalog.find(
            (c) => c.active && a.includes(c.name.toLowerCase())
        );
        if (!match) {
            // Address doesn't match anything — clear the auto-populated timeline
            // (only when it was auto-set, which is what `touchedRef === false` guarantees).
            setProjectTimeline(null);
            return;
        }
        setProjectTimeline({
            be: {
                plans:   match.bePlansDays,
                permits: match.bePermitsDays,
                build:   match.beBuildDays,
            },
            city: {
                plans:   match.cityPlansDays   ?? 0,
                permits: match.cityPermitsDays ?? 0,
                build:   match.cityBuildDays   ?? 0,
            },
        });
    }, [address, initialCitiesCatalog]);

    // Wrap setProjectTimeline so any caller-initiated change (e.g. the Step 11
    // editor) marks the timeline as "touched" and disables future auto-populate.
    const setProjectTimelineUserEdit = React.useCallback(
        (next: React.SetStateAction<ProjectTimeline | null>) => {
            projectTimelineTouchedRef.current = true;
            setProjectTimeline(next);
        },
        []
    );

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
        // Seed the model with catalog-sourced defaults so new proposals inherit
        // whatever the admin has set. Loaded proposals override this via
        // applySnapshot → setDefaults(snap.defaults) (Pattern A: frozen on save).
        defaultsProp: initialFinancialDefaults,
        discountsCatalog: initialDiscountsCatalog,
        siteWorkCatalog: initialSiteWorkCatalogData,
    });

    // ── Custom floorplan handlers ─────────────────────────────────────────────
    function addCustomFloorplan(input: {
        name?: string;
        sqft: number;
        price: number;
        bedrooms?: number;
        bathrooms?: number;
        imageUrl?: string;
    }) {
        const id = `custom_${crypto.randomUUID()}`;
        const beds = input.bedrooms ?? 0;
        const baths = input.bathrooms ?? 1;
        const fp: Floorplan = {
            _id: id,
            name: input.name?.trim() || `Custom ${input.sqft} SF`,
            sqft: input.sqft,
            price: input.price,
            beds,
            baths,
            bedrooms: input.bedrooms,
            bathrooms: input.bathrooms ?? baths,
            key: id,
            imageUrl: input.imageUrl?.trim() || undefined,
        };
        setFloorplans((prev) => [...prev, fp]);
        // Always add to the compare list — bump the cap when needed so the
        // user doesn't have to manually open the picker to make room.
        if (aduCompareIds.length >= adu.defaults.maxAduComparisons) {
            adu.updateDefault("maxAduComparisons", aduCompareIds.length + 1);
        }
        setAduCompareIds((prev) => [...prev, id]);
    }

    function removeCustomFloorplan(id: string) {
        setFloorplans((prev) => prev.filter((fp) => fp._id !== id));
        setAduCompareIds((prev) => prev.filter((x) => x !== id));
    }

    /** Duplicate a unit (Sanity or custom) — copy the floorplan record AND every
     *  per-unit state bucket (site work, discounts, rent, base cost, sqft). The
     *  duplicate is created as a custom-prefixed floorplan and auto-added to the
     *  compare list when there is room. */
    function duplicateFloorplan(sourceId: string) {
        const source = floorplans.find((fp) => fp._id === sourceId);
        if (!source) return;

        const newId = `custom_${crypto.randomUUID()}`;

        // Generate the next "(N)" suffix, skipping any that already exist.
        // Duplicates start at (1) — the original keeps its unsuffixed name.
        const baseName = (source.name ?? "Unit").replace(/\s*\(\d+\)\s*$/, "");
        const existingNames = new Set(floorplans.map((fp) => fp.name));
        let copyN = 1;
        while (existingNames.has(`${baseName} (${copyN})`)) copyN++;
        const newName = `${baseName} (${copyN})`;

        const dup: Floorplan = {
            ...source,
            _id: newId,
            key: newId,
            name: newName,
        };

        setFloorplans((prev) => [...prev, dup]);

        // Clone each per-unit state bucket from source → new ID.
        const cloneKey = <T,>(map: Record<string, T>): Record<string, T> => {
            if (!(sourceId in map)) return map;
            return { ...map, [newId]: structuredClone(map[sourceId]) };
        };
        adu.setEstimatorByAduId((prev) => cloneKey(prev));
        adu.setRentByAduId((prev) => cloneKey(prev));
        adu.setBaseCostByAduId((prev) => cloneKey(prev));
        adu.setSqftByAduId((prev) => cloneKey(prev));
        adu.setDiscountAmountByAduId((prev) => cloneKey(prev));
        adu.setDiscountLinesByAduId((prev) => cloneKey(prev));

        // Mirror the panel-owned per-unit localStorage overrides
        // (SiteWorkPanel + DiscountsPanel write here outside of React state).
        try {
            const raw = localStorage.getItem("swp_custom");
            const swp = raw ? JSON.parse(raw) : null;
            if (swp && typeof swp === "object" && sourceId in swp) {
                swp[newId] = structuredClone(swp[sourceId]);
                localStorage.setItem("swp_custom", JSON.stringify(swp));
            }
        } catch { /* ignore malformed storage */ }
        try {
            const raw = localStorage.getItem("dp_custom");
            const dp = raw ? JSON.parse(raw) : null;
            if (dp && typeof dp === "object" && sourceId in dp) {
                dp[newId] = structuredClone(dp[sourceId]);
                localStorage.setItem("dp_custom", JSON.stringify(dp));
            }
        } catch { /* ignore malformed storage */ }

        // Always add the duplicate to the comparison list — bump the cap
        // when needed so clicking Duplicate is a single-step action regardless
        // of how many units are already selected.
        if (aduCompareIds.length >= adu.defaults.maxAduComparisons) {
            adu.updateDefault("maxAduComparisons", aduCompareIds.length + 1);
        }
        setAduCompareIds((prev) => [...prev, newId]);
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

    // Derive the singular "primary" payment schedule from the per-ADU Record so
    // Slide 14 and buildAgreementData (which still read the singular field) keep
    // working unchanged. The primary = first compared ADU's schedule.
    useEffect(() => {
        const primaryAduId = aduCompareIds[0];
        const next = primaryAduId
            ? proposalPaymentSchedulesByAduId[primaryAduId] ?? null
            : null;
        setProposalPaymentSchedule(next);
    }, [proposalPaymentSchedulesByAduId, aduCompareIds]);

    // ── Presentation sync ─────────────────────────────────────────────────────
    usePresentationWire({
        customerName,
        propertyAddress: address,
        aduType,
        propertyPhotoUrl,
        customerMotivation,
        comparedUnitIds: aduCompareIds,
        floorplans,
        featuredPropertyIds,
        featuredStoryIds,
        featuredRentals,
        slideOrder,
        projectTimeline,
        proposalPaymentSchedule,
        proposalPaymentSchedulesByAduId,
        scenarios: adu.scenarios,
        rentalComps: rentals,
        rentByUnitId: adu.rentByAduId,
        activeSnapshotByAduId: adu.activeSnapshotByAduId,
        discountLinesByAduId: adu.discountLinesByAduId,
        discountsCatalog: initialDiscountsCatalog,
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
            proposalPaymentSchedulesByAduId,

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

        // Surface any catalog references this snapshot has that no longer
        // exist in the live catalog. Cheap pure function, ok to run inline.
        setDriftReport(detectCatalogDrift(snap, initialSiteWorkCatalogData, initialDiscountsCatalog));

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
        // Loading a saved proposal counts as "touched" — its frozen
        // projectTimeline wins over the catalog's current values.
        projectTimelineTouchedRef.current = (snap.projectTimeline ?? null) !== null;
        setProjectTimeline(snap.projectTimeline ?? null);
        setProposalPaymentSchedule(snap.proposalPaymentSchedule ?? null);

        // Migrate old snapshots that only have the singular field by keying
        // its schedule under its aduId; new snapshots already carry the Record.
        if (snap.proposalPaymentSchedulesByAduId) {
            setProposalPaymentSchedulesByAduId(snap.proposalPaymentSchedulesByAduId);
        } else if (snap.proposalPaymentSchedule) {
            setProposalPaymentSchedulesByAduId({
                [snap.proposalPaymentSchedule.aduId]: snap.proposalPaymentSchedule,
            });
        } else {
            setProposalPaymentSchedulesByAduId({});
        }

        // Step status
        setActiveStep((snap.activeStep ?? 1) as 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12);
        setDoneSteps(new Set(snap.doneSteps ?? []));

        // Seed the autosave fingerprint with the just-loaded content so the
        // post-load autosave timer doesn't create a duplicate draft from a
        // snapshot the user hasn't edited yet.
        lastDraftFpRef.current = snapshotFingerprint(snap);
    }

    function handleGenerateAgreement() {
        if (normalizeAddress(address).length === 0) {
            window.alert("Add a property address before opening the agreement.");
            return;
        }
        if (!proposalPaymentSchedule) {
            window.alert("Configure the payment schedule (Step 12) before opening the agreement.");
            return;
        }
        // Carry-over exclusions across runs. They're editable inline in the
        // preview anyway, so we skip the prompt and just load whatever was
        // saved last time. A dedicated step panel could promote this later.
        const exclusionsRaw = window.localStorage.getItem("agreement_exclusions_v1") || "";

        try {
            const data = buildAgreementData({
                customerName,
                propertyAddress: address,
                proposalPaymentSchedule,
                floorplans,
                siteWorkByUnitId: adu.activeSnapshotByAduId
                    ? Object.fromEntries(
                          Object.entries(adu.activeSnapshotByAduId).map(([id, items]) => [
                              id,
                              items.map((it) => ({
                                  label: it.label,
                                  category: it.catLabel,
                                  total: it.customerTotal,
                              })),
                          ])
                      )
                    : {},
                discountLinesByUnitId: adu.discountLinesByAduId,
                exclusions: exclusionsRaw,
            });

            // Hand the prepared data to the preview tab via localStorage,
            // then open the editor. The preview client generates the .docx
            // there, converts to HTML, and lets the user edit before
            // printing or downloading.
            window.localStorage.setItem(
                "be_agreement_preview_data_v1",
                JSON.stringify(data)
            );
            window.open(
                "/tools/admin/master/agreement",
                "be_agreement_preview",
                "noopener"
            );
        } catch (err) {
            window.alert(
                `Couldn't prepare the agreement:\n\n${err instanceof Error ? err.message : String(err)}`
            );
        }
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

    // ── Load proposal from `?address=` URL param ────────────────────────────
    // Dashboards link "Open →" to /tools/admin/master?address=<key>. We hit
    // the proposal API directly rather than waiting on the bulk
    // `syncFromServer()` pull to finish (which races against this mount
    // effect and would leave the form empty). Falls back to localStorage if
    // the API is unreachable (offline / dev outage). One-shot via a ref so
    // React StrictMode's double-invoke doesn't reload twice.
    const initialUrlLoadRef = React.useRef(false);
    useEffect(() => {
        if (initialUrlLoadRef.current) return;
        initialUrlLoadRef.current = true;
        if (typeof window === "undefined") return;
        const params = new URLSearchParams(window.location.search);
        const addressKey = params.get("address");
        if (!addressKey) return;

        // Dashboard row-menu deep links pass these flags so the master tool
        // can chain into the presenter / export windows once hydration is done.
        const autoPresent = params.get("autoPresent") === "1";
        const autoExport = params.get("autoExport") === "1";

        async function fetchSnapshot(key: string, status: "SAVED" | "DRAFT"): Promise<ProposalSnapshot | null> {
            try {
                const res = await fetch(
                    `/api/admin/proposals/${encodeURIComponent(key)}?status=${status}`,
                );
                if (!res.ok) return null;
                const data = (await res.json()) as { proposal: ProposalSnapshot | null };
                return data.proposal ?? null;
            } catch {
                return null;
            }
        }

        (async () => {
            // Try SAVED first; fall back to DRAFT for in-flight work.
            const saved = await fetchSnapshot(addressKey, "SAVED");
            const draft = saved ?? (await fetchSnapshot(addressKey, "DRAFT"));
            // Last-resort fallback to localStorage so the master tool still
            // hydrates if the API is unreachable.
            const snap = saved ?? draft ?? getProposal(addressKey) ?? getDraft(addressKey);
            if (snap) {
                applySnapshot(snap);

                // Give the presentation wire (~1 render) a moment to flush
                // the freshly-applied snapshot into localStorage + the
                // BroadcastChannel before opening any companion window.
                if (autoPresent) {
                    setTimeout(() => openPresenterWindow("v2"), 600);
                }
                if (autoExport) {
                    setTimeout(
                        () => window.open("/present-v2/print", "be_print_v2", "noopener"),
                        600,
                    );
                }

                // Strip the auto-* params so a manual refresh doesn't keep
                // re-firing the companion windows. Keep `address` so the
                // tool stays hydrated.
                if (autoPresent || autoExport) {
                    const cleanParams = new URLSearchParams({ address: addressKey });
                    window.history.replaceState(
                        {},
                        "",
                        `/tools/admin/master?${cleanParams.toString()}`,
                    );
                }
            }
        })();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

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
        setDriftReport(null);

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
        setSlideOrder(initialSlideOrder ?? []);
        // Re-arm auto-populate so the next address pulls fresh from the catalog.
        projectTimelineTouchedRef.current = false;
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
        projectTimeline, proposalPaymentSchedule, proposalPaymentSchedulesByAduId,
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
                onExportPdf={() => {
                    // Opening the print window in a new tab gives the user a
                    // dedicated context for the print dialog. The current admin
                    // tab keeps broadcasting state via the wire so the new tab
                    // hydrates from the latest snapshot.
                    window.open("/present-v2/print", "be_print_v2", "noopener");
                }}
                onGenerateAgreement={handleGenerateAgreement}
                saveDisabled={normalizeAddress(address).length === 0}
                exportDisabled={normalizeAddress(address).length === 0}
                agreementDisabled={normalizeAddress(address).length === 0 || !proposalPaymentSchedule}
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

                    {/* ── Drift warning (loaded proposal references missing catalog items) ── */}
                    <CatalogDriftBanner
                        report={driftReport}
                        selectedAdus={adu.selectedAdus}
                        onDismiss={() => setDriftReport(null)}
                    />

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
                            onDuplicateFloorplan={duplicateFloorplan}
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
                                catalog={initialSiteWorkCatalogData}
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
                            discountsCatalog={initialDiscountsCatalog}
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
                            onChange={setProjectTimelineUserEdit}
                            onReset={() => {
                                // Reset is a "manual" event — disarm auto-populate so the
                                // catalog doesn't immediately re-fill what the rep just cleared.
                                projectTimelineTouchedRef.current = true;
                                setProjectTimeline(null);
                            }}
                        />
                    </Step11_Timeline>

                    {/* ── Step 12 · Payment Schedule (drives the future contract slide) ── */}
                    <Step12_PaymentSchedule
                        {...stepState(12)}
                        kind="data"
                        onDone={() => markDone(12)}
                        completeSummary={
                            Object.keys(proposalPaymentSchedulesByAduId).length > 0
                                ? "Schedule entered"
                                : "Not yet generated"
                        }
                    >
                        <PaymentSchedulePanel
                            selectedAdus={adu.selectedAdus}
                            aduScenarios={adu.aduScenarios}
                            value={proposalPaymentSchedulesByAduId}
                            onChange={setProposalPaymentSchedulesByAduId}
                            milestoneDefs={initialMilestoneDefs}
                        />
                    </Step12_PaymentSchedule>

                </main>
            </div>
        </div>
    );
}
