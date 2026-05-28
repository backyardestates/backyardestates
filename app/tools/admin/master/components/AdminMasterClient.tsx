// app/admin/AdminMasterClient.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import styles from "./AdminMasterClient.module.css";
import { AddressAutocomplete } from "./address/AddressAutocomplete";

import { AdminHeader } from "../components/AdminHeader/AdminHeader";
import { Step1Body } from "../components/Step1Body/Step1Body";
import { StepSidebar } from "../components/StepSidebar/StepSidebar";

// Step wrappers are tiny (just a StepCard + props) so they stay static.
import { Step1_WhoAndWhere } from "../components/steps/Step1_WhoAndWhere";
// Step2_ChooseUnits absorbed into Step 1 — kept as an import for now in case
// other code paths reference it; remove once the renumber is complete.
import { Step2_ChooseUnits } from "../components/steps/Step2_ChooseUnits";
import { Step3_EstimateJob } from "../components/steps/Step3_EstimateJob";
import { Step4_Discounts } from "../components/steps/Step4_Discounts";
import { Step5_RentalMarket } from "../components/steps/Step5_RentalMarket";
import { Step6_ReviewAndGenerate } from "../components/steps/Step6_ReviewAndGenerate";
import { ExclusionsPanel } from "../components/ExclusionsPanel/ExclusionsPanel";
import { Step7_FeatureBuilds } from "../components/steps/Step7_FeatureBuilds";
import { Step8_FeatureStories } from "../components/steps/Step8_FeatureStories";
import { Step9_FeatureRentals } from "../components/steps/Step9_FeatureRentals";
import { Step10_SlideOrder } from "../components/steps/Step10_SlideOrder";
import { Step11_Timeline } from "../components/steps/Step11_Timeline";
import { Step12_PaymentSchedule } from "../components/steps/Step12_PaymentSchedule";

import { CatalogDriftBanner } from "../components/CatalogDriftBanner/CatalogDriftBanner";
import { detectCatalogDrift, type CatalogDriftReport } from "@/lib/investment/catalogDrift";
import { DraftBanner } from "../components/DraftBanner/DraftBanner";
import { DiffPanel } from "../components/DraftBanner/DiffPanel";
import { diffSnapshots } from "@/lib/proposalDiff";

import { FinancingTable } from "../components/Financing/FinancingTable";

import sectionStyles from "../components/Investment/InvestmentSection.module.css";
import tableStyles from "../components/investmentModel/InvestmentModelTable.module.css";

// ── Lazy-loaded heavy panels ─────────────────────────────────────────────
// Each step's body only mounts when that step is active (see StepCard's
// `{showBody && children}` gate), so dynamic-import with ssr:false defers
// the panel's JS until the rep opens that step. Shrinks the initial bundle
// the master tool ships on first paint.
const PanelLoading = () => (
    <div className={styles.panelLoading} aria-live="polite">Loading…</div>
);

