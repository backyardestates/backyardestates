import { FeasibilityStoreData, OptionalUpgradeItem, SiteSpecificItem } from "./types";
import { clamp, safeNumber } from "./format";

type Range = { min: number; max: number };

function sumRanges(items: Array<{ min: number; max: number }>): Range {
    return items.reduce(
        (acc, x) => ({ min: acc.min + x.min, max: acc.max + x.max }),
        { min: 0, max: 0 }
    );
}

function getSiteItems(site?: Record<string, SiteSpecificItem> | null) {
    const entries = Object.entries(site ?? {});
    return entries.map(([key, v]) => ({ key, ...v }));
}

function getUpgradeItems(up?: Record<string, OptionalUpgradeItem> | null) {
    const entries = Object.entries(up ?? {});
    return entries.map(([key, v]) => ({ key, ...v }));
}

export type Discount = {
    title: string;
    detail: string;
    amountHint?: string; // not applied automatically unless you add qualification logic
};

export const DISCOUNTS: Discount[] = [
    { title: "Open House / Event Incentive", detail: "Available for qualified attendees of select events.", amountHint: "Ask for current offer" },
    { title: "First Responders", detail: "Police, Fire, EMT — thank you.", amountHint: "Varies" },
    { title: "Teachers", detail: "K–12 and higher education.", amountHint: "Varies" },
    { title: "Military", detail: "Active duty and veterans.", amountHint: "Varies" },
    { title: "Returning Client / Referral", detail: "Past clients and direct referrals.", amountHint: "Varies" },
];

export type Computed = {
    floorplanName: string;
    sqft: number;
    bed: number;
    bath: number;

    basePrice: number;

    site: {
        items: Array<SiteSpecificItem & { key: string; costMin: number; costMax: number }>;
        subtotal: Range;
        flags: string[];
    };

    upgrades: {
        items: Array<OptionalUpgradeItem & { key: string; costMin: number; costMax: number }>;
        subtotal: Range;
    };

    discounts: {
        list: Discount[];
        appliedTotal: number; // right now 0, unless you add qualification rules
    };

    totals: {
        totalMin: number;
        totalMax: number;
    };

    rent: {
        estimatedMonthly: number;
        range: Range;
        comps: any[];
        methodNote: string;
        disclaimer: string;
    };

    finance: {
        path: "cash" | "finance";
        downPayment: number;
        principal: number;
        monthlyPayment: number;
        ratePct: number;
        termMonths: number;
        cashOutOfPocketRange: Range; // downpayment + (optional) some min/max site/upgrades? helpful
    };

    roi: {
        monthlyCashflowMin: number;
        monthlyCashflowMax: number;
        annualCashflowMin: number;
        annualCashflowMax: number;
        simpleRoiMin: number; // cashflow / cash out of pocket
        simpleRoiMax: number;
    };

    equityBoost?: {
        enabled: boolean;
        year1: number;
        year5: number;
        year10: number;
        methodNote: string;
        disclaimer: string;
    };

    timeline: {
        totalMonthsRange: Range;
        phases: Array<{ title: string; weeksRange: Range; notes: string[] }>;
    };

    bullets: {
        topUnknowns: string[];
        nextSteps: string[];
    };
};

function mortgagePayment(principal: number, ratePct: number, termMonths: number) {
    const r = (ratePct / 100) / 12;
    const n = Math.max(1, termMonths);
    if (r <= 0) return principal / n;

    const pow = Math.pow(1 + r, n);
    return principal * (r * pow) / (pow - 1);
}

// Conservative rent baseline (fallback when outputs.rent missing)
// You can replace later by feeding outputs.rent from backend “real data”.
function estimateRentFallback(city: string | null | undefined, sqft: number, bed: number, bath: number) {
    const c = (city ?? "").toLowerCase();

    // City baselines (VERY conservative; tune anytime).
    // This is just a fallback estimate.
    let base = 2200;
    if (c.includes("rancho cucamonga")) base = 2350;
    if (c.includes("upland")) base = 2300;
    if (c.includes("claremont")) base = 2500;
    if (c.includes("norco")) base = 2400;
    if (c.includes("montclair")) base = 2250;
    if (c.includes("ontario")) base = 2300;

    const sqftAdj = (sqft - 600) * 1.25; // ~$1.25 per sqft above/below 600
    const bedAdj = (bed - 1) * 250;
    const bathAdj = Math.max(0, bath - 1) * 140;

    const est = base + sqftAdj + bedAdj + bathAdj;
    const estimated = clamp(Math.round(est / 25) * 25, 1400, 5200);

    return {
        estimated,
        range: { min: Math.round(estimated * 0.92), max: Math.round(estimated * 1.08) },
        methodNote: "Estimate uses conservative local rent baselines + plan size/bed/bath adjustments. Final rent depends on finishes, parking, access, and neighborhood demand.",
        disclaimer:
            "Rental figures are estimates for planning only. The Formal Property Analysis refines rental assumptions using real-time local comps and listing trends."
    };
}

