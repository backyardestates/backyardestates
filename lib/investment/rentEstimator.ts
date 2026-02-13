// lib/investment/rentEstimatorPremium.ts
import type { RentalListing } from "@/lib/rentcast/types";
import type { RentcastMarketStats } from "@/hooks/rentcast/useRentcastData";

type RentComp = {
    price?: number;
    squareFootage?: number;
    bedrooms?: number;
    bathrooms?: number;
};

export type RentEstimateDebug = {
    targetSqft: number;
    targetBeds?: number;
    targetBaths?: number;

    estateKey: string;
    estateOrderIndex: number;
    estateOrderCount: number;
    tOrder: number;

    bandLabel: string;
    minSqft: number;
    maxSqft: number;

    totalListings: number;
    withSqftAndPrice: number;
    inBand: number;

    startEstateKey: string;
    endEstateKey: string;
    startBandLabel: string;
    endBandLabel: string;

    startTopComp?: number;
    endTopComp?: number;

    ladderTopBeforeDiscount?: number;
    discountFromTopRate: number;

    finalRent?: number;

    method: "manual_ladder_from_anchors" | "fallback_market" | "insufficient_data";
    notes: string[];

    anchorEvidence: {
        startBandCount: number;
        endBandCount: number;
        startBandMax?: { idx: number; price: number; sqft: number };
        endBandMax?: { idx: number; price: number; sqft: number };
    };

    ladderPreview?: Array<{ key: string; rent: number }>;

    marketMedianRpsf?: number;
    marketMaxRpsf?: number;
    marketMedianRent?: number;
    marketMaxRent?: number;
};

type SimpleComp = { idx: number; price: number; sqft: number };

function isFiniteNumber(n: any): n is number {
    return typeof n === "number" && Number.isFinite(n);
}

function clamp(n: number, min: number, max: number) {
    return Math.max(min, Math.min(max, n));
}

/**
 * Your existing floorplan bands (kept)
 */
export function floorplanBandForSqft(targetSqft: number) {
    const bands: Array<{ min: number; max: number; label: string }> = [
        { min: 300, max: 380, label: "300–380 (350 band)" },
        { min: 360, max: 440, label: "360–440 (400 band)" },
        { min: 410, max: 500, label: "410–500 (450 band)" },
        { min: 460, max: 560, label: "460–560 (500 band)" },
        { min: 540, max: 680, label: "540–680 (600 band)" },
        { min: 680, max: 820, label: "680–820 (750 band)" },
        { min: 740, max: 880, label: "740–880 (800 band)" },
        { min: 860, max: 1050, label: "860–1050 (950 band)" },
        { min: 1050, max: 1350, label: "1050–1350 (1200 band)" },
    ];

    const best =
        bands
            .map((b) => ({
                ...b,
                center: (b.min + b.max) / 2,
                dist: Math.abs((b.min + b.max) / 2 - targetSqft),
            }))
            .sort((a, b) => a.dist - b.dist)[0] ?? bands[0];

    return { minSqft: best.min, maxSqft: best.max, label: best.label };
}

function getMarketBaselines(market?: RentcastMarketStats | null, targetBeds?: number) {
    const rental = market?.rentalData;
    if (!rental) return {};

    const byBeds = (rental as any).dataByBedrooms ?? [];
    const match = isFiniteNumber(targetBeds)
        ? byBeds.find((x: any) => x.bedrooms === targetBeds)
        : undefined;

    const medianRent = match?.medianRent ?? rental.medianRent;
    const medianRpsf = match?.medianRentPerSquareFoot ?? rental.medianRentPerSquareFoot;

    const maxRent = match?.maxRent ?? rental.maxRent;
    const maxRpsf = match?.maxRentPerSquareFoot ?? rental.maxRentPerSquareFoot;

    return {
        marketMedianRent: isFiniteNumber(medianRent) ? medianRent : undefined,
        marketMedianRpsf: isFiniteNumber(medianRpsf) ? medianRpsf : undefined,
        marketMaxRent: isFiniteNumber(maxRent) ? maxRent : undefined,
        marketMaxRpsf: isFiniteNumber(maxRpsf) ? maxRpsf : undefined,
    };
}

