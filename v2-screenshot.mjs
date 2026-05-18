// Screenshot every slide of the v.2 presenter deck with seeded data.
//
// Usage:
//   node /tmp/v2-screenshot.mjs            # writes to /tmp/v2-screens/
//
// Requires the dev server to be running on http://localhost:3000 and a
// temporary `window.__presentStore` debug hook in app/present-v2/PresentClient.tsx.

import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";

const OUT_DIR = "/tmp/v2-screens";
const URL = "http://127.0.0.1:3100/present-v2";

// ── Mock Sanity data ────────────────────────────────────────────────────────
const FP_WESLEY  = "fp_wesley";
const FP_MADISON = "fp_madison";
const FP_ASPEN   = "fp_aspen";

const floorplans = [
    {
        _id: FP_WESLEY,
        name: "Wesley",
        slug: { current: "wesley" },
        sqft: 600,
        bed: 1,
        bath: 1,
        price: 199000,
        length: 30,
        width: 20,
        orderID: 1,
        images: ["/images/hero-adu-optimized.webp"],
    },
    {
        _id: FP_MADISON,
        name: "Madison",
        slug: { current: "madison" },
        sqft: 800,
        bed: 2,
        bath: 1,
        price: 239000,
        length: 32,
        width: 25,
        orderID: 2,
        images: ["/images/hero-adu-optimized.webp"],
    },
    {
        _id: FP_ASPEN,
        name: "Aspen",
        slug: { current: "aspen" },
        sqft: 1000,
        bed: 2,
        bath: 2,
        price: 279000,
        length: 40,
        width: 25,
        orderID: 3,
        images: ["/images/hero-adu-optimized.webp"],
    },
];

const stories = [
    {
        _id: "story_kruger",
        names: "The Krugers",
        quote: "Backyard Estates handled everything — permits, design, construction. We just collected the rent.",
        purpose: "Rental income",
        wistiaId: "abc123",
        slug: { current: "the-krugers" },
        portraitUrl: "/portraits/adam-stewart.png",
        images: ["/images/hero-adu-optimized.webp"],
    },
    {
        _id: "story_patel",
        names: "The Patels",
        quote: "Our parents have a private space, and we still see them every day.",
        purpose: "Multigenerational living",
        wistiaId: "def456",
        slug: { current: "the-patels" },
        portraitUrl: "/portraits/dusty-gravatt.png",
        images: ["/images/hero-adu-optimized.webp"],
    },
];

const completedProperties = [
    {
        _id: "prop_1",
        name: "Aspen — Pasadena",
        slug: { current: "aspen-pasadena" },
        sqft: 1000,
        bed: 2,
        bath: 2,
        location: "Pasadena, CA",
        thumbnailUrl: "/images/hero-adu-optimized.webp",
        images: ["/images/hero-adu-optimized.webp"],
        floorplanName: "Aspen",
        floorplanSqft: 1000,
    },
    {
        _id: "prop_2",
        name: "Madison — Long Beach",
        slug: { current: "madison-long-beach" },
        sqft: 800,
        bed: 2,
        bath: 1,
        location: "Long Beach, CA",
        thumbnailUrl: "/images/hero-adu-optimized.webp",
        images: ["/images/hero-adu-optimized.webp"],
        floorplanName: "Madison",
        floorplanSqft: 800,
    },
    {
        _id: "prop_3",
        name: "Wesley — Glendale",
        slug: { current: "wesley-glendale" },
        sqft: 600,
        bed: 1,
        bath: 1,
        location: "Glendale, CA",
        thumbnailUrl: "/images/hero-adu-optimized.webp",
        images: ["/images/hero-adu-optimized.webp"],
        floorplanName: "Wesley",
        floorplanSqft: 600,
    },
];

