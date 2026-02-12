"use client";

import React, { useMemo, useState } from "react";
import styles from "./InvestmentModelTable.module.css";

type Floorplan = {
    _id: string;
    name: string;
    sqft: number;
    price: number;
};

type PropertyRecord = {
    city?: string;
    state?: string;
    squareFootage?: number;
    lotSize?: number;
    yearBuilt?: number;
    lastSalePrice?: number;
};

type AvmValue = {
    price?: number;
    priceRangeLow?: number;
    priceRangeHigh?: number;
    subjectProperty?: {
        city?: string;
        state?: string;
        squareFootage?: number;
        lotSize?: number;
        yearBuilt?: number;
        lastSalePrice?: number;
    };
};

type RentalListing = {
    price?: number;
    squareFootage?: number;
    bedrooms?: number;
    bathrooms?: number;
};

type Money = number;

function asNumber(v: any): number | undefined {
    const n = typeof v === "string" ? Number(v.replace(/[^0-9.]/g, "")) : Number(v);
    return Number.isFinite(n) ? n : undefined;
}

function money(n?: number) {
    if (typeof n !== "number" || !Number.isFinite(n)) return "—";
    return n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}

function num(n?: number) {
    if (typeof n !== "number" || !Number.isFinite(n)) return "—";
    return n.toLocaleString("en-US");
}

function pct(n?: number) {
    if (typeof n !== "number" || !Number.isFinite(n)) return "—";
    return `${(n * 100).toFixed(2)}%`;
}

function pmt(annualRate: number, termYears: number, principal: number) {
    const r = annualRate / 12;
    const n = termYears * 12;
    if (!Number.isFinite(principal) || principal <= 0) return 0;
    if (r === 0) return principal / n;
    return (principal * r) / (1 - Math.pow(1 + r, -n));
}

function median(nums: number[]) {
    const arr = nums.filter((n) => Number.isFinite(n)).sort((a, b) => a - b);
    if (!arr.length) return undefined;
    const mid = Math.floor(arr.length / 2);
    return arr.length % 2 ? arr[mid] : (arr[mid - 1] + arr[mid]) / 2;
}

function clamp(n: number, min: number, max: number) {
    return Math.max(min, Math.min(max, n));
}

type Defaults = {
    downPaymentRateHouse: number;
    downPaymentRateAdu: number;
    interestRate: number;
    termYears: number;
    effectiveTaxRate: number;
    propertyTaxDiscountAdu: number;
    maintenanceAnnualHouse: number;
    maintenanceAnnualAdu: number;
    insuranceAnnualHouse: number;
    insuranceAnnualAdu: number;
    rentGrowthYoY: number;
    equityPremium: number;
    capRateHouse: number;
    capRateAdu: number;
    equityGrowthAnnual: number;
    remodelCostHouse: number;

    // debug / model knobs
    noiExpenseRatio: number; // used for NOI: NOI = rentAnnual * (1 - expenseRatio)
    maxAduComparisons: number; // UI guard
};

const DEFAULTS: Defaults = {
    downPaymentRateHouse: 0.2,
    downPaymentRateAdu: 0.0,
    interestRate: 0.065,
    termYears: 30,
    effectiveTaxRate: 0.0122,
    propertyTaxDiscountAdu: 0.5,
    maintenanceAnnualHouse: 6000,
    maintenanceAnnualAdu: 500,
    insuranceAnnualHouse: 2400,
    insuranceAnnualAdu: 300,
    rentGrowthYoY: 0.03,
    equityPremium: 0.3,
    capRateHouse: 0.0528,
    capRateAdu: 0.07,
    equityGrowthAnnual: 0.04,
    remodelCostHouse: 50000,

    noiExpenseRatio: 0.2,
    maxAduComparisons: 3,
};

type DebugSource = "input" | "api" | "calc";

type Debug = Record<
    string,
    {
        value: React.ReactNode;
        formula: string;
        parts: Array<[string, React.ReactNode, DebugSource?]>;
    }
>;


type Scenario = {
    key: string;
    title: string;
    kind: "house" | "adu";

    sqft?: number;
    rentMonthly?: Money;
    purchasePrice?: Money;
    remodelCost?: Money;

    downPaymentRate: number;
    interestRate: number;
    termYears: number;

    effectiveTaxRate: number;
    propertyTaxDiscount: number;

    maintenanceAnnual: Money;
    insuranceAnnual: Money;

    rentGrowthYoY: number;
    capRate: number;
    equityPremium: number;
    equityGrowthAnnual: number;

    // derived
    downPayment: Money;
    loanAmount: Money;
    mtgPaymentMonthly: Money;
    effectiveTaxAnnual: Money;
    propertyTaxMonthly: Money;
    insuranceMonthly: Money;
    maintenanceMonthly: Money;
    monthlyCost: Money;
    cashflowMonthly: Money;
    cashflowAnnual: Money;
    outOfPocket: Money;

    noiAnnual: Money;
    sqftValue: Money;
    incomeValue: Money;
    premiumValue: Money;

    year1EquityBoost: Money;
    year5EquityBoost: Money;
    year10EquityBoost: Money;

    roi: number | null;

    debug: Debug;
};
type RentComp = {
    price?: number;
    squareFootage?: number;
    bedrooms?: number;
    bathrooms?: number;
};