function pickNumber(...vals: any[]): number | undefined {
    for (const v of vals) {
        const n = typeof v === "string" ? Number(v) : v;
        if (typeof n === "number" && Number.isFinite(n)) return n;
    }
    return undefined;
}

function getListingPrice(r: any): number | undefined {
    return pickNumber(r.price, r.rent, r.listPrice, r.monthlyRent, r.rentPrice);
}

function getListingSqft(r: any): number | undefined {
    return pickNumber(r.squareFootage, r.sqft, r.livingArea, r.buildingArea, r.area);
}

/**
 * Anchor picker:
 * - Start from the closest band to targetSqft
 * - Walk downwards (for small anchor) or upwards (for large anchor)
 * - Return the max price comp in the first band that has comps
 */
function pickAnchorFromNearestBand(
    comps: SimpleComp[],
    targetSqft: number,
    direction: "down" | "up"
): { top?: number; bandLabel: string; bandCount: number; maxComp?: SimpleComp } {
    const bands: Array<{ min: number; max: number; label: string; center: number }> = [
        { min: 300, max: 380, label: "300–380 (350 band)", center: 340 },
        { min: 360, max: 440, label: "360–440 (400 band)", center: 400 },
        { min: 410, max: 500, label: "410–500 (450 band)", center: 455 },
        { min: 460, max: 560, label: "460–560 (500 band)", center: 510 },
        { min: 540, max: 680, label: "540–680 (600 band)", center: 610 },
        { min: 680, max: 820, label: "680–820 (750 band)", center: 750 },
        { min: 740, max: 880, label: "740–880 (800 band)", center: 810 },
        { min: 860, max: 1050, label: "860–1050 (950 band)", center: 955 },
        { min: 1050, max: 1350, label: "1050–1350 (1200 band)", center: 1200 },
    ];

    const startIdx =
        bands
            .map((b, i) => ({ i, d: Math.abs(b.center - targetSqft) }))
            .sort((a, b) => a.d - b.d)[0]?.i ?? 0;

    // Build a list of indices to check:
    // 1) check outward in the preferred direction
    // 2) then check outward in the opposite direction
    const preferredStep = direction === "down" ? -1 : 1;
    const oppositeStep = -preferredStep;

    const indicesToCheck: number[] = [];

    // Preferred direction sweep
    for (let i = startIdx; i >= 0 && i < bands.length; i += preferredStep) {
        indicesToCheck.push(i);
    }

    // Opposite direction sweep (starting one step away so we don't duplicate startIdx)
    for (let i = startIdx + oppositeStep; i >= 0 && i < bands.length; i += oppositeStep) {
        indicesToCheck.push(i);
    }

    for (const i of indicesToCheck) {
        const b = bands[i];
        const inBand = comps.filter((c) => c.sqft >= b.min && c.sqft <= b.max);
        if (inBand.length) {
            const maxComp = inBand.reduce((best, cur) => (cur.price > best.price ? cur : best));
            return { top: maxComp.price, bandLabel: b.label, bandCount: inBand.length, maxComp };
        }
    }

    // No comps in any band at all
    const fallbackBand = bands[startIdx];
    return { top: undefined, bandLabel: fallbackBand.label, bandCount: 0, maxComp: undefined };
}
/**
 * ✅ Manual ladder estimator (two-anchor, estate-order driven)
 */
