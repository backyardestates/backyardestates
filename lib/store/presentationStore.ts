import { create } from "zustand";
import type { Scenario } from "@/lib/investment/types";
import type { RentalListing } from "@/lib/rentcast/types";
import type { PaymentMilestone } from "@/lib/investment/paymentSchedule";
import type { ProposalPaymentSchedule } from "@/lib/investment/proposalPaymentSchedule";

export const SLIDE_COUNT = 15;

// ─── Sanity data types ────────────────────────────────────────────────────────

export type SanityFloorplan = {
    _id: string;
    name: string;
    slug: { current: string };
    sqft: number;
    bed: number;
    bath: number;
    price: number;
    length?: number;
    width?: number;
    orderID?: number;
    videoID?: string;
    floorPlanUrl?: string;
    images?: string[];
    inclusions?: any[]; // Sanity portable text blocks
};

export type SanityStory = {
    _id: string;
    names: string;
    quote?: string;
    purpose?: string;
    wistiaId?: string;
    slug: { current: string };
    featured?: boolean;
    portraitUrl?: string;
    images?: string[];
};

export type SanityProperty = {
    _id: string;
    name: string;
    slug: { current: string };
    sqft?: number;
    bed?: number;
    bath?: number;
    location?: string;
    videoID?: string;
    featured?: boolean;
    thumbnailUrl?: string;
    images?: string[];
    floorplanName?: string;
    floorplanSqft?: number;
};

// ─── Store state ──────────────────────────────────────────────────────────────

export type CustomerMotivation = "family" | "income" | "investment" | null;

export type PresentationState = {
    // Navigation
    currentSlide: number;
    activeUnitId: string | null;
    activeStoryIndex: number;

    // From Step 1 (admin tool)
    customerName: string;
    propertyAddress: string;
    aduType: "detached" | "attached" | "garage" | "";

    // New admin fields
    propertyPhotoUrl: string | null;
    customerMotivation: CustomerMotivation;

    // From Step 2
    comparedUnitIds: string[];

    // From Step 7 — admin-curated order for the Completed Builds gallery (Slide 5).
    // Empty = fall back to Sanity `featured` flag.
    featuredPropertyIds: string[];

    // From Step 8 — admin-curated order for the Customer Stories slide (Slide 6).
    // Empty = fall back to Sanity `featured` flag.
    featuredStoryIds: string[];

    // From Step 9 — admin-curated rental comps to highlight on Slide 10.
    // Each item is a RentalListing with an optional manually-pasted imageUrl.
    // Empty = fall back to first N entries of rentalComps.
    featuredRentals: FeaturedRental[];

    // From Step 10 — custom slide order for the presenter. Each entry is an
    // original slide number (1..SLIDE_COUNT). Empty = use natural 1..N order.
    slideOrder: number[];

    // From Step 11 — admin-entered timeline (BE + city day counts per phase),
    // surfaced on Slide 7. `null` = fall back to CITY_TIMELINES lookup by address.
    projectTimeline: ProjectTimeline | null;

    // From Step 12 — admin-tuned payment schedule for the proposal contract.
    // Replaces the auto-computed `paymentSchedules` map for the dedicated
    // Payment Schedule slide. `null` until an ADU is selected in Step 12.
    proposalPaymentSchedule: ProposalPaymentSchedule | null;

    // From buildScenarios()
    scenarios: Scenario[];

    // From Step 5
    rentalComps: RentalListing[];
    rentByUnitId: Record<string, number>;

    // Payment schedules (keyed by scenario.key)
    paymentSchedules: Record<string, PaymentMilestone[]>;

    // Site work tag labels per unit (names only, for quick display)
    siteWorkTagsByUnitId: Record<string, string[]>;
    // Site work line items per unit (with costs, for slide 3 cards)
    siteWorkByUnitId: Record<string, SiteWorkLineItem[]>;
    // Discount line items per unit (named discounts with amounts)
    discountLinesByUnitId: Record<string, DiscountLineItem[]>;

    // Presenter controls
    isPresenting: boolean;
    galleryPaused: boolean;

    // Story selection
    selectedStory: SanityStory | null;
    storyOverridden: boolean;

    // Sanity data (fetched on /present load)
    floorplans: SanityFloorplan[];
    stories: SanityStory[];
    completedProperties: SanityProperty[];

    // Actions
    setSlide: (n: number) => void;
    nextSlide: () => void;
    prevSlide: () => void;
    setActiveUnit: (id: string | null) => void;
    setActiveStoryIndex: (i: number) => void;
    setIsPresenting: (v: boolean) => void;
    setGalleryPaused: (v: boolean) => void;
    toggleGalleryPaused: () => void;
    setSelectedStory: (s: SanityStory | null) => void;
    setStoryOverridden: (v: boolean) => void;
    syncFromAdmin: (data: Partial<AdminBroadcast>) => void;
    setSanityData: (data: { floorplans?: SanityFloorplan[]; stories?: SanityStory[]; completedProperties?: SanityProperty[] }) => void;
    reset: () => void;
};

// ─── Site work line item (serializable subset of ActiveLineItem) ──────────────

export type SiteWorkLineItem = {
    label: string;
    category: string;
    total: number; // customerTotal
};

// ─── Discount line item ───────────────────────────────────────────────────────

export type DiscountLineItem = {
    label: string;
    amount: number;
};

