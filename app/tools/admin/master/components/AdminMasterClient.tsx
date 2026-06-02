// app/admin/AdminMasterClient.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import styles from "./AdminMasterClient.module.css";
import { AddressAutocomplete } from "./address/AddressAutocomplete";

import { AdminHeader } from "../components/AdminHeader/AdminHeader";
import { Step1Body } from "../components/Step1Body/Step1Body";
import { UnitsBody } from "../components/UnitsBody/UnitsBody";
import { StepSidebar } from "../components/StepSidebar/StepSidebar";

// All steps render through StepCard directly — the step number, title, kind,
// and order all live in one place (the JSX below) so they can't drift out of
// sync the way the old per-step wrapper components did.
import { StepCard } from "../components/shared/StepCard";
import { SitePhotoBody } from "../components/SitePhotoStep/SitePhotoBody";
import { ExclusionsPanel } from "../components/ExclusionsPanel/ExclusionsPanel";

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
import type { SanityProperty, SanityStory, FeaturedRental, ProjectTimeline, CityData, ExclusionItem } from "@/lib/store/presentationStore";
import type { ProposalPaymentSchedule, PaymentMilestoneDefData } from "@/lib/investment/proposalPaymentSchedule";
import { generateBalloonSchedule, generateBalloonFromCatalogDefs } from "@/lib/investment/proposalPaymentSchedule";
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
import { scopedCompanionKey, readCompanion, writeCompanion, getCompanionScope } from "@/lib/admin/companionKeys";
import { SavedProposals } from "../components/SavedProposals/SavedProposals";
import { buildAgreementData } from "@/lib/agreement/buildAgreementData";
import { useRentcastData } from "@/hooks/rentcast/useRentcastData";
import { useAduModel } from "@/hooks/investment/useAduModel";
import { money } from "@/lib/investment/format";
import { rentalKey, toFeatured } from "@/lib/rentals/featured";
import { type Defaults } from "@/lib/investment/types";
import { usePresentationWire, openPresenterWindow } from "@/hooks/presentation/usePresentationWire";
import { usePresentationStore } from "@/lib/store/presentationStore";
import { buildAdminBroadcast } from "@/lib/sync/presentationSync";
import { ArchitectFlagsPanel } from "./ArchitectFlagsPanel";
import { RentHero } from "./RentHero/RentHero";
import {
    ProposalPrefillModal,
    PrefillStatusBanner,
    type PrefillDecisions,
    type PrefillStatus,
} from "./ProposalPrefillModal/ProposalPrefillModal";
import type { ProposalPrefillPlan } from "@/lib/ai/proposalPrefill";
import type { EstimatorState } from "@/lib/investment/siteWorkItems";

/** 1-based step index in the wizard. There are 11 sequential steps; keep this
 *  in sync with the StepSidebar STEPS list and the JSX render order below.
 *  "Review & Generate" is NOT a step — it's a pinned control panel below them. */
type StepNum = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11;

// Count of matchable items in a prefill plan (for the status banner).
function prefillCount(p: ProposalPrefillPlan): number {
    let n = 0;
    if (p.customerProfile?.name || p.customerProfile?.pipedriveDealId) n++;
    if (p.motivation?.value) n++;
    if (p.aduType?.value) n++;
    if (p.unitSpec?.beds.value != null || p.unitSpec?.baths.value != null) n++;
    if (p.financials?.owed.value != null || p.financials?.currentMortgageMonthly.value != null) n++;
    n += p.costAdders?.length ?? 0;
    n += (p.featuredStoryIds?.value.length ?? 0) + (p.featuredPropertyIds?.value.length ?? 0);
    return n;
}

/** Stable-ish id for a freshly-created exclusion item. */
function newExclusionId(): string {
    return (typeof crypto !== "undefined" && "randomUUID" in crypto)
        ? crypto.randomUUID()
        : `excl_${Date.now()}_${Math.round(Math.random() * 1e6)}`;
}

/** Migrate a legacy free-text exclusions blob (one per line) into structured
 *  items. Each line becomes an item's name with no price/note. */
function legacyExclusionsToItems(text: string): ExclusionItem[] {
    return text
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter((line) => line.length > 0)
        .map((name) => ({ id: newExclusionId(), name, price: 0, note: "" }));
}

/** Format structured exclusions into the agreement's bullet strings:
 *  "Name ($price) — note" (price/note omitted when empty). */
