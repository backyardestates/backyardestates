// lib/investment/rentDebug.ts
export type RentDebugUI = {
    label: string;                 // one line summary for formula row
    method: string;                // e.g. "premium_rpsf_band"
    targetSqft?: number;

    band?: { label: string; minSqft?: number; maxSqft?: number };

    counts?: {
        totalListings?: number;
        withSqftAndPrice?: number;
        inBand?: number;
        used?: number;
    };

    values?: {
        baseRpsf?: number;
        baseRent?: number;
        finalRent?: number;
        marketMedianRent?: number;
        marketMedianRpsf?: number;
        guardrailCap?: number;
        bathAdj?: number;
        bedAdj?: number;
    };

    notes?: string[];

    comps?: Array<{
        price: number;
        sqft?: number;
        bed?: number;
        bath?: number;
        metricLabel?: string;  // "rpsf" or "psf"
        metricValue?: number;  // rpsf/psf
    }>;
};