// ── Mock financial scenarios ────────────────────────────────────────────────
function aduScenario(id, name, sqft, basePrice, rent) {
    const siteWork = 18000;
    const finalPrice = basePrice + siteWork - 12000;          // less discounts
    const interestRate = 0.065;
    const term = 30 * 12;
    const monthlyRate = interestRate / 12;
    const loan = finalPrice;
    const monthlyPmt = (loan * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -term));
    const propertyTaxMo = (finalPrice * 0.0061) / 12;
    const insuranceMo = 25;
    const maintMo = 42;
    const monthlyCost = monthlyPmt + propertyTaxMo + insuranceMo + maintMo;
    const cashflow = rent - monthlyCost;
    return {
        key: `adu_${id}`,
        title: name,
        kind: "adu",
        sqft,
        rentMonthly: rent,
        purchasePrice: finalPrice,
        downPaymentRate: 0,
        interestRate,
        termYears: 30,
        effectiveTaxRate: 0.0061,
        propertyTaxDiscount: 0.5,
        maintenanceAnnual: maintMo * 12,
        insuranceAnnual: insuranceMo * 12,
        rentGrowthYoY: 0.03,
        capRate: 0.07,
        equityPremium: 0.3,
        equityGrowthAnnual: 0.04,
        downPayment: 0,
        loanAmount: loan,
        mtgPaymentMonthly: monthlyPmt,
        effectiveTaxAnnual: propertyTaxMo * 12,
        propertyTaxMonthly: propertyTaxMo,
        insuranceMonthly: insuranceMo,
        maintenanceMonthly: maintMo,
        monthlyCost,
        cashflowMonthly: cashflow,
        cashflowAnnual: cashflow * 12,
        outOfPocket: 0,
        noiAnnual: rent * 12 * 0.8,
        sqftValue: finalPrice * 0.6,
        incomeValue: rent * 12 * 12,
        premiumValue: finalPrice * 0.3,
        year1EquityBoost: finalPrice * 0.06,
        year5EquityBoost: finalPrice * 0.32,
        year10EquityBoost: finalPrice * 0.68,
        roi: (cashflow * 12) / Math.max(finalPrice, 1),
        debug: {},
        baseAduPrice: basePrice,
        siteWorkApplied: siteWork,
        discountApplied: 12000,
        discountLines: [
            { label: "Open House Discount", amount: 1500 },
            { label: "Solar Discount", amount: 7500 },
            { label: "Loyalty Discount", amount: 3000 },
        ],
        finalAduPrice: finalPrice,
        finalSqft: sqft,
    };
}

function houseScenario() {
    const price = 850000;
    const downPmt = price * 0.20;
    const loan = price - downPmt;
    const interestRate = 0.065;
    const term = 360;
    const monthlyRate = interestRate / 12;
    const monthlyPmt = (loan * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -term));
    const propertyTaxMo = (price * 0.0122) / 12;
    const insuranceMo = 200;
    const maintMo = 500;
    const monthlyCost = monthlyPmt + propertyTaxMo + insuranceMo + maintMo;
    const rent = 3200;
    return {
        key: "house",
        title: "House",
        kind: "house",
        purchasePrice: price,
        remodelCost: 50000,
        downPaymentRate: 0.20,
        interestRate,
        termYears: 30,
        effectiveTaxRate: 0.0122,
        propertyTaxDiscount: 0,
        maintenanceAnnual: maintMo * 12,
        insuranceAnnual: insuranceMo * 12,
        rentGrowthYoY: 0.03,
        capRate: 0.0528,
        equityPremium: 0,
        equityGrowthAnnual: 0.04,
        downPayment: downPmt,
        loanAmount: loan,
        mtgPaymentMonthly: monthlyPmt,
        effectiveTaxAnnual: propertyTaxMo * 12,
        propertyTaxMonthly: propertyTaxMo,
        insuranceMonthly: insuranceMo,
        maintenanceMonthly: maintMo,
        monthlyCost,
        cashflowMonthly: rent - monthlyCost,
        cashflowAnnual: (rent - monthlyCost) * 12,
        outOfPocket: downPmt + 50000,
        noiAnnual: 0,
        sqftValue: 0,
        incomeValue: 0,
        premiumValue: 0,
        year1EquityBoost: price * 0.04,
        year5EquityBoost: price * 0.22,
        year10EquityBoost: price * 0.50,
        roi: null,
        debug: {},
        rentMonthly: rent,
    };
}

const scenarios = [
    aduScenario(FP_WESLEY,  "The Wesley",  600,  199000, 2350),
    aduScenario(FP_MADISON, "The Madison", 800,  239000, 2800),
    aduScenario(FP_ASPEN,   "The Aspen",   1000, 279000, 3250),
    houseScenario(),
];

const rentalComps = [
    { id: "c1", price: 2400, formattedAddress: "1442 Maple Ave, Pasadena, CA", bedrooms: 1, bathrooms: 1, squareFootage: 620 },
    { id: "c2", price: 2750, formattedAddress: "905 Hilltop Dr, Pasadena, CA", bedrooms: 2, bathrooms: 1, squareFootage: 780 },
    { id: "c3", price: 3200, formattedAddress: "2210 Oak Knoll Rd, Pasadena, CA", bedrooms: 2, bathrooms: 2, squareFootage: 980 },
];