type RentEstimateDebug = {
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

    method:
    | "median_top_psf"          // ✅ NEW
    | "median_all_prices"
    | "insufficient_data";
    rent?: number;

    usedComps: Array<{
        idx: number;
        price: number;
        sqft?: number;
        bed?: number;
        bath?: number;
        distSqft?: number;
        weight: number; // kept for compatibility
        psf?: number;   // ✅ NEW (price per sqft)
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

// Weighted median: value where cumulative weight crosses 50% of total weight.
// Expects entries sorted by value ASC.
function weightedMedian(sorted: Array<{ value: number; weight: number }>) {
    const total = sorted.reduce((s, x) => s + x.weight, 0);
    if (total <= 0) return undefined;
    const half = total / 2;
    let cum = 0;
    for (const x of sorted) {
        cum += x.weight;
        if (cum >= half) return x.value;
    }
    return sorted[sorted.length - 1]?.value;
}

export function estimateRent(
    rentals: RentComp[],
    targetSqft?: number,
    opts?: {
        bandPct?: number; // ± percent sqft band, default 0.15
        preferClosestN?: number; // kept for compatibility
        minComps?: number; // minimum comps required for banded approach, default 4
        sqftFallbackBandPct?: number; // if too few comps, widen band, default 0.30
        topN?: number; // ✅ number of top comps by $/sf to use, default 5
    }
): { rent?: number; debug: RentEstimateDebug } {
    const bandPct = opts?.bandPct ?? 0.15;
    const preferClosestN = opts?.preferClosestN ?? 12; // (not used in this method)
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
        .map((r) => r.price)
        .filter((p): p is number => isFiniteNumber(p) && p > 0);

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
    const comps = rentals
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
        const minSqft = targetSqft * (1 - pct);
        const maxSqft = targetSqft * (1 + pct);
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

    // ✅ 4) NEW METHOD:
    // Rank by highest $/sf inside the sqft band, take top N, then median of their prices.
    const rankedByPsf = inBand
        .map((c) => {
            const sqft = c.sqft as number;
            const price = c.price as number;
            const psf = price / Math.max(1, sqft);
            const distSqft = Math.abs(sqft - targetSqft);
            return { ...c, psf, distSqft };
        })
        .sort((a, b) => b.psf - a.psf)
        .slice(0, Math.max(1, topN));

    debug.used = rankedByPsf.length;

    const pickedPrices = rankedByPsf.map((c) => c.price as number).sort((a, b) => a - b);
    const rent = medianSorted(pickedPrices);

    debug.method = "median_top_psf";
    debug.rent = rent;

    debug.notes.push(
        `Using top ${Math.max(1, topN)} comps by $/sf within sqft band (then median of their rents).`
    );

    debug.usedComps = rankedByPsf.map((c) => ({
        idx: c.idx,
        price: c.price as number,
        sqft: c.sqft,
        bed: c.bed,
        bath: c.bath,
        distSqft: c.distSqft,
        weight: 1, // not used here, kept for compatibility
        psf: Number(c.psf.toFixed(4)),
    }));

    return { rent, debug };
}

function calcScenarioBase(input: {
    key: string;
    title: string;
    kind: "house" | "adu";
    sqft?: number;
    rentMonthly?: Money;
    purchasePrice?: Money;
    remodelCost?: Money;
    downPaymentRate: number;
    interestRate: number;
    termYears: number;
    effectiveTaxRate: number;
    propertyTaxDiscount: number; // 0 for house, 0.5 for "50% discount"
    maintenanceAnnual: Money;
    insuranceAnnual: Money;
    rentGrowthYoY: number;
    capRate: number;            // e.g. 0.07
    equityPremium: number;      // e.g. 0.30
    equityGrowthAnnual: number; // e.g. 0.04
    noiExpenseRatio: number;    // e.g. 0.20

    rentEstimateDebug?: RentEstimateDebug;

    basePropertyValue?: number;
    basePropertySqft?: number;
}): Scenario {
    const purchase = input.purchasePrice ?? 0;
    const remodel = input.remodelCost ?? 0;

    const downPayment = purchase * input.downPaymentRate;
    const loanAmount = Math.max(0, purchase - downPayment);
    const mtgPaymentMonthly = pmt(input.interestRate, input.termYears, loanAmount);

    // ✅ TAX FIX (annual first, then /12)
    const discountFactor = 1 - (input.propertyTaxDiscount ?? 0); // 0.5 discount => factor 0.5
    const effectiveTaxAnnual = purchase * input.effectiveTaxRate * discountFactor;
    const propertyTaxMonthly = effectiveTaxAnnual / 12;

    const insuranceMonthly = (input.insuranceAnnual ?? 0) / 12;
    const maintenanceMonthly = (input.maintenanceAnnual ?? 0) / 12;

    const monthlyCost = mtgPaymentMonthly + propertyTaxMonthly + insuranceMonthly + maintenanceMonthly;

    const rent = input.rentMonthly ?? 0;
    const cashflowMonthly = rent - monthlyCost;
    const cashflowAnnual = cashflowMonthly * 12;
    const rentAnnual = rent * 12;

    const outOfPocket = downPayment + remodel;
    const roi = rentAnnual / purchase;

    // -----------------------------
    // ✅ EQUITY (your sheet style)
    // -----------------------------

    // NOI = rentAnnual × (1 - expenseRatio)
    const noiAnnual = rentAnnual * (1 - input.noiExpenseRatio);




    // SF approach equity = (propertyValue / propertySqft) * aduSqft
    const propertyValue = input.basePropertyValue ?? 0;
    const propertySqft = input.basePropertySqft ?? 0;
    const aduSqft = input.sqft ?? 0;

    // Income approach equity 
    const incomeApproachEquity = rentAnnual / 0.07;

    const sfApproachEquity = (propertyValue / propertySqft) * aduSqft;

    // Premium approach equity 
    const premiumApproachEquity = propertyValue * (input.equityPremium ?? 0);

    // Year1 equity boost = average of the three approaches
    const year1EquityBoost =
        (incomeApproachEquity + sfApproachEquity + premiumApproachEquity) / 3;

    // Growth: Year5 = Year1*(1+g)^4, Year10 = Year1*(1+g)^9
    const g = 1 + input.equityGrowthAnnual;
    const year5EquityBoost = year1EquityBoost * Math.pow(g, 4);
    const year10EquityBoost = year5EquityBoost * Math.pow(g, 9);
    const rentDbg = input.rentEstimateDebug;
    const debug: Debug = {
        purchasePrice: {
            value: money(input.purchasePrice),
            formula: "purchasePrice",
            parts: [
                ["purchasePrice", money(input.purchasePrice), input.kind === "house" ? "api" : "input"],
            ],
        },
        downPayment: {
            value: money(downPayment),
            formula: "downPayment = purchasePrice × downPaymentRate",
            parts: [
                ["purchasePrice", money(purchase), "api"],
                ["downPaymentRate", pct(input.downPaymentRate), "input"],
                ["downPayment", money(downPayment), "calc"],
            ],
        },
        loanAmount: {
            value: money(loanAmount),
            formula: "loanAmount = purchasePrice − downPayment",
            parts: [
                ["purchasePrice", money(purchase), "api"],
                ["downPayment", money(downPayment), "calc"],
                ["loanAmount", money(loanAmount), "calc"],
            ],
        },
        mtgPaymentMonthly: {
            value: money(mtgPaymentMonthly),
            formula: "mtgPayment = PMT(rate/12, termYears×12, loanAmount)",
            parts: [
                ["interestRate", pct(input.interestRate), "input"],
                ["termYears", String(input.termYears), "input"],
                ["loanAmount", money(loanAmount), "calc"],
                ["mtgPaymentMonthly", money(mtgPaymentMonthly), "calc"],
            ],
        },

        // ✅ updated tax debug to match corrected math
        effectiveTaxAnnual: {
            value: money(effectiveTaxAnnual),
            formula: "taxAnnual = purchase × taxRate × (1 − discount)",
            parts: [
                ["purchasePrice", money(purchase), "api"],
                ["effectiveTaxRate", pct(input.effectiveTaxRate), "input"],
                ["propertyTaxDiscount", pct(input.propertyTaxDiscount), "input"],
                ["discountFactor", pct(discountFactor), "calc"],
                ["effectiveTaxAnnual", money(effectiveTaxAnnual), "calc"],
            ],
        },
        propertyTaxMonthly: {
            value: money(propertyTaxMonthly),
            formula: "taxMonthly = taxAnnual / 12",
            parts: [
                ["taxAnnual", money(effectiveTaxAnnual), "calc"],
                ["taxMonthly", money(propertyTaxMonthly), "calc"],
            ],
        },

        insuranceMonthly: {
            value: money(insuranceMonthly),
            formula: "insuranceMonthly = insuranceAnnual / 12",
            parts: [
                ["insuranceAnnual", money(input.insuranceAnnual), "input"],
                ["insuranceMonthly", money(insuranceMonthly), "calc"],
            ],
        },
        maintenanceMonthly: {
            value: money(maintenanceMonthly),
            formula: "maintenanceMonthly = maintenanceAnnual / 12",
            parts: [
                ["maintenanceAnnual", money(input.maintenanceAnnual), "input"],
                ["maintenanceMonthly", money(maintenanceMonthly), "calc"],
            ],
        },
        monthlyCost: {
            value: money(monthlyCost),
            formula: "monthlyCost = mtg + tax + insurance + maintenance",
            parts: [
                ["mtgPaymentMonthly", money(mtgPaymentMonthly), "calc"],
                ["propertyTaxMonthly", money(propertyTaxMonthly), "calc"],
                ["insuranceMonthly", money(insuranceMonthly), "calc"],
                ["maintenanceMonthly", money(maintenanceMonthly), "calc"],
                ["monthlyCost", money(monthlyCost), "calc"],
            ],
        },
        cashflowMonthly: {
            value: money(cashflowMonthly),
            formula: "cashflowMonthly = rentMonthly − monthlyCost",
            parts: [
                ["rentMonthly", money(rent), "calc"],
                ["monthlyCost", money(monthlyCost), "calc"],
                ["cashflowMonthly", money(cashflowMonthly), "calc"],
            ],
        },
        cashflowAnnual: {
            value: money(cashflowAnnual),
            formula: "cashflowAnnual = cashflowMonthly × 12",
            parts: [
                ["cashflowMonthly", money(cashflowMonthly), "calc"],
                ["cashflowAnnual", money(cashflowAnnual), "calc"],
            ],
        },
        outOfPocket: {
            value: money(outOfPocket),
            formula: "outOfPocket = downPayment + remodelCost",
            parts: [
                ["downPayment", money(downPayment), "calc"],          // ✅ calc
                ["remodelCost", money(remodel), input.kind === "house" ? "input" : "calc"],
                ["outOfPocket", money(outOfPocket), "calc"],
            ],
        },

        // ✅ equity debug that matches sheet math
        sqftValue: {
            value: money(sfApproachEquity),
            formula: "SF approach = (mainHome / sqft) x ADU sqft",
            parts: [
                ["mainHome", money(propertyValue), "api"],
                ["sqft", input.basePropertySqft, "api"],
                ["aduSqft", input.sqft, "input"],
            ],
        },
        incomeValue: {
            value: money(incomeApproachEquity),
            formula: "Income approach = rentalYr / 0.07",
            parts: [
                ["rentalYr", money(rentAnnual), "calc"],
            ],
        },
        premiumValue: {
            value: money(premiumApproachEquity),
            formula: "Premium approach = propertyValue × equityPremium",
            parts: [
                ["propertyValue", money(propertyValue), "api"],
                ["equityPremium", pct(input.equityPremium), "input"],
            ],
        },

        roi: {
            value: roi == null ? "—" : pct(roi),
            formula: "ROI = rent * 12 / purchase",
            parts: [
                ["rentAnnual", money(rentAnnual), "calc"],
                ["outOfPocket", money(outOfPocket), "calc"],
                ["roi", roi == null ? "—" : pct(roi), "calc"],
            ],
        },
        year1EquityBoost: {
            value: money(year1EquityBoost),
            formula: "Year1 = avg(IncomeApproach, SFApproach, PremiumApproach)",
            parts: [
                ["IncomeApproach", money(incomeApproachEquity), "calc"],
                ["SFApproach", money(sfApproachEquity), "calc"],
                ["PremiumApproach", money(premiumApproachEquity), "calc"],
                ["Year1", money(year1EquityBoost), "calc"],
            ],
        },
        year5EquityBoost: {
            value: money(year5EquityBoost),
            formula: "Year5 = Year1 × (1 + growth)^(5−1)",
            parts: [
                ["Year1", money(year1EquityBoost), "calc"],
                ["growth", pct(input.equityGrowthAnnual), "input"],
                ["power", "6", "calc"],
                ["Year5", money(year5EquityBoost), "calc"],
            ],
        },
        year10EquityBoost: {
            value: money(year10EquityBoost),
            formula: "Year10 = Year1 × (1 + growth)^(10−1)",
            parts: [
                ["Year5", money(year5EquityBoost), "calc"],
                ["growth", pct(input.equityGrowthAnnual), "input"],
                ["power", "6", "calc"],
                ["Year10", money(year10EquityBoost), "calc"],
            ],
        },
        rentMonthly: {
            value: money(input.rentMonthly),
            formula: rentDbg
                ? `Rent = ${rentDbg.method} (target ${rentDbg.targetSqft ?? "—"} sqft, band ±${Math.round(rentDbg.bandPct * 100)}%, used ${rentDbg.used})`
                : "Rent = (no estimator debug)",
            parts: [
                ["targetSqft", rentDbg?.targetSqft ?? "—", "calc"],
                ["band", rentDbg ? `±${Math.round(rentDbg.bandPct * 100)}%` : "—", "calc"],
                ["minSqft", rentDbg?.minSqft ?? "—", "calc"],
                ["maxSqft", rentDbg?.maxSqft ?? "—", "calc"],
                ["totalListings", rentDbg?.totalListings ?? "—", "api"],
                ["validPrice", rentDbg?.withValidPrice ?? "—", "calc"],
                ["sqft+price", rentDbg?.withSqftAndPrice ?? "—", "calc"],
                ["inBand", rentDbg?.inBand ?? "—", "calc"],
                ["used", rentDbg?.used ?? "—", "calc"],
                ["rentMonthly", money(input.rentMonthly), "calc"],
                ...(rentDbg?.notes?.length
                    ? [["notes", rentDbg.notes.join(" • ")] as [string, React.ReactNode]]
                    : []),
                // show the first 5 comps used
                ...(rentDbg?.usedComps?.slice(0, 5).map((c, i) => {
                    const label = `comp${i + 1}`;
                    const val = `${money(c.price)} • ${c.sqft ?? "—"}sf • Δ${c.distSqft ?? "—"} • w=${c.weight}`;
                    return [label, val] as [string, React.ReactNode];
                }) ?? []),
            ],
        }
    };

    return {
        key: input.key,
        title: input.title,
        kind: input.kind,
        sqft: input.sqft,
        rentMonthly: input.rentMonthly,
        purchasePrice: input.purchasePrice,
        remodelCost: input.remodelCost,

        downPaymentRate: input.downPaymentRate,
        interestRate: input.interestRate,
        termYears: input.termYears,

        effectiveTaxRate: input.effectiveTaxRate,
        propertyTaxDiscount: input.propertyTaxDiscount,

        maintenanceAnnual: input.maintenanceAnnual,
        insuranceAnnual: input.insuranceAnnual,

        rentGrowthYoY: input.rentGrowthYoY,
        capRate: input.capRate,
        equityPremium: input.equityPremium,
        equityGrowthAnnual: input.equityGrowthAnnual,

        downPayment,
        loanAmount,
        mtgPaymentMonthly,
        effectiveTaxAnnual,
        propertyTaxMonthly,
        insuranceMonthly,
        maintenanceMonthly,
        monthlyCost,
        cashflowMonthly,
        cashflowAnnual,
        outOfPocket,

        noiAnnual,
        sqftValue: sfApproachEquity,
        incomeValue: incomeApproachEquity,   // keep your field names
        premiumValue: premiumApproachEquity, // keep your field names

        year1EquityBoost,
        year5EquityBoost,
        year10EquityBoost,

        roi,
        debug,
    };
}

type RowSpec = {
    type: "section" | "spacer" | "row";
    label?: string;
    field?: keyof Debug;
    render?: (s: Scenario) => React.ReactNode;

    // ✅ allow per-scenario source
    source?: DebugSource | ((s: Scenario) => DebugSource);
};

export function InvestmentModelTable({
    property,
    avm,
    rentals,
    owed,
    selectedFloorplan,
    allFloorplans,
    defaults: defaultsProp,
}: {
    property: PropertyRecord | null;
    avm: AvmValue | null;
    rentals: RentalListing[];
    owed: string;
    selectedFloorplan: Floorplan | null;
    allFloorplans: Floorplan[]; // pass your full sanity list here
    defaults?: Partial<Defaults>;
}) {
    const owedNum = useMemo(() => asNumber(owed) ?? 0, [owed]);

    const subjectSqft = avm?.subjectProperty?.squareFootage ?? property?.squareFootage ?? undefined;

    const housePrice =
        avm?.price ??
        avm?.priceRangeHigh ??
        avm?.priceRangeLow ??
        property?.lastSalePrice ??
        undefined;

    const rentalMedian = useMemo(() => {
        const rents = rentals.map((r) => r.price).filter((v): v is number => typeof v === "number");
        return median(rents);
    }, [rentals]);

    // Default “house rent estimate” based on ADU median rent scaled by sqft ratio
    const houseRentEstimate = useMemo(() => {
        if (!rentalMedian || !subjectSqft || !selectedFloorplan?.sqft) return undefined;
        const ratio = clamp(subjectSqft / selectedFloorplan.sqft, 1.2, 2.2);
        return rentalMedian * ratio;
    }, [rentalMedian, subjectSqft, selectedFloorplan?.sqft]);

    // ---- UI state: editable defaults + ADU selection + debug toggle
    const [showDebug, setShowDebug] = useState(true);

    const [defaults, setDefaults] = useState<Defaults>({
        ...DEFAULTS,
        ...(defaultsProp ?? {}),
    });

    // Pick ADUs to compare (by floorplan id)
    const [aduCompareIds, setAduCompareIds] = useState<string[]>(() => {
        // seed with selectedFloorplan + 2 nearest sqft options
        const seed: string[] = [];
        if (selectedFloorplan?._id) seed.push(selectedFloorplan._id);

        const sortedByNearest =
            selectedFloorplan
                ? [...allFloorplans]
                    .filter((fp) => fp._id !== selectedFloorplan._id)
                    .sort((a, b) => Math.abs(a.sqft - selectedFloorplan.sqft) - Math.abs(b.sqft - selectedFloorplan.sqft))
                : [];

        for (const fp of sortedByNearest.slice(0, Math.max(0, defaults.maxAduComparisons - seed.length))) {
            seed.push(fp._id);
        }
        return seed.slice(0, defaults.maxAduComparisons);
    });

    const selectedAdus = useMemo(() => {
        const map = new Map(allFloorplans.map((f) => [f._id, f]));
        return aduCompareIds.map((id) => map.get(id)).filter(Boolean) as Floorplan[];
    }, [aduCompareIds, allFloorplans]);

    const houseRentDbg: RentEstimateDebug = {
        targetSqft: subjectSqft,
        bandPct: 0,
        minComps: 0,
        preferClosestN: 0,
        totalListings: rentals.length,
        withValidPrice: rentals.filter(r => typeof r.price === "number").length,
        withSqftAndPrice: rentals.filter(r => typeof r.price === "number" && typeof r.squareFootage === "number").length,
        inBand: 0,
        used: 0,
        method: "median_all_prices",
        rent: houseRentEstimate,
        usedComps: [],
        notes: [
            "House rent is estimated by scaling ADU median rent by sqft ratio (clamped).",
            `houseRent = aduMedian × clamp(houseSqft/aduSqft, 1.2, 2.2)`,
        ],
    };

    const scenarios = useMemo<Scenario[]>(() => {
        const out: Scenario[] = [];

        // HOUSE
        out.push(
            calcScenarioBase({
                key: "house",
                title: "Main Residence",
                kind: "house",
                sqft: subjectSqft,
                rentMonthly: houseRentEstimate,
                purchasePrice: housePrice,
                remodelCost: defaults.remodelCostHouse,

                downPaymentRate: defaults.downPaymentRateHouse,
                interestRate: defaults.interestRate,
                termYears: defaults.termYears,
                effectiveTaxRate: defaults.effectiveTaxRate,
                propertyTaxDiscount: 0,

                maintenanceAnnual: defaults.maintenanceAnnualHouse,
                insuranceAnnual: defaults.insuranceAnnualHouse,

                rentGrowthYoY: defaults.rentGrowthYoY,
                capRate: defaults.capRateHouse,
                equityPremium: 0,
                equityGrowthAnnual: defaults.equityGrowthAnnual,

                noiExpenseRatio: defaults.noiExpenseRatio,

                basePropertyValue: housePrice ?? 0,
                basePropertySqft: subjectSqft ?? 0,

                rentEstimateDebug: houseRentDbg,
            })
        );

        // ADUs chosen
        for (const fp of selectedAdus) {
            const rentEst = estimateRent(rentals, fp.sqft, {
                bandPct: 0.15,
                preferClosestN: 12,
                minComps: 4,
                sqftFallbackBandPct: 0.30,
            });

            const aduRent = rentEst.rent;

            out.push(
                calcScenarioBase({
                    key: `adu_${fp._id}`,
                    title: `ADU — ${fp.name} (${fp.sqft} SF)`,
                    kind: "adu",
                    sqft: fp.sqft,
                    rentMonthly: rentEst.rent,
                    purchasePrice: fp.price,
                    remodelCost: 0,

                    downPaymentRate: defaults.downPaymentRateAdu,
                    interestRate: defaults.interestRate,
                    termYears: defaults.termYears,
                    effectiveTaxRate: defaults.effectiveTaxRate,
                    propertyTaxDiscount: defaults.propertyTaxDiscountAdu,

                    maintenanceAnnual: defaults.maintenanceAnnualAdu,
                    insuranceAnnual: defaults.insuranceAnnualAdu,

                    rentGrowthYoY: defaults.rentGrowthYoY,
                    capRate: defaults.capRateAdu,
                    equityPremium: defaults.equityPremium,
                    equityGrowthAnnual: defaults.equityGrowthAnnual,

                    noiExpenseRatio: defaults.noiExpenseRatio,

                    // ✅ pass base property info for SF + premium approaches
                    basePropertyValue: housePrice ?? 0,
                    basePropertySqft: subjectSqft ?? 0,

                    // ✅ attach rent debug (this is the big win)
                    rentEstimateDebug: rentEst.debug,
                })
            );
        }

        return out;
    }, [
        defaults,
        housePrice,
        houseRentEstimate,
        rentals,
        selectedAdus,
        subjectSqft,
    ]);

    const columns = useMemo(() => scenarios.map((s) => ({ key: s.key, title: s.title, sqft: s.sqft })), [scenarios]);

    const rows = useMemo<RowSpec[]>(
        () => [
            // { type: "section", label: "Assumptions" },

            // // SF comes from API for house (avm/property), and from input for ADU (floorplan sqft)
            // {
            //     type: "row", label: "SF", render: (s) => (s.sqft ? num(s.sqft) : "—"),
            //     source: (s) => (s.kind === "house" ? "api" : "input")
            // },

            // // Rent is computed from rentals comps (api), but the number shown is an estimate => calc
            // {
            //     type: "row", label: "Rental Rate", field: "rentMonthly", render: (s) => money(s.rentMonthly),
            //     source: "calc"
            // },

            // // Cost to Buy:
            // // - house: AVM / last sale => api
            // // - adu: floorplan price => input
            // {
            //     type: "row", label: "Cost to Buy", field: "purchasePrice", render: (s) => money(s.purchasePrice),
            //     source: (s) => (s.kind === "house" ? "api" : "input")
            // },

            // // Remodel:
            // // - house: defaults knob => input
            // // - adu: hardcoded 0 (model assumption) => calc (or input if you want it treated like a knob)
            // {
            //     type: "row", label: "Remodel Cost?", render: (s) => money(s.remodelCost),
            //     source: (s) => (s.kind === "house" ? "input" : "calc")
            // },

            // // These are assumption knobs (inputs)
            // { type: "row", label: "Down Payment", render: (s) => pct(s.downPaymentRate), source: "input" },
            // { type: "row", label: "Interest Rate", render: (s) => pct(s.interestRate), source: "input" },
            // { type: "row", label: "Term length", render: (s) => String(s.termYears), source: "input" },
            // { type: "row", label: "Effective Tax Rate", render: (s) => pct(s.effectiveTaxRate), source: "input" },

            // // Discount is a knob for ADU; house shows NA
            // {
            //     type: "row", label: "Property Tax Discount",
            //     render: (s) => (s.kind === "house" ? "NA" : pct(s.propertyTaxDiscount)),
            //     source: (s) => (s.kind === "house" ? "calc" : "input")
            // },

            // { type: "row", label: "Annual Maintenance", render: (s) => money(s.maintenanceAnnual), source: "input" },
            // { type: "row", label: "Annual Insurance", render: (s) => money(s.insuranceAnnual), source: "input" },

            // // global knob
            // { type: "row", label: "NOI Expense Ratio", render: () => pct(defaults.noiExpenseRatio), source: "input" },

            // { type: "spacer" },

            { type: "section", label: "Output" },

            // Derived outputs
            {
                type: "row", label: "Purchase Price", field: "purchasePrice", render: (s) => money(s.purchasePrice),
                source: (s) => (s.kind === "house" ? "api" : "input")
            },

            { type: "row", label: "Down Payment", field: "downPayment", render: (s) => money(s.downPayment), source: "calc" },
            { type: "row", label: "Loan Amount", field: "loanAmount", render: (s) => money(s.loanAmount), source: "calc" },

            {
                type: "row", label: "Remodel", render: (s) => money(s.remodelCost),
                source: (s) => (s.kind === "house" ? "input" : "calc")
            },

            { type: "row", label: "Cost out of Pocket", field: "outOfPocket", render: (s) => money(s.outOfPocket), source: "calc" },

            { type: "spacer" },

            { type: "row", label: "Mtg Payment", field: "mtgPaymentMonthly", render: (s) => money(s.mtgPaymentMonthly), source: "calc" },
            { type: "row", label: "Property Tax", field: "propertyTaxMonthly", render: (s) => money(s.propertyTaxMonthly), source: "calc" },
            { type: "row", label: "Insurance", field: "insuranceMonthly", render: (s) => money(s.insuranceMonthly), source: "calc" },
            { type: "row", label: "Maintenance", field: "maintenanceMonthly", render: (s) => money(s.maintenanceMonthly), source: "calc" },
            { type: "row", label: "Monthly Cost", field: "monthlyCost", render: (s) => money(s.monthlyCost), source: "calc" },

            { type: "spacer" },

            { type: "row", label: "Rent", render: (s) => money(s.rentMonthly), source: "calc" },
            { type: "row", label: "Cashflow", field: "cashflowMonthly", render: (s) => money(s.cashflowMonthly), source: "calc" },
            { type: "row", label: "Annual", field: "cashflowAnnual", render: (s) => money(s.cashflowAnnual), source: "calc" },

            { type: "spacer" },

            { type: "section", label: "Equity (Income → Premium → Sqft)" },

            // Equity outputs are computed
            {
                type: "row", label: "Sqft Approach", field: "sqftValue",
                render: (s) => (s.kind === "house" ? "—" : money(s.sqftValue)), source: "calc"
            },

            {
                type: "row", label: "Income Value", field: "incomeValue",
                render: (s) => (s.kind === "house" ? "—" : money(s.incomeValue)), source: "calc"
            },

            {
                type: "row", label: "Premium Value", field: "premiumValue",
                render: (s) => (s.kind === "house" ? "—" : money(s.premiumValue)), source: "calc"
            },

            {
                type: "row", label: "Year 1", field: "year1EquityBoost",
                render: (s) => (s.kind === "house" ? "—" : money(s.year1EquityBoost)), source: "calc"
            },

            {
                type: "row", label: "Year 5", field: "year5EquityBoost",
                render: (s) => (s.kind === "house" ? "—" : money(s.year5EquityBoost)), source: "calc"
            },

            {
                type: "row", label: "Year 10", field: "year10EquityBoost",
                render: (s) => (s.kind === "house" ? "—" : money(s.year10EquityBoost)), source: "calc"
            },

            { type: "spacer" },

            { type: "row", label: "ROI", field: "roi", render: (s) => (s.roi == null ? "—" : pct(s.roi)), source: "calc" },

            { type: "spacer" },
        ],
        [defaults.noiExpenseRatio]
    );

    function toggleAdu(id: string) {
        setAduCompareIds((prev) => {
            const exists = prev.includes(id);
            if (exists) return prev.filter((x) => x !== id);

            // enforce max comparisons
            if (prev.length >= defaults.maxAduComparisons) return prev; // ignore click
            return [...prev, id];
        });
    }

    function updateDefault<K extends keyof Defaults>(key: K, next: Defaults[K]) {
        setDefaults((d) => ({ ...d, [key]: next }));
    }

    return (
        <div className={styles.wrap}>
            <div className={styles.topBar}>
                <div>
                    <div className={styles.kicker}>Model</div>
                    <h3 className={styles.title}>Investment Table</h3>
                    <p className={styles.subtitle}>
                        Compare House vs selected ADU floorplans. Toggle debug to see per-cell formulas and inputs.
                    </p>
                    <div className={styles.legend}>
                        <span className={`${styles.legendItem} ${styles.srcInput}`}>Inputs</span>
                        <span className={`${styles.legendItem} ${styles.srcApi}`}>From API</span>
                        <span className={`${styles.legendItem} ${styles.srcCalc}`}>Calculated</span>
                    </div>
                </div>

                <div className={styles.topActions}>
                    <label className={styles.toggle}>
                        <input
                            type="checkbox"
                            checked={showDebug}
                            onChange={(e) => setShowDebug(e.target.checked)}
                        />
                        <span>Show debug</span>
                    </label>
                </div>
            </div>

            {/* Controls */}
            <div className={styles.controls}>
                <div className={styles.controlCard}>
                    <div className={styles.controlTitle}>Compare ADUs</div>
                    <div className={styles.controlSub}>
                        Pick up to {defaults.maxAduComparisons} floorplans to compare.
                    </div>
                    <Field label="Max ADU Comparisons">
                        <NumberInput value={defaults.maxAduComparisons} onChange={(v) => updateDefault("maxAduComparisons", Math.max(1, Math.round(v)))} step={1} />
                    </Field>

                    <div className={styles.fpList}>
                        {allFloorplans.map((fp) => {
                            const checked = aduCompareIds.includes(fp._id);
                            const disabled = !checked && aduCompareIds.length >= defaults.maxAduComparisons;

                            return (
                                <label key={fp._id} className={`${styles.fpItem} ${disabled ? styles.fpDisabled : ""}`}>
                                    <input
                                        type="checkbox"
                                        checked={checked}
                                        disabled={disabled}
                                        onChange={() => toggleAdu(fp._id)}
                                    />
                                    <div className={styles.fpMeta}>
                                        <div className={styles.fpName}>{fp.name}</div>
                                        <div className={styles.fpSub}>
                                            {num(fp.sqft)} SF • {money(fp.price)}
                                        </div>
                                    </div>
                                </label>
                            );
                        })}
                    </div>

                    {aduCompareIds.length === 0 ? (
                        <div className={styles.warn}>Select at least 1 ADU to compare.</div>
                    ) : null}
                </div>
                <div className={styles.controlCard}>
                    <div className={styles.controlTitle}>Assumptions</div>
                    <div className={styles.controlSub}>Edit any default and the table updates instantly.</div>

                    <div className={styles.assumptionGrid}>
                        <Field label="Interest Rate" hint="Annual (e.g. 0.065)">
                            <NumberInput value={defaults.interestRate} onChange={(v) => updateDefault("interestRate", v)} step={0.0005} />
                        </Field>

                        <Field label="Term Years">
                            <NumberInput value={defaults.termYears} onChange={(v) => updateDefault("termYears", v)} step={1} />
                        </Field>

                        <Field label="Tax Rate" hint="Annual (e.g. 0.0122)">
                            <NumberInput value={defaults.effectiveTaxRate} onChange={(v) => updateDefault("effectiveTaxRate", v)} step={0.0001} />
                        </Field>

                        <Field label="ADU Tax Discount" hint="0.50 = 50%">
                            <NumberInput value={defaults.propertyTaxDiscountAdu} onChange={(v) => updateDefault("propertyTaxDiscountAdu", v)} step={0.01} />
                        </Field>

                        <Field label="House Down Payment" hint="0.20 = 20%">
                            <NumberInput value={defaults.downPaymentRateHouse} onChange={(v) => updateDefault("downPaymentRateHouse", v)} step={0.01} />
                        </Field>

                        <Field label="ADU Down Payment">
                            <NumberInput value={defaults.downPaymentRateAdu} onChange={(v) => updateDefault("downPaymentRateAdu", v)} step={0.01} />
                        </Field>

                        <Field label="House Maintenance (Annual)">
                            <NumberInput value={defaults.maintenanceAnnualHouse} onChange={(v) => updateDefault("maintenanceAnnualHouse", v)} step={100} />
                        </Field>

                        <Field label="ADU Maintenance (Annual)">
                            <NumberInput value={defaults.maintenanceAnnualAdu} onChange={(v) => updateDefault("maintenanceAnnualAdu", v)} step={50} />
                        </Field>

                        <Field label="House Insurance (Annual)">
                            <NumberInput value={defaults.insuranceAnnualHouse} onChange={(v) => updateDefault("insuranceAnnualHouse", v)} step={50} />
                        </Field>

                        <Field label="ADU Insurance (Annual)">
                            <NumberInput value={defaults.insuranceAnnualAdu} onChange={(v) => updateDefault("insuranceAnnualAdu", v)} step={25} />
                        </Field>

                        <Field label="NOI Expense Ratio" hint="0.20 = 20%">
                            <NumberInput value={defaults.noiExpenseRatio} onChange={(v) => updateDefault("noiExpenseRatio", v)} step={0.01} />
                        </Field>

                        <Field label="ADU Cap Rate">
                            <NumberInput value={defaults.capRateAdu} onChange={(v) => updateDefault("capRateAdu", v)} step={0.001} />
                        </Field>

                        <Field label="House Cap Rate">
                            <NumberInput value={defaults.capRateHouse} onChange={(v) => updateDefault("capRateHouse", v)} step={0.001} />
                        </Field>

                        <Field label="Equity Premium" hint="0.30 = 30%">
                            <NumberInput value={defaults.equityPremium} onChange={(v) => updateDefault("equityPremium", v)} step={0.01} />
                        </Field>

                        <Field label="Equity Growth (Annual)">
                            <NumberInput value={defaults.equityGrowthAnnual} onChange={(v) => updateDefault("equityGrowthAnnual", v)} step={0.005} />
                        </Field>

                        <Field label="House Remodel Cost">
                            <NumberInput value={defaults.remodelCostHouse} onChange={(v) => updateDefault("remodelCostHouse", v)} step={1000} />
                        </Field>


                    </div>

                    <div className={styles.assumptionActions}>
                        <button
                            type="button"
                            className={styles.reset}
                            onClick={() => setDefaults({ ...DEFAULTS, ...(defaultsProp ?? {}) })}
                        >
                            Reset to defaults
                        </button>
                    </div>
                </div>


            </div>

            {/* Table */}
            <div className={styles.tableWrap}>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th className={styles.thLeft}> </th>
                            {columns.map((c) => (
                                <th key={c.key} className={styles.th}>
                                    <div className={styles.colTitle}>{c.title}</div>
                                </th>
                            ))}
                        </tr>
                    </thead>

                    <tbody>
                        {rows.map((row, idx) => {
                            if (row.type === "section") {
                                return (
                                    <tr key={`sec-${idx}`}>
                                        <td className={styles.section} colSpan={columns.length + 1}>
                                            {row.label}
                                        </td>
                                    </tr>
                                );
                            }

                            if (row.type === "spacer") {
                                return (
                                    <tr key={`sp-${idx}`}>
                                        <td className={styles.spacer} colSpan={columns.length + 1} />
                                    </tr>
                                );
                            }

                            return (
                                <tr key={`r-${idx}`}>
                                    <td className={styles.tdLeft}>{row.label}</td>

                                    {scenarios.map((s) => {
                                        const main = row.render ? row.render(s) : "—";
                                        const dbg = row.field ? s.debug[row.field] : null;
                                        const src = typeof row.source === "function" ? row.source(s) : row.source;

                                        const srcClass =
                                            src === "input" ? styles.srcInput :
                                                src === "api" ? styles.srcApi :
                                                    src === "calc" ? styles.srcCalc :
                                                        styles.srcNeutral;

                                        return (
                                            <td key={`${row.label}-${s.key}`} className={styles.td}>
                                                <div className={`${styles.cellValue} ${styles.badgeValue} ${srcClass}`}>{main}</div>
                                                {showDebug && dbg ? (
                                                    <div className={styles.debug}>
                                                        <div className={styles.debugFormula}>{dbg.formula}</div>
                                                        <div className={styles.debugParts}>
                                                            {dbg.parts.map(([k, v, src], i2) => {
                                                                const partClass =
                                                                    src === "input"
                                                                        ? styles.srcInput
                                                                        : src === "api"
                                                                            ? styles.srcApi
                                                                            : src === "calc"
                                                                                ? styles.srcCalc
                                                                                : styles.srcNeutral;

                                                                return (
                                                                    <div key={`${k}-${i2}`} className={`${styles.debugPart} ${styles.debugPartPill} ${partClass}`}>
                                                                        <span className={styles.debugKey}>{k}</span>
                                                                        <span className={styles.debugVal}>{v}</span>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>
                                                ) : null}
                                            </td>
                                        );
                                    })}
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            <div className={styles.footerNote}>
                <span className={styles.footerLabel}>Debug tip:</span> If a value looks off, check the formula + inputs under that cell.
            </div>
        </div>
    );
}

function Field({
    label,
    hint,
    children,
}: {
    label: string;
    hint?: string;
    children: React.ReactNode;
}) {
    return (
        <div className={styles.assumptionField}>
            <div className={styles.assumptionLabel}>
                {label}
                {hint ? <span className={styles.assumptionHint}>{hint}</span> : null}
            </div>
            {children}
        </div>
    );
}

function NumberInput({
    value,
    onChange,
    step,
}: {
    value: number;
    onChange: (n: number) => void;
    step?: number;
}) {
    return (
        <input
            className={styles.assumptionInput}
            type="number"
            step={step ?? 0.01}
            value={Number.isFinite(value) ? value : 0}
            onChange={(e) => onChange(Number(e.target.value))}
        />
    );
}