function estimateEquityBoost(
    totalCostMid: number,
    rentMonthly: number,
    wants: boolean
) {
    if (!wants) {
        return { enabled: false, year1: 0, year5: 0, year10: 0, methodNote: "", disclaimer: "" };
    }

    // Hybrid: cost + income approach, conservative multipliers
    // (Tune anytime; ideally backend will compute this later.)
    const capRate = 0.055; // 5.5% conservative
    const noi = rentMonthly * 12 * 0.72; // assume 28% operating “haircut” conservative
    const incomeValue = noi / capRate;

    // Blend cost-mid with income approach (weighted conservative)
    const blended = (totalCostMid * 0.65) + (incomeValue * 0.35);

    // Appreciation assumptions (conservative)
    const app = 0.035;

    const year1 = blended * Math.pow(1 + app, 1);
    const year5 = blended * Math.pow(1 + app, 5);
    const year10 = blended * Math.pow(1 + app, 10);

    return {
        enabled: true,
        year1: Math.round(year1),
        year5: Math.round(year5),
        year10: Math.round(year10),
        methodNote: "Equity boost blends a conservative income approach (NOI/cap rate) with build-cost midpoint and applies a conservative appreciation assumption.",
        disclaimer:
            "Equity estimates are directional and not an appraisal. The Formal Property Analysis refines assumptions and can include neighborhood-specific valuation factors."
    };
}

function timelineModel(aduType: string) {
    // Weeks ranges — tune per your real ops
    const isConversion = aduType?.toLowerCase().includes("garage");
    if (isConversion) {
        return [
            { title: "Plans & Engineering", weeksRange: { min: 4, max: 8 }, notes: ["Architectural plan set", "Title 24 / structural engineering as needed"] },
            { title: "Permits", weeksRange: { min: 6, max: 12 }, notes: ["City review cycles vary by workload", "Revisions can add time"] },
            { title: "Construction", weeksRange: { min: 8, max: 12 }, notes: ["Conversion scope varies", "Site triggers can extend timeline"] },
        ];
    }

    return [
        { title: "Plans & Engineering", weeksRange: { min: 6, max: 10 }, notes: ["Architectural plan set", "Engineering as required"] },
        { title: "Permits", weeksRange: { min: 8, max: 16 }, notes: ["City review cycles vary", "Revisions can add time"] },
        { title: "Construction", weeksRange: { min: 6, max: 10 }, notes: ["Detached builds vary by scope", "Site triggers can extend timeline"] },
    ];
}