const paymentSchedules = {};
for (const id of [FP_WESLEY, FP_MADISON, FP_ASPEN]) {
    const total = scenarios.find((s) => s.key === `adu_${id}`).finalAduPrice;
    paymentSchedules[`adu_${id}`] = [
        { label: "Signing",       phase: "signing",   amount: total * 0.05 },
        { label: "Submittal 1",   phase: "sub1",      amount: total * 0.05 },
        { label: "Submittal 2",   phase: "sub2",      amount: total * 0.05 },
        { label: "Demo",          phase: "demo",      amount: total * 0.10 },
        { label: "Rebar",         phase: "rebar",     amount: total * 0.10 },
        { label: "Framing",       phase: "framing",   amount: total * 0.15 },
        { label: "Rough MEP",     phase: "rough_mep", amount: total * 0.15 },
        { label: "Finishes",      phase: "fin_start", amount: total * 0.15 },
        { label: "Final",         phase: "final",     amount: total * 0.20 },
    ];
}

const adminBroadcast = {
    customerName: "Edgar & Maria Cure",
    propertyAddress: "1442 Maple Ave, Pasadena, CA 91106",
    aduType: "detached",
    propertyPhotoUrl: "/images/hero-adu-optimized.webp",
    customerMotivation: "income",
    comparedUnitIds: [FP_WESLEY, FP_MADISON, FP_ASPEN],
    scenarios,
    rentalComps,
    rentByUnitId: {
        [FP_WESLEY]: 2350,
        [FP_MADISON]: 2800,
        [FP_ASPEN]: 3250,
    },
    paymentSchedules,
    siteWorkTagsByUnitId: {
        [FP_WESLEY]:  ["100A sub panel", "Trenching 40 ft", "Driveway cut"],
        [FP_MADISON]: ["100A sub panel", "Trenching 40 ft", "Driveway cut"],
        [FP_ASPEN]:   ["100A sub panel", "Trenching 40 ft", "Driveway cut", "Tile roof"],
    },
    siteWorkByUnitId: {
        [FP_WESLEY]:  [{ label: "Sub-panel + trenching", category: "Electrical", total: 18000 }],
        [FP_MADISON]: [{ label: "Sub-panel + trenching", category: "Electrical", total: 18000 }],
        [FP_ASPEN]:   [{ label: "Sub-panel + trenching + tile roof", category: "Electrical", total: 18000 }],
    },
    discountLinesByUnitId: {
        [FP_WESLEY]:  [{ label: "Open House Discount", amount: 1500 }, { label: "Solar Discount", amount: 7500 }, { label: "Loyalty Discount", amount: 3000 }],
        [FP_MADISON]: [{ label: "Open House Discount", amount: 1500 }, { label: "Solar Discount", amount: 7500 }, { label: "Loyalty Discount", amount: 3000 }],
        [FP_ASPEN]:   [{ label: "Open House Discount", amount: 1500 }, { label: "Solar Discount", amount: 7500 }, { label: "Loyalty Discount", amount: 3000 }],
    },
};

const sanityData = { floorplans, stories, completedProperties };

// ── Run ─────────────────────────────────────────────────────────────────────
await mkdir(OUT_DIR, { recursive: true });

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    deviceScaleFactor: 1,
});
const page = await context.newPage();

page.on("console", (msg) => {
    if (msg.type() === "error") console.log("PAGE-ERR:", msg.text());
});

await page.goto(URL, { waitUntil: "domcontentloaded", timeout: 30000 });

// Wait for the store to be exposed by the debug hook
await page.waitForFunction(() => Boolean(window.__presentStore), { timeout: 10000 });

// Inject Sanity + admin data
await page.evaluate(({ sanity, admin }) => {
    const store = window.__presentStore.getState();
    store.setSanityData(sanity);
    store.syncFromAdmin(admin);
}, { sanity: sanityData, admin: adminBroadcast });

await page.waitForTimeout(800);

// Slide list — 13 slides, slides 11/12/13 are jump-only via Shift+1/2/3
async function setSlide(n) {
    await page.evaluate((slideNum) => {
        window.__presentStore.getState().setSlide(slideNum);
    }, n);
    await page.waitForTimeout(2500); // opacity transition + count-up with delays
}

for (let n = 1; n <= 13; n++) {
    await setSlide(n);
    const path = `${OUT_DIR}/slide-${String(n).padStart(2, "0")}.png`;
    await page.screenshot({ path, fullPage: false });
    console.log("wrote", path);
}

await browser.close();
console.log("done");