export function estimateRent(
    rentals: RentComp[] | RentalListing[],
    input: {
        targetSqft: number;
        targetBeds?: number;
        targetBaths?: number;

        estatesOrdered: Array<{
            key: string;
            sqft: number;
            beds?: number;
            baths?: number;
        }>;

        estateKey: string;
        market?: RentcastMarketStats | null;

        discountFromTopRate?: number; // default 0.03
        derivedTopUpliftFromMedian?: number; // default 0.35
        ladderPreviewCount?: number; // default 0
    }
): { rent?: number; debug: RentEstimateDebug } {
    const discountRate = input.discountFromTopRate ?? 0.03;
    const discountMultiplier = 1 - discountRate;
    const derivedTopUpliftFromMedian = input.derivedTopUpliftFromMedian ?? 0.35;
    const ladderPreviewCount = input.ladderPreviewCount ?? 0;

    const estates = input.estatesOrdered ?? [];
    const estateCount = estates.length;

    const targetBand = floorplanBandForSqft(input.targetSqft);

    const debug: RentEstimateDebug = {
        targetSqft: input.targetSqft,
        targetBeds: input.targetBeds,
        targetBaths: input.targetBaths,

        estateKey: input.estateKey,
        estateOrderIndex: 0,
        estateOrderCount: Math.max(1, estateCount),
        tOrder: 0,

        bandLabel: targetBand.label,
        minSqft: targetBand.minSqft,
        maxSqft: targetBand.maxSqft,

        totalListings: rentals.length,
        withSqftAndPrice: 0,
        inBand: 0,

        startEstateKey: estates[0]?.key ?? "start",
        endEstateKey: estates[estateCount - 1]?.key ?? "end",
        startBandLabel: "",
        endBandLabel: "",

        discountFromTopRate: discountRate,

        method: "insufficient_data",
        notes: [],

        anchorEvidence: {
            startBandCount: 0,
            endBandCount: 0,
        },
    };

    if (!isFiniteNumber(input.targetSqft) || input.targetSqft <= 0) {
        debug.notes.push("Missing/invalid targetSqft.");
        return { rent: undefined, debug };
    }

    if (estateCount < 2) {
        debug.notes.push("Need at least 2 estatesOrdered entries to build ladder.");
        return { rent: undefined, debug };
    }

    // Estate index (fallback to closest sqft if key mismatch)
    const rawIdx = estates.findIndex((e) => e.key === input.estateKey);
    const estateIdx =
        rawIdx >= 0
            ? rawIdx
            : estates
                .map((e, i) => ({ i, d: Math.abs((e.sqft ?? 0) - input.targetSqft) }))
                .sort((a, b) => a.d - b.d)[0]?.i ?? 0;

    debug.estateOrderIndex = estateIdx;
    debug.estateOrderCount = estateCount;
    debug.tOrder = estateCount <= 1 ? 0 : clamp(estateIdx / (estateCount - 1), 0, 1);

    if (rawIdx < 0) {
        debug.notes.push(`estateKey "${input.estateKey}" not found; used closest sqft index ${estateIdx}.`);
    }

    // ✅ Normalize comps robustly (works across rentcast shapes)
    const comps: SimpleComp[] = (rentals as any[])
        .map((r, idx) => {
            const price = getListingPrice(r);
            const sqft = getListingSqft(r);
            return { idx, price, sqft };
        })
        .filter((c) => isFiniteNumber(c.price) && (c.price as number) > 0 && isFiniteNumber(c.sqft) && (c.sqft as number) > 0)
        .map((c) => ({ idx: c.idx, price: c.price as number, sqft: c.sqft as number }));

    debug.withSqftAndPrice = comps.length;

    debug.inBand = comps.filter((c) => c.sqft >= targetBand.minSqft && c.sqft <= targetBand.maxSqft).length;

    debug.notes.push(`Normalized comps: ${comps.length}/${rentals.length} have price+sqft.`);

    // Market baselines in-scope ✅
    const { marketMedianRent, marketMedianRpsf, marketMaxRent, marketMaxRpsf } = getMarketBaselines(
        input.market,
        input.targetBeds
    );

    debug.marketMedianRent = marketMedianRent;
    debug.marketMedianRpsf = marketMedianRpsf;
    debug.marketMaxRent = marketMaxRent;
    debug.marketMaxRpsf = marketMaxRpsf;

    // Anchor estates
    const startEstate = estates[0];
    const endEstate = estates[estateCount - 1];

    // ✅ nearest-available anchor comps (prevents empty 350/1200 bands from killing estimate)
    const startAnchorPick = pickAnchorFromNearestBand(comps, startEstate.sqft, "down");
    const endAnchorPick = pickAnchorFromNearestBand(comps, endEstate.sqft, "up");



    debug.startBandLabel = startAnchorPick.bandLabel;
    debug.endBandLabel = endAnchorPick.bandLabel;

    debug.anchorEvidence.startBandCount = startAnchorPick.bandCount;
    debug.anchorEvidence.endBandCount = endAnchorPick.bandCount;

    debug.anchorEvidence.startBandMax = startAnchorPick.maxComp
        ? { idx: startAnchorPick.maxComp.idx, price: startAnchorPick.maxComp.price, sqft: startAnchorPick.maxComp.sqft }
        : undefined;

    debug.anchorEvidence.endBandMax = endAnchorPick.maxComp
        ? { idx: endAnchorPick.maxComp.idx, price: endAnchorPick.maxComp.price, sqft: endAnchorPick.maxComp.sqft }
        : undefined;

    debug.startTopComp = startAnchorPick.top;
    debug.endTopComp = endAnchorPick.top;



    let startAnchor = startAnchorPick.top;
    let endAnchor = endAnchorPick.top;

    debug.notes.push(
        `Anchor pick: start=${debug.startTopComp ?? "none"} (${debug.startBandLabel}, n=${debug.anchorEvidence.startBandCount}) ` +
        `end=${debug.endTopComp ?? "none"} (${debug.endBandLabel}, n=${debug.anchorEvidence.endBandCount}).`
    );

    // Fallback to market if either anchor missing
    if (!isFiniteNumber(startAnchor) || !isFiniteNumber(endAnchor)) {
        debug.notes.push("Missing anchor comp(s); falling back to market stats to synthesize anchors.");

        if (isFiniteNumber(marketMaxRpsf)) {
            startAnchor = marketMaxRpsf * startEstate.sqft;
            endAnchor = marketMaxRpsf * endEstate.sqft;
            debug.method = "fallback_market";
            debug.notes.push("Used marketMaxRentPerSquareFoot for both anchors.");
        } else if (isFiniteNumber(marketMedianRpsf)) {
            const topRpsf = marketMedianRpsf * (1 + derivedTopUpliftFromMedian);
            startAnchor = topRpsf * startEstate.sqft;
            endAnchor = topRpsf * endEstate.sqft;
            debug.method = "fallback_market";
            debug.notes.push(
                `Used marketMedianRentPerSquareFoot (+${Math.round(derivedTopUpliftFromMedian * 100)}%) for anchors.`
            );
        } else if (isFiniteNumber(marketMaxRent)) {
            startAnchor = marketMaxRent * 0.75;
            endAnchor = marketMaxRent;
            debug.method = "fallback_market";
            debug.notes.push("Used marketMaxRent as end anchor and 75% of it as start anchor.");
        }
    } else {
        debug.method = "manual_ladder_from_anchors";
    }

    // Manual ladder by estate ORDER
    const t = debug.tOrder;

    if (!isFiniteNumber(startAnchor) || !isFiniteNumber(endAnchor)) {
        debug.notes.push("Unable to calculate rent: missing both anchor values.");
        return { rent: undefined, debug };
    }

    const ladderTopBeforeDiscount = startAnchor + t * (endAnchor - startAnchor);
    debug.ladderTopBeforeDiscount = ladderTopBeforeDiscount;

    const final = ladderTopBeforeDiscount * discountMultiplier;
    debug.finalRent = final;
    // Preview ladder
    if (ladderPreviewCount > 0) {
        const N = estates.length;
        const preview: Array<{ key: string; rent: number }> = [];
        const step = Math.max(1, Math.floor(N / ladderPreviewCount));

        for (let i = 0; i < N; i += step) {
            const tt = N <= 1 ? 0 : i / (N - 1);
            const top = startAnchor + tt * (endAnchor - startAnchor);
            preview.push({ key: estates[i].key, rent: Math.round(top * discountMultiplier) });
            if (preview.length >= ladderPreviewCount) break;
        }

        if (preview[preview.length - 1]?.key !== estates[N - 1].key) {
            preview.push({ key: estates[N - 1].key, rent: Math.round(endAnchor * discountMultiplier) });
        }

        debug.ladderPreview = preview;
    }

    debug.notes.push(
        `Manual ladder: start=${Math.round(startAnchor)} end=${Math.round(endAnchor)} tOrder=${t.toFixed(3)} discount=${(
            discountRate * 100
        ).toFixed(1)}%.`
    );

    return { rent: final, debug };
}