export function computeFeasibility(data: FeasibilityStoreData): Computed {
    const fp = data.selections?.floorplan;
    const basePrice = safeNumber(fp?.price, 0);

    const bed = safeNumber(fp?.bed ?? data.project?.bed, 0);
    const bath = safeNumber(fp?.bath ?? data.project?.bath, 0);
    const sqft = safeNumber(fp?.sqft, 0);

    // Site work
    const siteItemsRaw = getSiteItems(data.selections?.siteSpecific);
    const siteItems = siteItemsRaw
        .filter((x) => x.status !== "not_apply")
        .map((x) => ({
            ...x,
            costMin: safeNumber(x.cost?.min, 0),
            costMax: safeNumber(x.cost?.max, safeNumber(x.cost?.min, 0)),
        }));

    const siteSubtotal = sumRanges(siteItems.map((x) => ({ min: x.costMin, max: x.costMax })));

    const siteFlags = siteItems
        .filter((x) => x.status === "might_apply" || x.status === "unknown")
        .map((x) => x.title);

    // Upgrades
    const upgradeItemsRaw = getUpgradeItems(data.selections?.optionalUpgrades);
    const upgradeItems = upgradeItemsRaw
        .filter((x) => !!x.selected)
        .map((x) => ({
            ...x,
            costMin: safeNumber(x.cost?.min, 0),
            costMax: safeNumber(x.cost?.max, safeNumber(x.cost?.min, 0)),
        }));

    const upgradesSubtotal = sumRanges(upgradeItems.map((x) => ({ min: x.costMin, max: x.costMax })));

    const appliedDiscountsTotal = 0; // Add qualification logic later if desired.

    const totalMin = basePrice + siteSubtotal.min + upgradesSubtotal.min - appliedDiscountsTotal;
    const totalMax = basePrice + siteSubtotal.max + upgradesSubtotal.max - appliedDiscountsTotal;

    // Rent output (prefer backend-provided “real data”)
    const rentOut = data.outputs?.rent;
    let rentEstimated = safeNumber(rentOut?.estimatedMonthly, 0);
    let rentRange: Range = { min: 0, max: 0 };
    let comps: any[] = [];

    if (rentEstimated > 0) {
        const rMin = safeNumber(rentOut?.range?.min, Math.round(rentEstimated * 0.92));
        const rMax = safeNumber(rentOut?.range?.max, Math.round(rentEstimated * 1.08));
        rentRange = { min: rMin, max: rMax };
        comps = rentOut?.comps ?? [];
    } else {
        const fallback = estimateRentFallback(data.property?.city, sqft, bed, bath);
        rentEstimated = fallback.estimated;
        rentRange = fallback.range;
    }

    const rentMethod = rentOut?.methodNote
        ?? "Estimate uses conservative local rent baselines and plan features. Formal Property Analysis refines this using real-time comps.";
    const rentDisclaimer = rentOut?.disclaimer
        ?? "Rental figures are planning estimates only. Formal Property Analysis refines rental estimates using verified local comps.";

    // Finance
    const fin = data.finance ?? {};
    const path = (fin.path === "cash" ? "cash" : "finance") as "cash" | "finance";
    const downPayment = safeNumber(fin.downPayment, 0);

    const ratePct = safeNumber(fin.ratePct, 7);
    const termMonths = safeNumber(fin.termMonths, 360);

    const totalMid = (totalMin + totalMax) / 2;
    const principal = path === "cash" ? 0 : Math.max(0, totalMid - downPayment);

    const monthlyPayment = path === "cash" ? 0 : mortgagePayment(principal, ratePct, termMonths);

    // Cash out of pocket — helpful to show range if you want.
    const cashOutMin = path === "cash" ? totalMin : downPayment;
    const cashOutMax = path === "cash" ? totalMax : downPayment;

    // ROI
    const cashflowMin = rentRange.min - monthlyPayment;
    const cashflowMax = rentRange.max - monthlyPayment;

    const annualMin = cashflowMin * 12;
    const annualMax = cashflowMax * 12;

    const cashOutBase = Math.max(1, cashOutMin);
    const roiMin = annualMin / cashOutBase;
    const roiMax = annualMax / cashOutBase;

    // Equity boost
    const wantsEquity = (fin.wantsValueBoostAnalysis ?? "") === "yes";
    const equity = estimateEquityBoost(totalMid, rentEstimated, wantsEquity);

    // Timeline
    const phases = timelineModel(data.project?.aduType ?? "");
    const totalWeeks = phases.reduce(
        (acc, p) => ({ min: acc.min + p.weeksRange.min, max: acc.max + p.weeksRange.max }),
        { min: 0, max: 0 }
    );
    const totalMonths = { min: Math.round(totalWeeks.min / 4), max: Math.round(totalWeeks.max / 4) };

    // “What matters most” bullets
    const topUnknowns = siteFlags.slice(0, 3).length
        ? siteFlags.slice(0, 3)
        : ["Site utilities & connection points", "Access and setbacks", "City review cycles"];

    const nextSteps = [
        "Schedule an office visit or site walk to confirm feasibility.",
        "Purchase the Formal Property Analysis to verify site triggers and finalize a proposal.",
        "Lock in final scope + timeline and move into design & permitting.",
    ];

    return {
        floorplanName: fp?.name ?? "Your Selected Plan",
        sqft,
        bed,
        bath,
        basePrice,

        site: { items: siteItems, subtotal: siteSubtotal, flags: siteFlags },
        upgrades: { items: upgradeItems, subtotal: upgradesSubtotal },

        discounts: { list: DISCOUNTS, appliedTotal: appliedDiscountsTotal },

        totals: { totalMin, totalMax },

        rent: {
            estimatedMonthly: rentEstimated,
            range: rentRange,
            comps,
            methodNote: rentMethod,
            disclaimer: rentDisclaimer,
        },

        finance: {
            path,
            downPayment,
            principal,
            monthlyPayment,
            ratePct,
            termMonths,
            cashOutOfPocketRange: { min: cashOutMin, max: cashOutMax },
        },

        roi: {
            monthlyCashflowMin: cashflowMin,
            monthlyCashflowMax: cashflowMax,
            annualCashflowMin: annualMin,
            annualCashflowMax: annualMax,
            simpleRoiMin: roiMin,
            simpleRoiMax: roiMax,
        },

        equityBoost: equity.enabled ? equity : undefined,

        timeline: {
            totalMonthsRange: totalMonths,
            phases,
        },

        bullets: { topUnknowns, nextSteps },
    };
}