function exclusionsToAgreementLines(items: ExclusionItem[]): string[] {
    return items
        .filter((e) => e.name.trim().length > 0)
        .map((e) => {
            const price = e.price > 0
                ? ` ($${e.price.toLocaleString("en-US")})`
                : "";
            const note = e.note.trim().length > 0 ? ` — ${e.note.trim()}` : "";
            return `${e.name.trim()}${price}${note}`;
        });
}


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
    const [customerEmail, setCustomerEmail] = useState("");
    const [propertyPhotoUrl, setPropertyPhotoUrl] = useState<string | null>(null);
    const [customerMotivation, setCustomerMotivation] = useState<import("@/lib/store/presentationStore").CustomerMotivation>(null);
    const [aduType, setAduType] = useState<"detached" | "attached" | "garage" | "">("detached");

    const [floorplans, setFloorplans] = useState<Floorplan[]>(initialFloorplans);

    // ── Consultation→FPA prefill popup (opened from "Start estimate") ────────
    const [prefillOpen, setPrefillOpen] = useState(false);
    const [prefillLoading, setPrefillLoading] = useState(false);
    const [prefillPlan, setPrefillPlan] = useState<ProposalPrefillPlan | null>(null);
    const [prefillProposalId, setPrefillProposalId] = useState<string | null>(null);
    const [prefillStatus, setPrefillStatus] = useState<PrefillStatus>("idle");
    const [prefillError, setPrefillError] = useState<string | null>(null);
    // Bumped after applying cost-adders so the (localStorage-seeded) SiteWorkPanel remounts and re-reads.
    const [swKey, setSwKey] = useState(0);
    const [floorplanId, setFloorplanId] = useState<string>(initialFloorplans?.[0]?._id ?? "");

    const [featuredPropertyIds, setFeaturedPropertyIds] = useState<string[]>([]);
    const [featuredStoryIds, setFeaturedStoryIds] = useState<string[]>([]);
    const [featuredRentals, setFeaturedRentals] = useState<FeaturedRental[]>([]);

    // Per-unit overrides for the merged Step 1 — see lib/units/resolveUnitSpec.ts
    const [aduTypeByUnitId, setAduTypeByUnitId] = useState<Record<string, "detached" | "attached" | "garage">>({});
    const [bedsByUnitId, setBedsByUnitId] = useState<Record<string, number>>({});
    const [bathsByUnitId, setBathsByUnitId] = useState<Record<string, number>>({});
    // Optional custom tag per unit (e.g. "Hillside") that distinguishes duplicates
    // in display without changing the underlying name. See lib/units/displayName.ts.
    const [labelByUnitId, setLabelByUnitId] = useState<Record<string, string>>({});
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

    /** Proposal-wide exclusions (structured line items: name + price + note).
     *  Each is a carve-out shown on the comparison slide ("Not included") and
     *  listed on the agreement. Owned by the proposal, persisted in the
     *  snapshot. Superseded the legacy free-text `agreementExclusions` string
     *  (migrated on load — see applySnapshot). */
    const [exclusions, setExclusions] = useState<ExclusionItem[]>([]);

    /** One-time migration of the legacy browser-global exclusions key.
     *  Runs once on mount: if there's free-text in localStorage, convert each
     *  non-empty line into a structured item (name only) so nothing is lost,
     *  then clear the legacy key so it can't haunt future proposals. */
    useEffect(() => {
        try {
            const legacy = window.localStorage.getItem("agreement_exclusions_v1");
            if (legacy && legacy.trim().length > 0) {
                const migrated = legacyExclusionsToItems(legacy);
                if (migrated.length > 0) {
                    setExclusions((current) => (current.length > 0 ? current : migrated));
                }
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
    // Explicit-save lifecycle for the header Save button. "saving" shows a
    // spinner while the server round-trip is in flight (DB upsert + materialize)
    // so the button never looks frozen; "saved"/"error" auto-revert to idle.
    const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
    const saveResetRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

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
    const [activeStep, setActiveStep] = useState<StepNum>(1);

    // "Review & Generate" is a control panel pinned below the steps, not a
    // sequential step. It's collapsed by default; opened on demand from the
    // sidebar shortcut or its own header so policy knobs can be edited live
    // without gating the flow behind a "final review".
    const [reviewOpen, setReviewOpen] = useState(false);
    function openReviewPanel() {
        setReviewOpen(true);
        requestAnimationFrame(() => {
            document.getElementById("review-generate-panel")
                ?.scrollIntoView({ behavior: "smooth", block: "start" });
        });
    }

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
            const raw = readCompanion("swp_custom");
            const swp = raw ? JSON.parse(raw) : null;
            if (swp && typeof swp === "object" && sourceId in swp) {
                swp[newId] = structuredClone(swp[sourceId]);
                writeCompanion("swp_custom", JSON.stringify(swp));
            }
        } catch { /* ignore malformed storage */ }
        try {
            const raw = readCompanion("dp_custom");
            const dp = raw ? JSON.parse(raw) : null;
            if (dp && typeof dp === "object" && sourceId in dp) {
                dp[newId] = structuredClone(dp[sourceId]);
                writeCompanion("dp_custom", JSON.stringify(dp));
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

    function markDone(n: StepNum) {
        setDoneSteps((prev) => {
            const next = new Set(prev);
            next.add(n);
            return next;
        });
        if (n < 11) setActiveStep(((n + 1) as StepNum));
    }

    // Toggle a rental comp's "featured on slide" state from the Rental Market
    // step's comps list (merged from the old Feature Rentals step). Adding
    // preserves the featured editor's per-rental photo/order data; removing
    // matches by the shared rentalKey. Capped at MAX_FEATURED_RENTALS.
    const MAX_FEATURED_RENTALS = 4;
    function toggleFeaturedRental(r: import("@/lib/rentcast/types").RentalListing) {
        const key = rentalKey(r);
        setFeaturedRentals((prev) => {
            const existing = prev.find((f) => rentalKey(f) === key);
            if (existing) return prev.filter((f) => rentalKey(f) !== key);
            if (prev.length >= MAX_FEATURED_RENTALS) return prev;
            return [...prev, toFeatured(r)];
        });
    }

    // Per-step required-data validation. Only two steps actually gate on
    // required input; the rest are always satisfiable (optional / review).
    // `hasUnits` is reused by the Estimate-the-Job step's needs-input check.
    const hasUnits = adu.selectedAdus.length > 0;
    const detailsHasData = address.length > 5; // Who & Where (Details)

    // hasData[i] === "is step (i+1)'s required data present?" — indexed by the
    // sidebar step number. Order MUST match the JSX render order + StepSidebar.
    const hasData = [
        detailsHasData, //  1 · Details (Who & Where)
        hasUnits,       //  2 · Units (needs at least one unit)
        true,           //  3 · Site Photo (optional)
        hasUnits,       //  4 · Estimate the Job (needs at least one unit)
        true,           //  5 · Discounts
        true,           //  6 · Rental Market + Feature Rentals (review)
        true,           //  7 · Project Timeline
        true,           //  8 · Payment Schedule
        true,           //  9 · Feature Builds
        true,           // 10 · Feature Stories
        true,           // 11 · Slide Order
    ];

    const ALL_STEPS: StepNum[] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];

    const completions = ALL_STEPS.map((n) => doneSteps.has(n) && hasData[n - 1]);

    const completedSteps = completions
        .map((done, i) => (done ? i + 1 : null))
        .filter((n): n is number => n !== null);

    const needsInputSteps = ALL_STEPS.filter((n) => !hasData[n - 1]);

    function stepState(n: StepNum) {
        const isComplete = completions[n - 1];
        return {
            isActive: activeStep === n,
            isPending: !isComplete && activeStep !== n,
            isComplete,
            onEdit: () => setActiveStep(n),
        };
    }

    // ── Keep payment schedules in sync with live estate prices ──────────────
    // Auto-(re)generate each compared unit's balloon schedule whenever its total
    // price changes — even when the Payment Schedule step isn't the active card
    // (StepCard unmounts inactive bodies, so the panel's own effect can't do
    // this on its own). This keeps the contract total, the "Switch to …" deltas,
    // and the schedule rows live across the whole tool + the agreement preview.
    // Per the chosen behavior: regenerate the default split on drift (manual
    // milestone edits reset). After a regen the stored total == the unit total,
    // so the guard is false next render — no loop.
    useEffect(() => {
        const cols = adu.aduScenarios
            .map((sc) => ({
                id: sc.key.replace(/^adu_/, ""),
                total: sc.finalAduPrice ?? sc.purchasePrice ?? 0,
            }))
            .filter((c) => c.total > 0);
        if (cols.length === 0) return;

        const gen = (total: number) =>
            initialMilestoneDefs && initialMilestoneDefs.length > 0
                ? generateBalloonFromCatalogDefs(total, initialMilestoneDefs)
                : generateBalloonSchedule(total);

        setProposalPaymentSchedulesByAduId((prev) => {
            const next = { ...prev };
            let mutated = false;
            for (const col of cols) {
                const existing = next[col.id];
                const drifted = existing && Math.abs(existing.totalPrice - col.total) > 1;
                if (!existing || drifted) {
                    next[col.id] = { aduId: col.id, totalPrice: col.total, entries: gen(col.total) };
                    mutated = true;
                }
            }
            return mutated ? next : prev;
        });
        // Keyed on the per-unit totals so it only re-runs when a price actually
        // moves. initialMilestoneDefs is stable (SSR prop).
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [adu.aduScenarios.map((sc) => `${sc.key}|${sc.finalAduPrice ?? sc.purchasePrice ?? 0}`).join(",")]);

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
        labelByUnitId,
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
        exclusions,
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
            customerEmail,
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
            labelByUnitId,

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

            exclusions,

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
        setCustomerEmail(snap.customerEmail ?? "");
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
        setLabelByUnitId(snap.labelByUnitId ?? {});
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

        // Exclusions (per-proposal). Prefer the structured field; fall back to
        // migrating the legacy free-text `agreementExclusions` blob so older
        // snapshots still surface their carve-outs.
        if (snap.exclusions && snap.exclusions.length > 0) {
            setExclusions(snap.exclusions);
        } else if (snap.agreementExclusions && snap.agreementExclusions.trim().length > 0) {
            setExclusions(legacyExclusionsToItems(snap.agreementExclusions));
        } else {
            setExclusions([]);
        }

        // Step status
        setActiveStep((snap.activeStep ?? 1) as StepNum);
        setDoneSteps(new Set(snap.doneSteps ?? []));

        // Seed the autosave fingerprint with the just-loaded content so the
        // post-load autosave timer doesn't create a duplicate draft from a
        // snapshot the user hasn't edited yet.
        lastDraftFpRef.current = snapshotFingerprint(snap);
        hydratedRef.current = true;
    }

    // Build the FULL set of inputs the agreement preview needs to (re)render.
    // The preview re-runs buildAgreementData on each unit switch + live update,
    // so it gets the inputs, not the resolved template data. Returns null when
    // the proposal isn't ready (no address / no payment schedule yet).
    function buildAgreementInput() {
        if (normalizeAddress(address).length === 0) return null;
        if (Object.keys(proposalPaymentSchedulesByAduId).length === 0) return null;
        return {
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
            exclusions: exclusionsToAgreementLines(exclusions),
            bedsByUnitId,
            bathsByUnitId,
            aduTypeByUnitId,
            aduType,
        };
    }

    async function handleGenerateAgreement() {
        if (normalizeAddress(address).length === 0) {
            window.alert("Add a property address before opening the agreement.");
            return;
        }
        if (Object.keys(proposalPaymentSchedulesByAduId).length === 0) {
            window.alert("Configure the payment schedule (Step 12) before opening the agreement.");
            return;
        }

        try {
            const input = buildAgreementInput()!;

            // Sanity-check: make sure the inputs actually produce a valid
            // agreement before opening the preview tab.
            buildAgreementData(input);

            // Keep the localStorage handoff as an instant-render fallback.
            window.localStorage.setItem(
                "be_agreement_preview_input_v2",
                JSON.stringify(input)
            );

            // Commit the proposal so the agreement has a real record to attach
            // to: this gives us a proposalId (which unlocks Save-PDF and
            // Send-for-signature in the preview), links the engagement (→ the
            // customer email the e-sign needs), and persists the agreement
            // inputs so the contract can be reopened/sent from any device.
            let proposalId: string | undefined;
            try {
                const snap = buildSnapshotRef.current();
                const saved = await saveProposal(snap);
                proposalId = saved?.id;
                lastDraftFpRef.current = snapshotFingerprint(snap);
                if (proposalId) {
                    await fetch(`/api/proposals/${proposalId}/agreement`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ agreementInput: input }),
                    }).catch(() => {});
                }
            } catch (e) {
                // Non-fatal: the preview still opens from the localStorage handoff;
                // only the save/send actions (which need an id) stay unavailable.
                console.warn("[agreement] commit before preview failed", e);
            }

            const url = proposalId
                ? `/tools/admin/master/agreement?proposalId=${encodeURIComponent(proposalId)}`
                : "/tools/admin/master/agreement";
            window.open(url, "be_agreement_preview", "noopener");
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
        // Flip the button to "Saving…" immediately so the (potentially slow)
        // server round-trip gives instant feedback instead of looking frozen.
        if (saveResetRef.current) clearTimeout(saveResetRef.current);
        setSaveStatus("saving");
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
            setSaveStatus("saved");
            saveResetRef.current = setTimeout(() => setSaveStatus("idle"), 1800);

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
                        exclusions: exclusionsToAgreementLines(exclusions),
                        bedsByUnitId,
                        bathsByUnitId,
                        aduTypeByUnitId,
                        aduType,
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
            setSaveStatus("error");
            saveResetRef.current = setTimeout(() => setSaveStatus("idle"), 5000);
            window.alert(
                `Failed to save proposal: ${err instanceof Error ? err.message : String(err)}`
            );
        }
    }

    // ── Consultation→FPA prefill ────────────────────────────────────────────
    // Fetch the AI prefill plan for a proposal id (cached server-side after the
    // first build). Opens the modal; closes it if there's nothing to prefill.
    async function loadPrefillPlan(pid: string) {
        setPrefillLoading(true);
        setPrefillStatus("loading");
        setPrefillError(null);
        setPrefillOpen(true);
        console.info("[prefill] requesting plan for proposal", pid);
        try {
            const res = await fetch(`/api/proposals/${pid}/prefill`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    units: floorplans.map((fp) => ({
                        id: fp._id,
                        name: fp.name,
                        bed: fp.bed,
                        bath: fp.bath,
                        sqft: fp.sqft,
                    })),
                }),
            });
            const data = await res.json().catch(() => ({}));
            console.info("[prefill] response", res.status, data);
            if (!res.ok) {
                setPrefillPlan(null);
                setPrefillOpen(false);
                setPrefillStatus("error");
                setPrefillError(data?.error || `HTTP ${res.status}`);
                return;
            }
            if (data?.plan) {
                setPrefillPlan(data.plan as ProposalPrefillPlan);
                setPrefillStatus("ready");
            } else {
                setPrefillPlan(null);
                setPrefillOpen(false); // nothing to prefill — banner shows instead
                setPrefillStatus(data?.error ? "error" : "empty");
                if (data?.error) setPrefillError(data.error);
            }
        } catch (err) {
            console.error("[prefill] request failed", err);
            setPrefillPlan(null);
            setPrefillOpen(false);
            setPrefillStatus("error");
            setPrefillError(err instanceof Error ? err.message : String(err));
        } finally {
            setPrefillLoading(false);
        }
    }

    // Apply approved cost-adders through the SiteWorkPanel's localStorage channel
    // (swp_master / swp_custom) — the panel owns that state and re-derives
    // estimatorByAduId from it on mount, so we mutate there + remount via swKey.
    function applyCostAddersToEstimator(adders: PrefillDecisions["costAdders"]) {
        if (adders.length === 0) return;
        const readLS = <T,>(k: string, fallback: T): T => {
            try {
                const raw = localStorage.getItem(k);
                return raw ? (JSON.parse(raw) as T) : fallback;
            } catch {
                return fallback;
            }
        };
        const master = readLS<EstimatorState>(scopedCompanionKey("swp_master"), {
            quantities: {},
            overrides: {},
            customItems: [],
        });
        const custom = readLS<Record<string, EstimatorState | null>>(scopedCompanionKey("swp_custom"), {});

        const mutate = (state: EstimatorState, a: PrefillDecisions["costAdders"][number]): EstimatorState => {
            if (a.itemId) {
                return {
                    ...state,
                    quantities: { ...state.quantities, [a.itemId]: 1 },
                    overrides:
                        a.amount != null
                            ? { ...(state.overrides ?? {}), [a.itemId]: { beCost: a.amount, markup: 1 } }
                            : { ...(state.overrides ?? {}) },
                };
            }
            const id =
                typeof crypto !== "undefined" && "randomUUID" in crypto
                    ? crypto.randomUUID()
                    : `pf_${Date.now()}_${Math.round(Number(`0.${String(a.label.length)}`) * 1e6)}`;
            return {
                ...state,
                customItems: [
                    ...state.customItems,
                    { id, catId: a.catId, label: a.label, qty: 1, beCost: a.amount ?? 0, markup: 1 },
                ],
            };
        };

        let nextMaster = master;
        const nextCustom: Record<string, EstimatorState | null> = { ...custom };
        for (const a of adders) {
            if (a.targetUnitId === "all") {
                nextMaster = mutate(nextMaster, a);
                // Also reflect into any units that already detached from master.
                for (const uid of Object.keys(nextCustom)) {
                    if (nextCustom[uid]) nextCustom[uid] = mutate(nextCustom[uid]!, a);
                }
            } else {
                const base = nextCustom[a.targetUnitId] ?? {
                    quantities: { ...nextMaster.quantities },
                    overrides: { ...(nextMaster.overrides ?? {}) },
                    customItems: nextMaster.customItems.map((ci) => ({ ...ci })),
                };
                nextCustom[a.targetUnitId] = mutate(base, a);
            }
        }

        // Targeted write — only the site-work keys. (restoreCompanionStorage is a
        // full replace that would also clear the discount keys.)
        writeCompanion("swp_master", JSON.stringify(nextMaster));
        writeCompanion("swp_custom", JSON.stringify(nextCustom));
        setSwKey((k) => k + 1); // remount SiteWorkPanel so it re-reads localStorage
    }

    // Apply the rep-approved prefill decisions into the wizard's store.
    function applyPrefill(d: PrefillDecisions) {
        if (d.customerProfile) {
            if (d.customerProfile.name) setCustomerName(d.customerProfile.name);
            if (d.customerProfile.pipedrivePersonId) setPipedrivePersonId(d.customerProfile.pipedrivePersonId);
            if (d.customerProfile.pipedriveDealId) setPipedriveDealId(d.customerProfile.pipedriveDealId);
        }
        if (d.motivation) setCustomerMotivation(d.motivation);
        if (d.aduType) setAduType(d.aduType);

        // Select the AI-matched unit(s): make the top suggestion the PRIMARY
        // selected floorplan and put the suggestions into the compare set.
        const validSuggested = d.suggestedUnitIds.filter((id) =>
            floorplans.some((fp) => fp._id === id),
        );
        let nextCompareIds = aduCompareIds;
        if (validSuggested.length) {
            const primary = validSuggested[0];
            nextCompareIds = Array.from(
                new Set([...validSuggested, ...aduCompareIds]),
            ).slice(0, Math.max(maxAduComparisons, validSuggested.length));
            // Pre-seat the ref so the "selected floorplan changed" effect doesn't
            // re-derive (and clobber) the compare list we're about to set.
            lastSelectedIdRef.current = primary;
            setFloorplanId(primary);
            setAduCompareIds(nextCompareIds);
            // Make sure the model can show them all if the AI suggested > default.
            if (nextCompareIds.length > maxAduComparisons) {
                adu.updateDefault("maxAduComparisons", nextCompareIds.length);
            }
        }
        if (d.unitSpec) {
            const targetIds = nextCompareIds.length ? nextCompareIds : aduCompareIds;
            if (d.unitSpec.beds != null) {
                const beds = d.unitSpec.beds;
                setBedsByUnitId((prev) => {
                    const n = { ...prev };
                    for (const id of targetIds) n[id] = beds;
                    return n;
                });
            }
            if (d.unitSpec.baths != null) {
                const baths = d.unitSpec.baths;
                setBathsByUnitId((prev) => {
                    const n = { ...prev };
                    for (const id of targetIds) n[id] = baths;
                    return n;
                });
            }
        }
        if (d.financials.owed != null) setOwed(String(d.financials.owed));
        if (d.financials.currentMortgageMonthly != null) {
            setCurrentFirstPmtMonthly(String(d.financials.currentMortgageMonthly));
        }
        if (d.featuredPropertyIds.length) {
            setFeaturedPropertyIds((prev) => Array.from(new Set([...prev, ...d.featuredPropertyIds])));
        }
        if (d.featuredStoryIds.length) {
            setFeaturedStoryIds((prev) => Array.from(new Set([...prev, ...d.featuredStoryIds])));
        }
        applyCostAddersToEstimator(d.costAdders);

        if (prefillProposalId) {
            void fetch(`/api/proposals/${prefillProposalId}/prefill?apply=1`, { method: "POST" }).catch(() => {});
        }
        // Drop the prefill flag so a refresh won't reopen the popup.
        try {
            const u = new URL(window.location.href);
            u.searchParams.delete("prefill");
            window.history.replaceState({}, "", u.toString());
        } catch {
            /* noop */
        }
        setPrefillOpen(false);
        setPrefillStatus("idle");
    }

    // ── Load proposal from `?proposalId=` or `?address=` URL param ───────────
    // Dashboards link "Open →" to /tools/admin/master?address=<key>. We hit
    // the proposal API directly rather than waiting on the bulk
    // `syncFromServer()` pull to finish (which races against this mount
    // effect and would leave the form empty). Falls back to localStorage if
    // the API is unreachable (offline / dev outage). One-shot via a ref so
    // React StrictMode's double-invoke doesn't reload twice.
    const initialUrlLoadRef = React.useRef(false);
    // Gates the debounced autosave until the initial URL-driven load has applied
    // (or been determined to be a blank/new proposal). Prevents the first
    // debounce from persisting half-hydrated state to the DB draft.
    const hydratedRef = React.useRef(false);
    // Set by an ?autoExport=1 deep link; the export runs from an effect once the
    // loaded snapshot has settled into state (buildSnapshot needs settled state).
    const [pendingAutoExport, setPendingAutoExport] = useState(false);
    useEffect(() => {
        if (initialUrlLoadRef.current) return;
        initialUrlLoadRef.current = true;
        if (typeof window === "undefined") return;
        const params = new URLSearchParams(window.location.search);

        // ── Load by proposal id (from "Start estimate") ──────────────────────
        // Takes precedence over ?address=. Hydrates from the proposal's stored
        // snapshot (or seeds name/address for a fresh draft), then arms the
        // consultation→FPA prefill popup when ?prefill=1 and not yet applied.
        const proposalId = params.get("proposalId");
        if (proposalId) {
            const wantPrefill = params.get("prefill") === "1";
            console.info("[prefill] load-by-id", { proposalId, wantPrefill });
            // Always remember the proposal id so the toolbar "AI match" button can
            // (re)run the prefill later, even after it's been applied once.
            setPrefillProposalId(proposalId);
            if (wantPrefill) {
                setPrefillStatus("loading"); // show the banner immediately
            }
            (async () => {
                try {
                    const res = await fetch(`/api/proposals/${encodeURIComponent(proposalId)}`);
                    const data = await res.json().catch(() => ({}));
                    console.info("[prefill] proposal fetch", res.status, {
                        hasSnapshot: !!data?.snapshotJson,
                        prefillAppliedAt: data?.prefillAppliedAt ?? null,
                    });
                    if (!res.ok) {
                        if (wantPrefill) {
                            setPrefillStatus("error");
                            setPrefillError(data?.error || `Couldn't load proposal (HTTP ${res.status})`);
                        }
                        return;
                    }
                    if (data.snapshotJson) {
                        applySnapshot(data.snapshotJson as ProposalSnapshot);
                    } else {
                        if (data.customerName) setCustomerName(data.customerName);
                        if (data.addressKey) setAddress(data.addressKey);
                        hydratedRef.current = true;
                    }
                    if (wantPrefill) {
                        if (data.prefillAppliedAt) {
                            // Already applied — don't reopen; clear the armed state.
                            setPrefillStatus("idle");
                        } else {
                            // Fresh draft with no snapshot: wipe the GLOBAL site-work /
                            // discount localStorage so a previously-open proposal's
                            // estimate doesn't bleed in and override the AI match. (A
                            // snapshot-backed load restores its own companion storage
                            // via applySnapshot, so we only clear the blank-draft case.)
                            if (!data.snapshotJson) {
                                restoreCompanionStorage({
                                    swp_master: null,
                                    swp_custom: null,
                                    dp_master: null,
                                    dp_custom: null,
                                });
                                setSwKey((k) => k + 1); // remount SiteWorkPanel to re-read the cleared state
                            }
                            void loadPrefillPlan(proposalId);
                        }
                    }
                } catch (err) {
                    console.error("[prefill] proposal fetch failed", err);
                    if (wantPrefill) {
                        setPrefillStatus("error");
                        setPrefillError(err instanceof Error ? err.message : String(err));
                    }
                }
            })();
            return;
        }

        const addressKey = params.get("address");
        if (!addressKey) {
            // Brand-new proposal (no URL params): nothing to hydrate, so allow the
            // autosave to run as soon as the rep enters a valid address.
            hydratedRef.current = true;
            return;
        }

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

                // The presenter window now requests current state on connect and
                // the admin replays it (see startAdminResponder / startPresenterSync),
                // so no fixed delay is needed for live present.
                if (autoPresent) {
                    openPresenterWindow("v2");
                }
                // Export reads the persisted payload from the DB by id. Defer to
                // an effect so buildSnapshot runs against settled state, not the
                // pre-applySnapshot render.
                if (autoExport) {
                    setPendingAutoExport(true);
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
            // Whether or not a snapshot was found, hydration is now resolved —
            // applySnapshot already flips this, but set it for the no-snapshot
            // (offline / brand-new address) path too.
            hydratedRef.current = true;
        })();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Run a deep-link ?autoExport once the loaded snapshot has settled into
    // state (so the flushed presenter payload reflects the full proposal).
    useEffect(() => {
        if (!pendingAutoExport) return;
        if (normalizeAddress(address).length < 6) return;
        setPendingAutoExport(false);
        void exportProposalPdf();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [pendingAutoExport, address]);

    // Persist any unsaved edits to the CURRENT proposal before we navigate away.
    // Switching proposals does a full page reload (so no stale React/localStorage
    // state from one client can bleed into the next), which would otherwise drop
    // an in-flight debounced autosave.
    async function flushDraftBeforeLeaving() {
        const key = normalizeAddress(address);
        if (key.length < 6) return; // autosave is disabled below this threshold
        const snap = buildSnapshotRef.current();
        if (snapshotFingerprint(snap) === lastDraftFpRef.current) return; // nothing new
        try {
            await saveDraft(snap);
        } catch {
            /* best-effort; the localStorage mirror inside saveDraft already holds it */
        }
    }

    // Persist the current presenter payload to the proposal row so the by-id
    // present / export routes render a complete, deterministic snapshot from the
    // DB — independent of the live BroadcastChannel.
    async function flushPresenterPayload(proposalId: string) {
        const presenterBroadcast = buildAdminBroadcast(usePresentationStore.getState(), {
            includeCustomFloorplans: true,
        });
        await fetch(`/api/proposals/${proposalId}/presenter-payload`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ presenterBroadcast }),
        });
    }

    // Export reads from the DB by id (not the live broadcast): save the current
    // snapshot + presenter payload, then open the standalone by-id print view.
    // This makes the PDF reflect exactly what's on screen, with no dependency on
    // the admin tab staying open or the broadcast having "warmed up".
    async function exportProposalPdf() {
        const key = normalizeAddress(address);
        if (!key) {
            window.alert("Add a property address before exporting.");
            return;
        }
        try {
            const snap = buildSnapshotRef.current();
            const { id } = await saveDraft(snap);
            // Block the pending autosave from re-saving identical content.
            lastDraftFpRef.current = snapshotFingerprint(snap);
            if (!id) {
                // Couldn't resolve a proposal id — fall back to the live print view.
                window.open(
                    `/present-v2/print?scope=${encodeURIComponent(getCompanionScope())}`,
                    "be_print_v2",
                    "noopener",
                );
                return;
            }
            await flushPresenterPayload(id);
            // Also persist the agreement build inputs so the deck's
            // "Save to Pipedrive" note can list the compared units + totals.
            // (Previously only the Generate-Agreement flow wrote this, so a
            // proposal exported without ever opening the agreement produced a
            // bare note.) Best-effort — never block the export.
            try {
                const agreementInput = buildAgreementInput();
                if (agreementInput) {
                    await fetch(`/api/proposals/${id}/agreement`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ agreementInput }),
                    });
                }
            } catch (err) {
                console.warn("[export] agreement input flush failed", err);
            }
            window.open(`/present-v2/${id}/print`, "be_print_v2", "noopener");
        } catch (err) {
            window.alert(
                `Couldn't prepare the export: ${err instanceof Error ? err.message : String(err)}`,
            );
        }
    }

    // Loading another proposal navigates with a full reload. The mount loader
    // rehydrates from `?address=` (server-first, draft-then-reviewed), and the
    // per-proposal companion scope is re-resolved fresh — so prices/discounts
    // from the previously-open client can never carry over.
    async function handleLoad(addressKey: string) {
        await flushDraftBeforeLeaving();
        window.location.assign(`/tools/admin/master?address=${encodeURIComponent(addressKey)}`);
    }

    async function handleLoadDraft(addressKey: string) {
        await flushDraftBeforeLeaving();
        window.location.assign(`/tools/admin/master?address=${encodeURIComponent(addressKey)}`);
    }

    // Starting a new proposal reloads to the bare URL: a fresh companion scope
    // (new_<uuid>) and a clean React tree, so no prior client's state survives.
    async function handleNew() {
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
        await flushDraftBeforeLeaving();
        window.location.assign("/tools/admin/master");
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
            customerEmail: snap.customerEmail,
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
        // Don't autosave until the initial load has hydrated — otherwise the
        // first debounce could persist half-applied or cross-proposal state.
        if (!hydratedRef.current) return;
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
        address, customerName, customerEmail, owed, propertyPhotoUrl, customerMotivation, aduType,
        floorplanId, currentFirstPmtMonthly,
        aduCompareIds, floorplans,
        adu.defaults, adu.estimatorByAduId, adu.rentByAduId, adu.baseCostByAduId,
        adu.sqftByAduId, adu.discountAmountByAduId, adu.discountLinesByAduId,
        property, avm, rentals, market,
        featuredPropertyIds, featuredStoryIds, featuredRentals, slideOrder,
        projectTimeline, proposalPaymentSchedule, proposalPaymentSchedulesByAduId,
        exclusions,
        activeStep, doneSteps, siteWorkConfirmed,
        companionVersion,
    ]);

    // ── Live agreement handoff ───────────────────────────────────────────────
    // Keep the agreement preview's handoff (HANDOFF_KEY) fresh as the rep edits,
    // so an open preview window picks up changes via its `storage` listener and
    // re-renders live. Debounced; only writes when the proposal is contract-ready
    // (address + at least one payment schedule). A `storage` event only fires in
    // *other* tabs, so this never disturbs the admin tab itself.
    const buildAgreementInputRef = React.useRef(buildAgreementInput);
    buildAgreementInputRef.current = buildAgreementInput;
    useEffect(() => {
        const t = setTimeout(() => {
            try {
                const input = buildAgreementInputRef.current();
                if (!input) return;
                window.localStorage.setItem(
                    "be_agreement_preview_input_v2",
                    JSON.stringify(input),
                );
            } catch { /* quota / serialization issues are non-fatal */ }
        }, 600);
        return () => clearTimeout(t);
    }, [
        address, customerName, aduType, aduCompareIds, floorplans,
        proposalPaymentSchedulesByAduId, agreementAduId,
        adu.activeSnapshotByAduId, adu.discountLinesByAduId,
        exclusions, bedsByUnitId, bathsByUnitId, aduTypeByUnitId,
        companionVersion,
    ]);

    return (
        <div className={styles.appShell}>
            <AdminHeader
                onOpenPresenter={openPresenterWindow}
                onSave={handleSave}
                onOpenSaved={() => setSavedModalOpen(true)}
                onNew={handleNew}
                onExportPdf={() => void exportProposalPdf()}
                onGenerateAgreement={handleGenerateAgreement}
                onAiMatch={
                    prefillProposalId
                        ? () => {
                              setPrefillPlan(null);
                              void loadPrefillPlan(prefillProposalId);
                          }
                        : undefined
                }
                aiMatchBusy={prefillLoading}
                saveDisabled={normalizeAddress(address).length === 0}
                exportDisabled={normalizeAddress(address).length === 0}
                agreementDisabled={normalizeAddress(address).length === 0 || !proposalPaymentSchedule}
                saveStatus={saveStatus}
                draftStatus={draftStatus}
            />
            <SavedProposals
                open={savedModalOpen}
                onClose={() => setSavedModalOpen(false)}
                onLoadProposal={handleLoad}
                onLoadDraft={handleLoadDraft}
            />

            <PrefillStatusBanner
                status={prefillOpen ? "idle" : prefillStatus}
                count={prefillPlan ? prefillCount(prefillPlan) : 0}
                error={prefillError}
                onReview={() => setPrefillOpen(true)}
                onRetry={() => prefillProposalId && loadPrefillPlan(prefillProposalId)}
                onDismiss={() => setPrefillStatus("idle")}
            />

            {prefillOpen && (
                <ProposalPrefillModal
                    key={prefillPlan ? "prefill-ready" : "prefill-loading"}
                    plan={prefillPlan}
                    loading={prefillLoading}
                    customerName={customerName || null}
                    selectedAdus={adu.selectedAdus.map((u) => ({ _id: u._id, name: u.name }))}
                    stories={initialStories.map((s) => ({ id: s._id, name: s.names }))}
                    properties={initialCompletedProperties.map((p) => ({ id: p._id, name: p.name }))}
                    onClose={() => setPrefillOpen(false)}
                    onApply={applyPrefill}
                    onReanalyze={
                        prefillProposalId
                            ? () => {
                                  setPrefillPlan(null);
                                  void loadPrefillPlan(prefillProposalId);
                              }
                            : undefined
                    }
                />
            )}

            <div className={styles.appBody}>
                <StepSidebar
                    activeStep={activeStep}
                    completedSteps={completedSteps}
                    needsInputSteps={needsInputSteps}
                    onStepClick={(n) => setActiveStep(n as StepNum)}
                    onReviewClick={openReviewPanel}
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

                    {/* ── Architect findings (read-only; Phase 4) ──────────── */}
                    <ArchitectFlagsPanel addressKey={normalizeAddress(address)} />

                    {/* ── Step 1 · Who & Where (Details + property-data pull) ── */}
                    <StepCard
                        stepNumber={1}
                        title="Who & Where"
                        {...stepState(1)}
                        kind="data"
                        needsInput={!detailsHasData}
                        needsInputMessage="Enter the property address to continue"
                        doneLabel={loading ? "Pulling property data…" : "Pull property data"}
                        onDone={() => {
                            getApiData({ address, selectedFloorplan });
                            markDone(1);
                        }}
                        completeSummary={address || "No address yet"}
                    >
                        <Step1Body
                            // Customer
                            customerName={customerName}
                            setCustomerName={setCustomerName}
                            customerEmail={customerEmail}
                            setCustomerEmail={setCustomerEmail}
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
                            loading={loading}
                            error={error}
                        />
                    </StepCard>

                    {/* ── Step 2 · Units ────────────────────────────────────── */}
                    <StepCard
                        stepNumber={2}
                        title="Units"
                        {...stepState(2)}
                        kind="data"
                        needsInput={!hasUnits}
                        needsInputMessage="Pick at least one unit to continue"
                        onDone={() => markDone(2)}
                        completeSummary={
                            aduCompareIds.length > 0
                                ? `${aduCompareIds.length} unit${aduCompareIds.length > 1 ? "s" : ""} selected`
                                : "No units selected"
                        }
                    >
                        <UnitsBody
                            floorplans={floorplans}
                            aduCompareIds={aduCompareIds}
                            aduType={aduType}
                            setAduType={setAduType}
                            aduTypeByUnitId={aduTypeByUnitId}
                            setAduTypeByUnitId={setAduTypeByUnitId}
                            bedsByUnitId={bedsByUnitId}
                            setBedsByUnitId={setBedsByUnitId}
                            bathsByUnitId={bathsByUnitId}
                            setBathsByUnitId={setBathsByUnitId}
                            labelByUnitId={labelByUnitId}
                            setLabelByUnitId={setLabelByUnitId}
                            defaults={adu.defaults}
                            updateDefault={adu.updateDefault}
                            toggleAdu={adu.toggleAdu}
                            addCustomFloorplan={addCustomFloorplan}
                            removeCustomFloorplan={removeCustomFloorplan}
                            duplicateFloorplan={duplicateFloorplan}
                            setBaseCostByAduId={adu.setBaseCostByAduId}
                        />
                    </StepCard>

                    {/* ── Step 3 · Site Photo (drives Slide 2) ──────────────── */}
                    <StepCard
                        stepNumber={3}
                        title="Site Photo"
                        {...stepState(3)}
                        kind="data"
                        onDone={() => markDone(3)}
                        completeSummary={propertyPhotoUrl ? "Site photo attached" : "No photo (slide 2 hides the image)"}
                    >
                        <SitePhotoBody
                            propertyPhotoUrl={propertyPhotoUrl}
                            setPropertyPhotoUrl={setPropertyPhotoUrl}
                            address={address}
                        />
                    </StepCard>

                    {/* ── Step 4 · Estimate the Job ─────────────────────────── */}
                    <StepCard
                        stepNumber={4}
                        title="Estimate the Job"
                        {...stepState(4)}
                        kind="data"
                        needsInput={!hasUnits}
                        needsInputMessage="Pick at least one unit in Step 2 before estimating site work"
                        onDone={() => { setSiteWorkConfirmed(true); markDone(4); }}
                        completeSummary="Site work confirmed"
                    >
                        {adu.selectedAdus.length === 0 ? (
                            <div className={sectionStyles.emptyState}>
                                Pick one or more units in Step 2 to enter site-specific work.
                            </div>
                        ) : (
                            <SiteWorkPanel
                                key={`sw-${swKey}`}
                                selectedAdus={adu.selectedAdus}
                                estimatorByAduId={adu.estimatorByAduId}
                                setEstimatorByAduId={adu.setEstimatorByAduId}
                                catalog={initialSiteWorkCatalogData}
                            />
                        )}

                        {/* Exclusions — proposal-wide carve-outs (name + price + note).
                            Shown on the comparison slide as small "Not included" text
                            and listed on the agreement. Lives here so it's set
                            alongside the estimate; styled to stand out. */}
                        <ExclusionsPanel value={exclusions} onChange={setExclusions} />
                    </StepCard>

                    {/* ── Step 5 · Discounts ────────────────────────────────── */}
                    <StepCard
                        stepNumber={5}
                        title="Discounts"
                        {...stepState(5)}
                        kind="data"
                        onDone={() => markDone(5)}
                        completeSummary="Discounts applied"
                    >
                        <DiscountsPanel
                            selectedAdus={adu.selectedAdus}
                            setDiscountAmountByAduId={adu.setDiscountAmountByAduId}
                            setDiscountLinesByAduId={adu.setDiscountLinesByAduId}
                            discountsCatalog={initialDiscountsCatalog}
                            addressKey={normalizeAddress(address)}
                        />
                    </StepCard>

                    {/* ── Step 6 · Rental Market ────────────────────────────── */}
                    <StepCard
                        stepNumber={6}
                        title="Rental Market"
                        {...stepState(6)}
                        kind="review"
                        onDone={() => markDone(6)}
                        completeSummary="Rental market reviewed"
                    >
                        {adu.selectedAdus.length > 0 && (
                            <RentHero
                                units={adu.selectedAdus}
                                rentByAduId={adu.rentByAduId}
                                setRentByAduId={adu.setRentByAduId}
                                rentals={rentals}
                                labelByUnitId={labelByUnitId}
                            />
                        )}
                        <div className={sectionStyles.compsIntro}>
                            <span className={sectionStyles.compsIntroTitle}>Market comps</span>
                            <span className={sectionStyles.compsIntroNote}>
                                Supporting evidence for the rent above
                            </span>
                        </div>
                        <RentalsPanel
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
                            selectedFeatured={featuredRentals}
                            onToggleFeature={toggleFeaturedRental}
                            maxFeatured={MAX_FEATURED_RENTALS}
                        />

                        {/* Featured-rental order + photo editor (merged from the
                            old standalone Feature Rentals step). The comps list
                            above provides the ★ Feature toggles, so the editor's
                            own "Available" column is hidden here. */}
                        {featuredRentals.length > 0 && (
                            <div className={sectionStyles.rentFeaturedEditor}>
                                <div className={sectionStyles.rentFeaturedHead}>
                                    Featured on the presentation · order &amp; photos
                                </div>
                                <FeatureRentalsPanel
                                    rentals={rentals}
                                    selected={featuredRentals}
                                    onChange={setFeaturedRentals}
                                    maxSelected={MAX_FEATURED_RENTALS}
                                    showAvailable={false}
                                />
                            </div>
                        )}
                    </StepCard>

                    {/* ── Step 7 · Project Timeline (Slide 7 source) ────────── */}
                    <StepCard
                        stepNumber={7}
                        title="Project Timeline"
                        {...stepState(7)}
                        kind="data"
                        onDone={() => markDone(7)}
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
                    </StepCard>

                    {/* ── Step 8 · Payment Schedule (drives the contract slide) ── */}
                    <StepCard
                        stepNumber={8}
                        title="Payment Schedule"
                        {...stepState(8)}
                        kind="data"
                        onDone={() => markDone(8)}
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
                    </StepCard>

                    {/* ── Step 9 · Feature Builds (curate Slide 5) ──────────── */}
                    <StepCard
                        stepNumber={9}
                        title="Feature Builds"
                        {...stepState(9)}
                        kind="data"
                        onDone={() => markDone(9)}
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
                    </StepCard>

                    {/* ── Step 10 · Feature Stories (curate Slide 6) ─────────── */}
                    <StepCard
                        stepNumber={10}
                        title="Feature Stories"
                        {...stepState(10)}
                        kind="data"
                        onDone={() => markDone(10)}
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
                    </StepCard>

                    {/* ── Step 11 · Slide Order (drag-and-drop) ─────────────── */}
                    <StepCard
                        stepNumber={11}
                        title="Slide Order"
                        {...stepState(11)}
                        kind="data"
                        onDone={() => markDone(11)}
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
                    </StepCard>

                    {/* ── Review & Generate — pinned control panel (not a step) ──
                        Live, always-available surface: open it anytime to edit
                        policy knobs / regenerate. Collapsed by default; no Done
                        gate, so it never blocks the workflow. */}
                    <section id="review-generate-panel" className={styles.reviewPanel}>
                        <button
                            type="button"
                            className={styles.reviewPanelHeader}
                            onClick={() => setReviewOpen((v) => !v)}
                            aria-expanded={reviewOpen}
                            aria-controls="review-generate-body"
                        >
                            <span className={styles.reviewPanelIcon} aria-hidden>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="12" cy="12" r="3" />
                                    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
                                </svg>
                            </span>
                            <span className={styles.reviewPanelTitleWrap}>
                                <span className={styles.reviewPanelTitle}>Proposal Controls</span>
                                <span className={styles.reviewPanelSub}>
                                    Comparison, financing &amp; live policy knobs · open anytime
                                </span>
                            </span>
                            <span className={styles.reviewPanelChevron} data-open={reviewOpen} aria-hidden>▾</span>
                        </button>

                        {reviewOpen && (
                        <div id="review-generate-body" className={styles.reviewPanelBody}>
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
                        </div>
                        )}
                    </section>


                </main>
            </div>
        </div>
    );
}
