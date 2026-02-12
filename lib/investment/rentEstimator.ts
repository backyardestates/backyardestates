// lib/investment/rentEstimator.ts
import type { RentalListing } from "@/lib/rentcast/types";

type RentComp = {
    price?: number;
    squareFootage?: number;
    bedrooms?: number;
    bathrooms?: number;
};

export type RentEstimateDebug = {
    targetSqft?: number;
    bandPct: number;
    minSqft?: number;
    maxSqft?: number;
    preferClosestN: number; // kept for compatibility (no longer used by this method)
    minComps: number;

    totalListings: number;
    withValidPrice: number;
    withSqftAndPrice: number;
    inBand: number;
    used: number;

    method: "median_top_psf" | "median_all_prices" | "insufficient_data";
    rent?: number;

    usedComps: Array<{
        idx: number;
        price: number;
        sqft?: number;
        bed?: number;
        bath?: number;
        distSqft?: number;
        weight: number; // kept for compatibility
        psf?: number; // price per sqft
    }>;

    notes: string[];
};

function isFiniteNumber(n: any): n is number {
    return typeof n === "number" && Number.isFinite(n);
}

function medianSorted(arr: number[]) {
    const n = arr.length;
    if (!n) return undefined;
    const mid = Math.floor(n / 2);
    return n % 2 ? arr[mid] : (arr[mid - 1] + arr[mid]) / 2;
}

export function estimateRent(
    rentals: RentComp[] | RentalListing[],
    targetSqft?: number,
    opts?: {
        bandPct?: number; // ± percent sqft band, default 0.15
        preferClosestN?: number; // kept for compatibility
        minComps?: number; // minimum comps required for banded approach, default 4
        sqftFallbackBandPct?: number; // if too few comps, widen band, default 0.30
        topN?: number; // number of top comps by $/sf to use, default 5
    }
): { rent?: number; debug: RentEstimateDebug } {
    const bandPct = opts?.bandPct ?? 0.15;
    const preferClosestN = opts?.preferClosestN ?? 12; // not used in this method
    const minComps = opts?.minComps ?? 4;
    const sqftFallbackBandPct = opts?.sqftFallbackBandPct ?? 0.30;
    const topN = opts?.topN ?? 5;

    const debug: RentEstimateDebug = {
        targetSqft,
        bandPct,
        preferClosestN,
        minComps,
        totalListings: rentals.length,
        withValidPrice: 0,
        withSqftAndPrice: 0,
        inBand: 0,
        used: 0,
        method: "insufficient_data",
        usedComps: [],
        notes: [],
    };

    // 1) Collect all valid prices (fallback path)
    const allPrices = rentals
        .map((r: any) => r.price)
        .filter((p: any): p is number => isFiniteNumber(p) && p > 0);

    debug.withValidPrice = allPrices.length;

    if (!allPrices.length) {
        debug.notes.push("No listings with a valid price.");
        return { rent: undefined, debug };
    }

    // If no target sqft, just median of all prices
    if (!isFiniteNumber(targetSqft) || targetSqft <= 0) {
        const sorted = [...allPrices].sort((a, b) => a - b);
        const rent = medianSorted(sorted);
        debug.method = "median_all_prices";
        debug.rent = rent;
        debug.notes.push("No target sqft; using median of all listing prices.");
        return { rent, debug };
    }

    // 2) Build comps with sqft + price
    const comps = (rentals as any[])
        .map((r, idx) => ({
            idx,
            price: r.price,
            sqft: r.squareFootage,
            bed: r.bedrooms,
            bath: r.bathrooms,
        }))
        .filter((c) => isFiniteNumber(c.price) && c.price > 0 && isFiniteNumber(c.sqft) && c.sqft > 0);

    debug.withSqftAndPrice = comps.length;

    const bandFor = (pct: number) => {
        const minSqft = (targetSqft as number) * (1 - pct);
        const maxSqft = (targetSqft as number) * (1 + pct);
        return { minSqft, maxSqft };
    };

    // 3) Filter within sqft band (widen if needed)
    let { minSqft, maxSqft } = bandFor(bandPct);
    debug.minSqft = Math.round(minSqft);
    debug.maxSqft = Math.round(maxSqft);

    let inBand = comps.filter((c) => (c.sqft as number) >= minSqft && (c.sqft as number) <= maxSqft);

    if (inBand.length < minComps) {
        const widened = bandFor(sqftFallbackBandPct);
        const widenedBand = comps.filter((c) => (c.sqft as number) >= widened.minSqft && (c.sqft as number) <= widened.maxSqft);

        if (widenedBand.length >= minComps) {
            minSqft = widened.minSqft;
            maxSqft = widened.maxSqft;
            inBand = widenedBand;

            debug.notes.push(
                `Too few comps in ±${Math.round(bandPct * 100)}% band; widened to ±${Math.round(sqftFallbackBandPct * 100)}%.`
            );
            debug.minSqft = Math.round(minSqft);
            debug.maxSqft = Math.round(maxSqft);
        } else {
            debug.notes.push("Too few sqft-matched comps; falling back to median of all prices.");
            const sorted = [...allPrices].sort((a, b) => a - b);
            const rent = medianSorted(sorted);
            debug.method = "median_all_prices";
            debug.rent = rent;
            return { rent, debug };
        }
    }

    debug.inBand = inBand.length;

    // 4) Rank by highest $/sf inside the sqft band, take top N, then median of their prices.
    const rankedByPsf = inBand
        .map((c) => {
            const sqft = c.sqft as number;
            const price = c.price as number;
            const psf = price / Math.max(1, sqft);
            const distSqft = Math.abs(sqft - (targetSqft as number));
            return { ...c, psf, distSqft };
        })
        .sort((a, b) => b.psf - a.psf)
        .slice(0, Math.max(1, topN));

    debug.used = rankedByPsf.length;

    const pickedPrices = rankedByPsf.map((c) => c.price as number).sort((a, b) => a - b);
    const rent = medianSorted(pickedPrices);

    debug.method = "median_top_psf";
    debug.rent = rent;

    debug.notes.push(`Using top ${Math.max(1, topN)} comps by $/sf within sqft band (then median of their rents).`);

    debug.usedComps = rankedByPsf.map((c) => ({
        idx: c.idx,
        price: c.price as number,
        sqft: c.sqft,
        bed: c.bed,
        bath: c.bath,
        distSqft: c.distSqft,
        weight: 1,
        psf: Number(c.psf.toFixed(4)),
    }));

    return { rent, debug };
}