// ─── Project timeline (Step 11 — Slide 7) ────────────────────────────────────

/** Day counts per phase. */
export type TimelineDays = {
    plans: number;
    permits: number;
    build: number;
};

/** Both columns shown on Slide 7's comparison panel. */
export type ProjectTimeline = {
    be: TimelineDays;
    city: TimelineDays;
};

/** Defaults seeded into the admin tool on first load. BE counts mirror the
 *  CITY_TIMELINES default; city counts are reasonable industry averages
 *  (4 / 6 / 9 months expressed in days). */
export const DEFAULT_PROJECT_TIMELINE: ProjectTimeline = {
    be:   { plans: 25,  permits: 130, build: 40  },
    city: { plans: 120, permits: 180, build: 270 },
};

// ─── Featured rental (curated for Slide 10) ───────────────────────────────────

export type FeaturedRental = {
    formattedAddress?: string;
    price?: number;
    bedrooms?: number;
    bathrooms?: number;
    squareFootage?: number;
    propertyType?: string;
    listedDate?: string;
    lastSeenDate?: string;
    /** Manually pasted image URL (e.g. from Zillow). Optional. */
    imageUrl?: string;
};

// ─── What the admin broadcasts (subset of state) ──────────────────────────────

export type AdminBroadcast = {
    customerName: string;
    propertyAddress: string;
    aduType: "detached" | "attached" | "garage" | "";
    propertyPhotoUrl: string | null;
    customerMotivation: CustomerMotivation;
    comparedUnitIds: string[];
    // Admin-added units (id starts with "custom_") — merged into the presenter's
    // floorplans list so custom comparisons render alongside Sanity units.
    customFloorplans: SanityFloorplan[];
    featuredPropertyIds: string[];
    featuredStoryIds: string[];
    featuredRentals: FeaturedRental[];
    slideOrder: number[];
    projectTimeline: ProjectTimeline | null;
    proposalPaymentSchedule: ProposalPaymentSchedule | null;
    scenarios: Scenario[];
    rentalComps: RentalListing[];
    rentByUnitId: Record<string, number>;
    paymentSchedules: Record<string, PaymentMilestone[]>;
    siteWorkTagsByUnitId: Record<string, string[]>;
    siteWorkByUnitId: Record<string, SiteWorkLineItem[]>;
    discountLinesByUnitId: Record<string, DiscountLineItem[]>;
};

// ─── Initial data ─────────────────────────────────────────────────────────────

const initialData = {
    currentSlide: 1,
    activeUnitId: null,
    activeStoryIndex: 0,
    customerName: "",
    propertyAddress: "",
    aduType: "" as const,
    propertyPhotoUrl: null,
    customerMotivation: null as CustomerMotivation,
    comparedUnitIds: [],
    featuredPropertyIds: [],
    featuredStoryIds: [],
    featuredRentals: [],
    slideOrder: [],
    projectTimeline: null as ProjectTimeline | null,
    proposalPaymentSchedule: null as ProposalPaymentSchedule | null,
    scenarios: [],
    rentalComps: [],
    rentByUnitId: {},
    paymentSchedules: {},
    siteWorkTagsByUnitId: {},
    siteWorkByUnitId: {},
    discountLinesByUnitId: {},
    isPresenting: false,
    galleryPaused: false,
    selectedStory: null,
    storyOverridden: false,
    floorplans: [],
    stories: [],
    completedProperties: [],
};

// ─── Store ────────────────────────────────────────────────────────────────────

export const usePresentationStore = create<PresentationState>()((set, get) => ({
    ...initialData,

    setSlide: (n) =>
        set({ currentSlide: Math.max(1, Math.min(SLIDE_COUNT, n)) }),

    nextSlide: () =>
        set((s) => ({ currentSlide: Math.min(SLIDE_COUNT, s.currentSlide + 1) })),

    prevSlide: () =>
        set((s) => ({ currentSlide: Math.max(1, s.currentSlide - 1) })),

    setActiveUnit: (id) => set({ activeUnitId: id }),

    setActiveStoryIndex: (i) => set({ activeStoryIndex: i }),

    setIsPresenting: (v) => set({ isPresenting: v }),

    setGalleryPaused: (v) => set({ galleryPaused: v }),

    toggleGalleryPaused: () => set((s) => ({ galleryPaused: !s.galleryPaused })),

    setSelectedStory: (s) => set({ selectedStory: s }),

    setStoryOverridden: (v) => set({ storyOverridden: v }),

    syncFromAdmin: (data) => set((state) => {
        // Strip out customFloorplans before bulk-setting; we merge it manually
        // into the floorplans list so Sanity units are preserved alongside
        // admin-added ones.
        const { customFloorplans, ...rest } = data as Partial<AdminBroadcast>;
        const next: any = { ...rest };
        if (customFloorplans !== undefined) {
            const sanityOnly = state.floorplans.filter(
                (fp) => !fp._id.startsWith("custom_")
            );
            next.floorplans = [...sanityOnly, ...customFloorplans];
        }
        return next;
    }),

    setSanityData: ({ floorplans, stories, completedProperties }) =>
        set({
            ...(floorplans !== undefined ? { floorplans } : {}),
            ...(stories !== undefined ? { stories } : {}),
            ...(completedProperties !== undefined ? { completedProperties } : {}),
        }),

    reset: () => set(initialData),
}));