const InvestmentControls = dynamic(
    () => import("../components/Investment/InvestmentControls").then((m) => m.InvestmentControls),
    { ssr: false, loading: PanelLoading },
);
const InvestmentCompareSummary = dynamic(
    () => import("../components/Investment/InvestmentCompareSummary").then((m) => m.InvestmentCompareSummary),
    { ssr: false, loading: PanelLoading },
);
const ModelTable = dynamic(
    () => import("../components/Investment/ModelTable").then((m) => m.ModelTable),
    { ssr: false, loading: PanelLoading },
);
const SiteWorkPanel = dynamic(
    () => import("../components/SiteWorkEstimator/SiteWorkPanel").then((m) => m.SiteWorkPanel),
    { ssr: false, loading: PanelLoading },
);
const DiscountsPanel = dynamic(
    () => import("../components/DiscountsPanel/DiscountsPanel").then((m) => m.DiscountsPanel),
    { ssr: false, loading: PanelLoading },
);
const RentalsPanel = dynamic(
    () => import("../components/RentalsPanel/RentalsPanel").then((m) => m.RentalsPanel),
    { ssr: false, loading: PanelLoading },
);
const FeaturePropertiesPanel = dynamic(
    () => import("../components/FeaturePropertiesPanel/FeaturePropertiesPanel").then((m) => m.FeaturePropertiesPanel),
    { ssr: false, loading: PanelLoading },
);
const FeatureStoriesPanel = dynamic(
    () => import("../components/FeatureStoriesPanel/FeatureStoriesPanel").then((m) => m.FeatureStoriesPanel),
    { ssr: false, loading: PanelLoading },
);
const FeatureRentalsPanel = dynamic(
    () => import("../components/FeatureRentalsPanel/FeatureRentalsPanel").then((m) => m.FeatureRentalsPanel),
    { ssr: false, loading: PanelLoading },
);
const SlideOrderPanel = dynamic(
    () => import("../components/SlideOrderPanel/SlideOrderPanel").then((m) => m.SlideOrderPanel),
    { ssr: false, loading: PanelLoading },
);
const TimelineEditorPanel = dynamic(
    () => import("../components/TimelineEditorPanel/TimelineEditorPanel").then((m) => m.TimelineEditorPanel),
    { ssr: false, loading: PanelLoading },
);
const PaymentSchedulePanel = dynamic(
    () => import("../components/PaymentSchedulePanel/PaymentSchedulePanel").then((m) => m.PaymentSchedulePanel),
    { ssr: false, loading: PanelLoading },
);

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
import { usePresentationStore } from "@/lib/store/presentationStore";
import { buildAdminBroadcast } from "@/lib/sync/presentationSync";


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

    // Per-unit overrides for the merged Step 1 — see lib/units/resolveUnitSpec.ts
    const [aduTypeByUnitId, setAduTypeByUnitId] = useState<Record<string, "detached" | "attached" | "garage">>({});
    const [bedsByUnitId, setBedsByUnitId] = useState<Record<string, number>>({});
    const [bathsByUnitId, setBathsByUnitId] = useState<Record<string, number>>({});
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
    /** Which compared unit drives the agreement on initial open. Left at
     *  null today so the preview tab's switcher picks the primary by default;
     *  reserved for a future "pre-pick a unit before opening" affordance in
     *  the admin header. */
    const [agreementAduId] = useState<string | null>(null);

    /** Manual exclusions text — one line per exclusion. Owned by the
     *  proposal, persisted in the snapshot. The legacy global localStorage
     *  key `agreement_exclusions_v1` is auto-migrated into a fresh draft on
     *  first mount below (so a value entered before this field existed
     *  isn't lost) and then cleared so it can't ghost future proposals. */
    const [agreementExclusions, setAgreementExclusions] = useState<string>("");

    /** One-time migration of the legacy browser-global exclusions key.
     *  Runs once on mount: if there's a value in localStorage, copy it into
     *  state (so the rep doesn't lose what they had typed) and clear the
     *  legacy key (so it can't keep haunting every future proposal). */
    useEffect(() => {
        try {
            const legacy = window.localStorage.getItem("agreement_exclusions_v1");
            if (legacy && legacy.trim().length > 0) {
                setAgreementExclusions((current) => current || legacy);
            }
            // Always clear the legacy key, even when empty, so it can never
            // surprise a future build that reads from it.
            window.localStorage.removeItem("agreement_exclusions_v1");
        } catch { /* ignore — private browsing / quota issues are fine here */ }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Pipedrive link — set via Step 1's PipedriveLinkPanel. When non-null,
    // every Save will also post a proposal-link note back to that record.
    const [pipedrivePersonId, setPipedrivePersonId] = useState<string | null>(null);
    const [pipedriveDealId, setPipedriveDealId] = useState<string | null>(null);

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
    const [activeStep, setActiveStep] = useState<1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11>(1);

    // ── Draft/canonical bundle for the currently loaded address ──────────────
    //
    // When we load a proposal from a URL or saved-list click, we fetch the
    // full bundle (canonical REVIEWED + my own DRAFT + other-user drafts
    // for admins). The banner uses this to show "viewing your draft vs the
    // canonical" toggles and to power the diff pop-out.
    //
    // `loadedBundle` snapshots the server state at load time; it's
    // refreshed on save. `currentView` tracks which snapshot is currently
    // *applied* to the form state.
    type LoadedBundle = {
        reviewed: { snapshot: ProposalSnapshot; ownedBy: { id: string; email: string | null }; savedAt: string } | null;
        myDraft: { snapshot: ProposalSnapshot; savedAt: string } | null;
        otherDrafts: Array<{ userId: string; email: string | null; savedAt: string }>;
    };
    type CurrentView =
        | { kind: "my-draft"; savedAt: string }
        | { kind: "reviewed"; savedAt: string }
        | { kind: "other-draft"; userId: string; email: string | null; savedAt: string }
        | null;
    const [loadedBundle, setLoadedBundle] = useState<LoadedBundle | null>(null);
    const [currentView, setCurrentView] = useState<CurrentView>(null);
    const [diffOpen, setDiffOpen] = useState(false);

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
    /** Infer beds/baths for a custom unit by interpolating between the two
     *  catalog floorplans flanking its sqft — mirrors the price proration
     *  logic so a 700 SF custom unit picks up bed/bath counts from the 650
     *  and 750 SF catalog entries. Returns whole beds and 0.5-step baths. */
    function inferBedsBathsFromCatalog(sqft: number): { beds: number; baths: number } {
        const catalog = floorplans
            .filter((fp) => !fp._id.startsWith("custom_"))
            .map((fp) => ({
                sqft: fp.sqft,
                beds: fp.beds ?? fp.bed ?? fp.bedrooms ?? 0,
                baths: fp.baths ?? fp.bath ?? fp.bathrooms ?? 1,
            }))
            .filter((fp) => fp.sqft > 0)
            .sort((a, b) => a.sqft - b.sqft);

        if (catalog.length === 0) return { beds: 0, baths: 1 };
        if (catalog.length === 1) return { beds: catalog[0].beds, baths: catalog[0].baths };
        if (sqft <= catalog[0].sqft) return { beds: catalog[0].beds, baths: catalog[0].baths };
        const last = catalog[catalog.length - 1];
        if (sqft >= last.sqft) return { beds: last.beds, baths: last.baths };

        let lo = catalog[0];
        let hi = last;
        for (let i = 0; i < catalog.length - 1; i++) {
            if (catalog[i].sqft <= sqft && catalog[i + 1].sqft >= sqft) {
                lo = catalog[i];
                hi = catalog[i + 1];
                break;
            }
        }
        const t = (sqft - lo.sqft) / (hi.sqft - lo.sqft);
        return {
            beds: Math.round(lo.beds + t * (hi.beds - lo.beds)),
            baths: Math.round((lo.baths + t * (hi.baths - lo.baths)) * 2) / 2,
        };
    }

    /** Pick the catalog floorplan with sqft closest to the given size and
     *  return its drawing URL. Used as the default image for a new custom
     *  unit when the rep doesn't pick or upload one explicitly. */
    function inferDrawingFromCatalog(sqft: number): { url: string | undefined; sourceName: string | undefined } {
        const catalog = floorplans
            .filter((fp) => !fp._id.startsWith("custom_"))
            .filter((fp) => fp.sqft > 0 && (fp.floorPlanUrl || fp.imageUrl));
        if (catalog.length === 0) return { url: undefined, sourceName: undefined };
        let closest = catalog[0];
        let bestDelta = Math.abs(catalog[0].sqft - sqft);
        for (const fp of catalog) {
            const d = Math.abs(fp.sqft - sqft);
            if (d < bestDelta) {
                closest = fp;
                bestDelta = d;
            }
        }
        return {
            url: closest.floorPlanUrl ?? closest.imageUrl,
            sourceName: closest.name,
        };
    }

    function addCustomFloorplan(input: {
        name?: string;
        sqft: number;
        price: number;
        bedrooms?: number;
        bathrooms?: number;
        imageUrl?: string;
    }) {
        const id = `custom_${crypto.randomUUID()}`;
        const inferred = inferBedsBathsFromCatalog(input.sqft);
        const beds = input.bedrooms ?? inferred.beds;
        const baths = input.bathrooms ?? inferred.baths;
        const inferredImage = inferDrawingFromCatalog(input.sqft);
        const drawingUrl = input.imageUrl?.trim() || inferredImage.url;
        const fp: Floorplan = {
            _id: id,
            name: input.name?.trim() || `Custom ${input.sqft} SF`,
            sqft: input.sqft,
            price: input.price,
            beds,
            baths,
            bedrooms: input.bedrooms ?? inferred.beds,
            bathrooms: input.bathrooms ?? inferred.baths,
            key: id,
            floorPlanUrl: drawingUrl,
            imageUrl: drawingUrl,
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

    /** Push a $10,000 "Additional bathroom" line into a unit's site-work
     *  estimator. Called from the UnitsPanel inline confirm prompt when the
     *  rep bumps a unit's bath count. Idempotent only on intent — each call
     *  appends a new line so two confirmed bumps add $20k. */
    function addBathroomUpcharge(unitId: string) {
        adu.setEstimatorByAduId((prev) => {
            const existing = prev[unitId] ?? { quantities: {}, overrides: {}, customItems: [] };
            const newItem = {
                id: `custom_bath_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
                catId: "interior",
                label: "Additional bathroom",
                qty: 1,
                beCost: 10000,
                markup: 1,
            };
            return {
                ...prev,
                [unitId]: {
                    ...existing,
                    customItems: [...(existing.customItems ?? []), newItem],
                },
            };
        });
    }

    // ── Step state model ──────────────────────────────────────────────────────
    // Two separate concepts:
    //  • hasData[n]   — required form data is present for step n
    //  • doneSteps[n] — user explicitly clicked Done on step n
    // "Complete" = both true (so editing the data invalidates a prior Done).
    const [doneSteps, setDoneSteps] = useState<Set<number>>(new Set());

    function markDone(n: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11) {
        setDoneSteps((prev) => {
            const next = new Set(prev);
            next.add(n);
            return next;
        });
        if (n < 11) setActiveStep(((n + 1) as 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11));
    }

    // Per-step required-data validation
    // Step 1 now covers Who/Where + Choose Units in one panel.
    // After merging Choose Units into Step 1, the steps are renumbered:
    //   1: Who/Where/Units (was 1+2)   7: Feature Stories  (was 8)
    //   2: Estimate Job   (was 3)      8: Feature Rentals  (was 9)
    //   3: Discounts      (was 4)      9: Slide Order      (was 10)
    //   4: Rental Market  (was 5)      10: Timeline        (was 11)
    //   5: Review         (was 6)      11: Payment Sched   (was 12)
    //   6: Feature Builds (was 7)
    const step1HasData = address.length > 5 && aduCompareIds.length > 0;
    const step2HasData = adu.selectedAdus.length > 0; // was step3
    const step3HasData = true; // discounts (was step4)
    const step4HasData = true; // rental market (was step5)
    const step5HasData = true; // review (was step6)
    const step6HasData = true; // feature builds (was step7)
    const step7HasData = true; // feature stories (was step8)
    const step8HasData = true; // feature rentals (was step9)
    const step9HasData = true; // slide order (was step10)
    const step10HasData = true; // timeline (was step11)
    const step11HasData = true; // payment schedule (was step12)
    const hasData = [step1HasData, step2HasData, step3HasData, step4HasData, step5HasData, step6HasData, step7HasData, step8HasData, step9HasData, step10HasData, step11HasData];

    const completions = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((n) => doneSteps.has(n) && hasData[n - 1]);

    const completedSteps = completions
        .map((done, i) => (done ? i + 1 : null))
        .filter((n): n is number => n !== null);

    const needsInputSteps = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].filter((n) => !hasData[n - 1]);

    function stepState(n: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11) {
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
        // Per-unit overrides — user-edited values from the merged Step 1
        // panel take precedence over the global aduType and floorplan
        // defaults. Anything not overridden falls back so the presenter
        // sees a complete map.
        aduTypeByUnitId: Object.fromEntries(
            adu.selectedAdus.map((fp) => [
                fp._id,
                aduTypeByUnitId[fp._id]
                    ?? ((aduType || "detached") as "detached" | "attached" | "garage"),
            ]),
        ),
        bedsByUnitId: Object.fromEntries(
            // Sanity floorplans project as `bed` (singular); admin-created
            // custom units use `beds` (plural). Accept either so the wire
            // never broadcasts 0 just because the source field name differs.
            adu.selectedAdus.map((fp) => [
                fp._id,
                bedsByUnitId[fp._id]
                    ?? fp.beds
                    ?? (fp as unknown as { bed?: number }).bed
                    ?? 0,
            ]),
        ),
        bathsByUnitId: Object.fromEntries(
            adu.selectedAdus.map((fp) => [
                fp._id,
                bathsByUnitId[fp._id]
                    ?? fp.baths
                    ?? (fp as unknown as { bath?: number }).bath
                    ?? 0,
            ]),
        ),
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
            aduTypeByUnitId,
            bedsByUnitId,
            bathsByUnitId,

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

            pipedrivePersonId,
            pipedriveDealId,

            agreementExclusions,

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
        // Per-unit overrides (merged Step 1)
        setAduTypeByUnitId(snap.aduTypeByUnitId ?? {});
        setBedsByUnitId(snap.bedsByUnitId ?? {});
        setBathsByUnitId(snap.bathsByUnitId ?? {});
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

        // Pipedrive linkage
        setPipedrivePersonId(snap.pipedrivePersonId ?? null);
        setPipedriveDealId(snap.pipedriveDealId ?? null);

        // Manual agreement exclusions (per-proposal — empty for snapshots
        // saved before this field existed).
        setAgreementExclusions(snap.agreementExclusions ?? "");

        // Step status
        setActiveStep((snap.activeStep ?? 1) as 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11);
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
        if (Object.keys(proposalPaymentSchedulesByAduId).length === 0) {
            window.alert("Configure the payment schedule (Step 12) before opening the agreement.");
            return;
        }
        // Per-proposal manual exclusions edited in Step 6's ExclusionsPanel.
        // (The previous design read from a browser-global localStorage key,
        // which caused entries to ghost across every customer's agreement.)
        const exclusionsRaw = agreementExclusions;

        try {
            // Hand off the FULL set of inputs (not the resolved template
            // data). The preview client renders a unit-switcher dropdown and
            // re-runs buildAgreementData on each switch — so it needs to be
            // able to rebuild on demand. The "selectedAduId" field lets the
            // admin pre-select which unit drives the agreement on first open.
            const input = {
                customerName,
                propertyAddress: address,
                proposalPaymentSchedulesByAduId,
                comparedUnitIds: aduCompareIds,
                selectedAduId: agreementAduId,
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
                bedsByUnitId,
                bathsByUnitId,
            };

            // Sanity-check: make sure the inputs actually produce a valid
            // agreement before opening the preview tab.
            buildAgreementData(input);

            window.localStorage.setItem(
                "be_agreement_preview_input_v2",
                JSON.stringify(input)
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

    async function handleSave() {
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
            // Await server persistence so a quota error or network blip
            // surfaces as an alert instead of a silent loss. The LS mirror
            // is best-effort and won't throw.
            const saved = await saveProposal(snap);
            // The draft for this address has been promoted to a proposal —
            // remove it so the dashboard doesn't show a duplicate entry.
            // Fire-and-forget; the user doesn't need to wait.
            void deleteDraft(key);
            // Block the pending autosave (and any future one) from re-creating
            // an identical draft until the user actually edits something.
            lastDraftFpRef.current = snapshotFingerprint(snap);
            setJustSaved(true);
            setTimeout(() => setJustSaved(false), 1800);

            // Pipedrive: if this proposal is linked to a person or deal,
            // post a "proposal saved" note back to the CRM with a deep link
            // into the master tool. Fire-and-forget — a CRM-side failure
            // shouldn't undo the save the rep just confirmed.
            if (pipedrivePersonId || pipedriveDealId) {
                const proposalUrl = `${window.location.origin}/tools/admin/master?address=${encodeURIComponent(key)}`;
                const lines = [
                    `Proposal saved for ${customerName || "this customer"} (${address}).`,
                    `Open in tool: ${proposalUrl}`,
                ];
                void fetch("/api/pipedrive/post-note", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        personId: pipedrivePersonId,
                        dealId: pipedriveDealId,
                        content: lines.join("\n\n"),
                    }),
                }).catch((err) => {
                    console.warn("[pipedrive.post-note] failed", err);
                });
            }

            // Phase 0b: persist the presenter-ready payloads so /present/[id]
            // and /agreement/[id] can render this proposal standalone (no live
            // admin session). Fire-and-forget + fully isolated — a failure here
            // never affects the save above or the live presenting flow.
            if (saved?.id) {
                try {
                    const presenterBroadcast = buildAdminBroadcast(
                        usePresentationStore.getState(),
                        { includeCustomFloorplans: true }
                    );
                    const agreementInput = {
                        customerName,
                        propertyAddress: address,
                        proposalPaymentSchedulesByAduId,
                        comparedUnitIds: aduCompareIds,
                        selectedAduId: aduCompareIds[0] ?? null,
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
                        exclusions: agreementExclusions,
                        bedsByUnitId,
                        bathsByUnitId,
                    };
                    void fetch(`/api/proposals/${saved.id}/presenter-payload`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ presenterBroadcast, agreementInput }),
                    }).catch((err) => {
                        console.warn("[presenter-payload] failed", err);
                    });
                } catch (err) {
                    console.warn("[presenter-payload] build failed", err);
                }
            }
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

        // Admin chip-click: ?asDraftOf=<userId> opens that user's draft.
        const asDraftOf = params.get("asDraftOf");

        async function fetchBundle(key: string) {
            try {
                const res = await fetch(`/api/admin/proposals/${encodeURIComponent(key)}`);
                if (!res.ok) return null;
                return (await res.json()) as LoadedBundle;
            } catch {
                return null;
            }
        }

        async function fetchUserDraft(key: string, forUserId: string): Promise<ProposalSnapshot | null> {
            try {
                const res = await fetch(
                    `/api/admin/proposals/${encodeURIComponent(key)}?status=DRAFT&forUser=${encodeURIComponent(forUserId)}`,
                );
                if (!res.ok) return null;
                const data = (await res.json()) as { proposal: ProposalSnapshot | null };
                return data.proposal ?? null;
            } catch {
                return null;
            }
        }

        (async () => {
            // Fetch the bundle so the banner has full context (reviewed +
            // myDraft + otherDrafts) regardless of which one ends up applied.
            const bundle = await fetchBundle(addressKey);
            if (bundle) setLoadedBundle(bundle);

            // Decide which snapshot to apply, in order:
            //   1. ?asDraftOf=<userId>     — admin clicked a chip; open that draft
            //   2. bundle.myDraft          — pick up where the caller left off
            //   3. bundle.reviewed         — canonical
            //   4. localStorage fallbacks  — offline / network dead
            let snap: ProposalSnapshot | null = null;
            let appliedView: CurrentView = null;

            if (asDraftOf) {
                snap = await fetchUserDraft(addressKey, asDraftOf);
                if (snap) {
                    const meta = bundle?.otherDrafts.find((d) => d.userId === asDraftOf);
                    appliedView = {
                        kind: "other-draft",
                        userId: asDraftOf,
                        email: meta?.email ?? null,
                        savedAt: meta?.savedAt ?? snap.savedAt,
                    };
                }
            }

            if (!snap && bundle?.myDraft) {
                snap = bundle.myDraft.snapshot;
                appliedView = { kind: "my-draft", savedAt: bundle.myDraft.savedAt };
            }
            if (!snap && bundle?.reviewed) {
                snap = bundle.reviewed.snapshot;
                appliedView = { kind: "reviewed", savedAt: bundle.reviewed.savedAt };
            }
            if (!snap) {
                snap = getProposal(addressKey) ?? getDraft(addressKey);
                // Local-fallback path: best guess at view kind.
                if (snap) appliedView = { kind: "my-draft", savedAt: snap.savedAt };
            }

            if (snap) {
                applySnapshot(snap);
                setCurrentView(appliedView);

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
        setAduTypeByUnitId({});
        setBedsByUnitId({});
        setBathsByUnitId({});
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
        setProposalPaymentSchedulesByAduId({});
        setPipedrivePersonId(null);
        setPipedriveDealId(null);
        setAgreementExclusions("");

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
        setLoadedBundle(null);
        setCurrentView(null);
    }

    // ── Draft / canonical view switching ──────────────────────────────────────
    //
    // Banner buttons call these to swap the loaded snapshot. Each handler
    // applies the target snapshot (which re-fingerprints lastDraftFpRef so
    // the autosave doesn't fire spuriously) and updates currentView so the
    // banner reflects what's on screen.

    function switchToMyDraft() {
        const snap = loadedBundle?.myDraft?.snapshot;
        if (!snap) return;
        applySnapshot(snap);
        setCurrentView({ kind: "my-draft", savedAt: loadedBundle!.myDraft!.savedAt });
    }

    function switchToReviewed() {
        const snap = loadedBundle?.reviewed?.snapshot;
        if (!snap) return;
        applySnapshot(snap);
        setCurrentView({ kind: "reviewed", savedAt: loadedBundle!.reviewed!.savedAt });
    }

    async function switchToOtherDraft(targetUserId: string) {
        const key = normalizeAddress(address);
        if (!key) return;
        try {
            const res = await fetch(
                `/api/admin/proposals/${encodeURIComponent(key)}?status=DRAFT&forUser=${encodeURIComponent(targetUserId)}`,
            );
            if (!res.ok) {
                window.alert("Couldn't load that draft.");
                return;
            }
            const data = (await res.json()) as { proposal: ProposalSnapshot | null };
            if (!data.proposal) {
                window.alert("That draft no longer exists.");
                return;
            }
            applySnapshot(data.proposal);
            const meta = loadedBundle?.otherDrafts.find((d) => d.userId === targetUserId);
            setCurrentView({
                kind: "other-draft",
                userId: targetUserId,
                email: meta?.email ?? null,
                savedAt: meta?.savedAt ?? data.proposal.savedAt,
            });
        } catch (err) {
            window.alert(`Failed to load draft: ${err instanceof Error ? err.message : String(err)}`);
        }
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

    /**
     * Stable, recursive JSON stringify — sorts object keys at every level so
     * two equivalent objects with different insertion order produce the same
     * string. Critical for the autosave equality check: a server-loaded
     * snapshot and a freshly-rebuilt one have identical content but the JS
     * object key order differs, which broke a naive JSON.stringify compare.
     */
    function stableStringify(value: unknown): string {
        if (value === null || typeof value !== "object") return JSON.stringify(value);
        if (Array.isArray(value)) return "[" + value.map(stableStringify).join(",") + "]";
        const obj = value as Record<string, unknown>;
        const keys = Object.keys(obj).sort();
        return "{" + keys.map((k) => JSON.stringify(k) + ":" + stableStringify(obj[k])).join(",") + "}";
    }

    /**
     * Fingerprint only the *user-editable* fields. Excluded:
     *   - savedAt           — bookkeeping, not content.
     *   - activeStep/doneSteps/siteWorkConfirmed — UI navigation, not data.
     *   - rentcast          — refreshed from the API in the background; not
     *                         a user edit, would falsely mark the proposal
     *                         as "changed" the moment the API responds.
     *   - companionStorage  — duplicates of in-state estimator/discount data
     *                         which are already fingerprinted.
     */
    function snapshotFingerprint(snap: ProposalSnapshot): string {
        return stableStringify({
            customerName: snap.customerName,
            address: snap.address,
            owed: snap.owed,
            propertyPhotoUrl: snap.propertyPhotoUrl,
            customerMotivation: snap.customerMotivation,
            aduType: snap.aduType,
            floorplanId: snap.floorplanId,
            currentFirstPmtMonthly: snap.currentFirstPmtMonthly,
            customFloorplans: snap.customFloorplans,
            aduCompareIds: snap.aduCompareIds,
            defaults: snap.defaults,
            estimatorByAduId: snap.estimatorByAduId,
            rentByAduId: snap.rentByAduId,
            baseCostByAduId: snap.baseCostByAduId,
            sqftByAduId: snap.sqftByAduId,
            discountAmountByAduId: snap.discountAmountByAduId,
            discountLinesByAduId: snap.discountLinesByAduId,
            featuredPropertyIds: snap.featuredPropertyIds,
            featuredStoryIds: snap.featuredStoryIds,
            featuredRentals: snap.featuredRentals,
            slideOrder: snap.slideOrder,
            projectTimeline: snap.projectTimeline,
            proposalPaymentSchedule: snap.proposalPaymentSchedule,
            proposalPaymentSchedulesByAduId: snap.proposalPaymentSchedulesByAduId,
        });
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
        const t = setTimeout(async () => {
            const snap = buildSnapshotRef.current();
            const fp = snapshotFingerprint(snap);
            if (fp === lastDraftFpRef.current) {
                // Nothing actually changed (e.g. just after Save/Load/New).
                // Don't touch the draft store or the visible status.
                setDraftStatus((prev) => prev.state === "pending" ? { state: "idle" } : prev);
                return;
            }
            // saveDraft fires the server upsert immediately and returns its
            // promise. The localStorage mirror is best-effort and won't throw
            // here (it has its own quota-safe handling). We await the server
            // promise so the "saved" state reflects real DB persistence.
            try {
                await saveDraft(snap);
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
        agreementExclusions,
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
                    onStepClick={(n) => setActiveStep(n as 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11)}
                />

                <main className={styles.main}>

                    {/* ── Draft / canonical view banner ──────────────────── */}
                    <DraftBanner
                        bundle={loadedBundle}
                        view={currentView}
                        hasUnsavedEdits={
                            !!currentView && lastDraftFpRef.current !== "" &&
                            snapshotFingerprint(buildSnapshot()) !== lastDraftFpRef.current
                        }
                        onSwitchToMyDraft={switchToMyDraft}
                        onSwitchToReviewed={switchToReviewed}
                        onSwitchToOtherDraft={switchToOtherDraft}
                        onShowDiff={() => setDiffOpen(true)}
                    />

                    {diffOpen && loadedBundle?.reviewed && (
                        <DiffPanel
                            activeLabel={
                                currentView?.kind === "my-draft" ? "Your draft" :
                                currentView?.kind === "other-draft" ? `${currentView.email || "Other"}'s draft` :
                                "Current view"
                            }
                            sections={diffSnapshots(
                                buildSnapshot(),
                                loadedBundle.reviewed.snapshot,
                                { a: currentView?.kind === "my-draft" ? "Your draft" : "Current", b: "Canonical" },
                            )}
                            onClose={() => setDiffOpen(false)}
                        />
                    )}

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
                        needsInputMessage="Enter the address and pick at least one unit to continue"
                        doneLabel={loading ? "Pulling property data…" : "Pull property data"}
                        onDone={() => {
                            getApiData({ address, selectedFloorplan });
                            markDone(1);
                        }}
                        completeSummary={
                            address
                                ? `${address}${aduCompareIds.length > 0 ? ` · ${aduCompareIds.length} unit${aduCompareIds.length > 1 ? "s" : ""}` : ""}`
                                : "No address yet"
                        }
                    >
                        <Step1Body
                            // Customer
                            customerName={customerName}
                            setCustomerName={setCustomerName}
                            customerMotivation={customerMotivation}
                            setCustomerMotivation={setCustomerMotivation}
                            pipedrivePersonId={pipedrivePersonId}
                            pipedriveDealId={pipedriveDealId}
                            setPipedrivePersonId={setPipedrivePersonId}
                            setPipedriveDealId={setPipedriveDealId}
                            // Property
                            AddressAutocomplete={AddressAutocomplete}
                            address={address}
                            setAddress={setAddress}
                            owed={owed}
                            setOwed={setOwed}
                            currentFirstPmtMonthly={currentFirstPmtMonthly}
                            setCurrentFirstPmtMonthly={setCurrentFirstPmtMonthly}
                            propertyPhotoUrl={propertyPhotoUrl}
                            setPropertyPhotoUrl={setPropertyPhotoUrl}
                            loading={loading}
                            error={error}
                            // Units
                            floorplans={floorplans}
                            selectedFloorplan={selectedFloorplan}
                            floorplanId={floorplanId}
                            setFloorplanId={setFloorplanId}
                            aduCompareIds={aduCompareIds}
                            aduType={aduType}
                            setAduType={setAduType}
                            aduTypeByUnitId={aduTypeByUnitId}
                            setAduTypeByUnitId={setAduTypeByUnitId}
                            bedsByUnitId={bedsByUnitId}
                            setBedsByUnitId={setBedsByUnitId}
                            bathsByUnitId={bathsByUnitId}
                            setBathsByUnitId={setBathsByUnitId}
                            defaults={adu.defaults}
                            updateDefault={adu.updateDefault}
                            toggleAdu={adu.toggleAdu}
                            addCustomFloorplan={addCustomFloorplan}
                            removeCustomFloorplan={removeCustomFloorplan}
                            duplicateFloorplan={duplicateFloorplan}
                            addBathroomUpcharge={addBathroomUpcharge}
                        />
                    </Step1_WhoAndWhere>

                    {/* ── Step 3 · Estimate the Job ─────────────────────────── */}
                    <Step3_EstimateJob
                        {...stepState(2)}
                        kind="data"
                        needsInput={!step3HasData}
                        needsInputMessage="Select units in Step 2 before estimating site work"
                        onDone={() => { setSiteWorkConfirmed(true); markDone(2); }}
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
                        {...stepState(3)}
                        kind="data"
                        onDone={() => markDone(3)}
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
                        {...stepState(4)}
                        kind="review"
                        onDone={() => markDone(4)}
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
                        {...stepState(5)}
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

                        <ExclusionsPanel
                            value={agreementExclusions}
                            onChange={setAgreementExclusions}
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
                        {...stepState(6)}
                        kind="data"
                        onDone={() => markDone(6)}
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
                        {...stepState(7)}
                        kind="data"
                        onDone={() => markDone(7)}
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
                        {...stepState(8)}
                        kind="data"
                        onDone={() => markDone(8)}
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
                        {...stepState(9)}
                        kind="data"
                        onDone={() => markDone(9)}
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
                        {...stepState(10)}
                        kind="data"
                        onDone={() => markDone(10)}
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
                        {...stepState(11)}
                        kind="data"
                        onDone={() => markDone(11)}
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
