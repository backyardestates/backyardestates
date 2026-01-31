export type MoneyRange = {
    min: number;
    max: number;
    display?: string;
};

export type SiteSpecificItem = {
    title: string;
    status: "unknown" | "might_apply" | "not_apply" | "selected";
    cost?: MoneyRange;
    why?: string;
    verifiedByFpa?: string[];
};

export type OptionalUpgradeItem = {
    selected: boolean;
    title: string;
    cost?: MoneyRange;
};

export type Floorplan = {
    _id: string;
    name: string;
    bed: number;
    bath: number;
    sqft: number;
    price: number;
    drawing?: { url?: string; publicId?: string };
};

export type Brand = {
    brandName?: string | null;
    tagline?: string | null;
    logoUrl?: string | null;
    coverUrl?: string | null;
    processUrls?: string[] | null;
    signatureName?: string | null;
    signatureTitle?: string | null;
};

export type Finance = {
    status?: "secured" | "exploring" | "unsure" | string;
    path?: "cash" | "finance" | string;
    downPayment?: number | null;
    wantsValueBoostAnalysis?: "yes" | "no" | string;
    homeValueEstimate?: number | null;
    mortgageBalance?: number | null;
    ratePct?: number | null;
    termMonths?: number | null;
};

export type RentComp = {
    label?: string; // e.g. "Zillow", "ApartmentList", etc.
    beds?: number;
    baths?: number;
    sqft?: number;
    rentMonthly: number;
    notes?: string;
};

export type RentOutput = {
    estimatedMonthly?: number;     // e.g. 2400
    range?: { min: number; max: number }; // optional
    comps?: RentComp[];
    methodNote?: string;
    disclaimer?: string;
};

export type FeasibilityStoreData = {
    brand?: Brand | null;

    contact: { name: string; phone: string; email: string };
    property: { address: string; city?: string | null };

    project: {
        motivation: string;
        aduType: string;
        bed: number;
        bath: number;
        timeframe?: string | null;
    };

    selections: {
        selectedFloorplanId?: string | null;
        floorplan?: Floorplan | null;
        optionalUpgrades?: Record<string, OptionalUpgradeItem> | null;
        siteSpecific?: Record<string, SiteSpecificItem> | null;
    };

    finance?: Finance | null;

    outputs?: {
        rent?: RentOutput;
        [k: string]: any;
    };

    riskFlags?: string[];

    generatedAt?: string;

    raw?: any;
    assets?: {
        reportAssets?: ReportAssets | null;
        testimonials?: TestimonialStory[];
        comparables?: ComparableProperty[];
    };
};


export type ReportGalleryItem = { title?: string; imageUrl?: string };
export type ReportAssets = {
    brand?: { logoUrl?: string; coverUrl?: string };
    gallery?: ReportGalleryItem[];
};

export type TestimonialStory = {
    names?: string;
    quote?: string;
    wistiaId?: string;
    portraitUrl?: string;
    slug?: string;
    property?: {
        bed?: number;
        bath?: number;
        sqft?: number;
        floorplan?: { name?: string };
        propertySlug?: string;
    };
};

export type ComparableProperty = {
    _id?: string;
    name?: string;
    slug?: string;
    aduType?: string;
    sqft?: number;
    bed?: number;
    bath?: number;
    photos?: { url?: string; publicId?: string } | null;
    floorplan?: { name?: string; bed?: number; bath?: number; sqft?: number; slug?: string };
};