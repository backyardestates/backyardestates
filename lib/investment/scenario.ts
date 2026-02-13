// lib/investment/scenario.ts
import type { Defaults, Scenario, Debug, Money } from "./types";
import { money, pct, pmt } from "./format";
import type { RentalListing, Floorplan } from "@/lib/rentcast/types";
import { estimateRent } from "./rentEstimator";
import { RentcastMarketStats, useRentcastData } from "@/hooks/rentcast/useRentcastData";

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
    propertyTaxDiscount: number;

    maintenanceAnnual: Money;
    insuranceAnnual: Money;

    rentGrowthYoY: number;
    capRate: number;
    equityPremium: number;
    equityGrowthAnnual: number;

    noiExpenseRatio: number;

    basePropertyValue?: number;
    basePropertySqft?: number;

    // optional rent debug passthrough for your cell debug
    rentEstimateDebug?: any;
}): Scenario {
    const purchase = input.purchasePrice ?? 0;
    const remodel = input.remodelCost ?? 0;

    const downPayment = purchase * input.downPaymentRate;
    const loanAmount = Math.max(0, purchase - downPayment);
    const mtgPaymentMonthly = pmt(input.interestRate, input.termYears, loanAmount);

    const discountFactor = 1 - (input.propertyTaxDiscount ?? 0);
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
    const roi = purchase > 0 ? rentAnnual / purchase : null;

    const noiAnnual = rentAnnual * (1 - input.noiExpenseRatio);

    const propertyValue = input.basePropertyValue ?? 0;
    const propertySqft = input.basePropertySqft ?? 0;
    const aduSqft = input.sqft ?? 0;

    const incomeApproachEquity = rentAnnual / 0.07;
    const sfApproachEquity = propertySqft > 0 ? (propertyValue / propertySqft) * aduSqft : 0;
    const premiumApproachEquity = propertyValue * (input.equityPremium ?? 0);

    const year1EquityBoost = (incomeApproachEquity + sfApproachEquity + premiumApproachEquity) / 3;
    const g = 1 + input.equityGrowthAnnual;
    const year5EquityBoost = year1EquityBoost * Math.pow(g, 4);
    const year10EquityBoost = year5EquityBoost * Math.pow(g, 9);


    const rentDbg = input.rentEstimateDebug;
    const debug: Debug = {
        purchasePrice: {
            value: money(input.purchasePrice),
            formula: "purchasePrice",
            parts: [["purchasePrice", money(input.purchasePrice), input.kind === "house" ? "api" : "input"]],
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
                ["downPayment", money(downPayment), "calc"],
                ["remodelCost", money(remodel), input.kind === "house" ? "input" : "calc"],
                ["outOfPocket", money(outOfPocket), "calc"],
            ],
        },
        sqftValue: {
            value: money(sfApproachEquity),
            formula: "SF approach = (mainHome / sqft) x ADU sqft",
            parts: [
                ["mainHome", money(propertyValue), "api"],
                ["sqft", String(input.basePropertySqft ?? 0), "api"],
                ["aduSqft", String(input.sqft ?? 0), "input"],
            ],
        },
        incomeValue: {
            value: money(incomeApproachEquity),
            formula: "Income approach = rentalYr / 0.07",
            parts: [["rentalYr", money(rentAnnual), "calc"]],
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
                ["purchase", money(purchase), "api"],
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
                ["Year5", money(year5EquityBoost), "calc"],
            ],
        },
        year10EquityBoost: {
            value: money(year10EquityBoost),
            formula: "Year10 = Year1 × (1 + growth)^(10−1)",
            parts: [
                ["Year5", money(year5EquityBoost), "calc"],
                ["growth", pct(input.equityGrowthAnnual), "input"],
                ["Year10", money(year10EquityBoost), "calc"],
            ],
        },
        rentMonthly: {
            value: money(input.rentMonthly),
            formula: rentDbg?.method ? `Rent = ${rentDbg.method}` : "Rent (estimate)",
            parts: [["rentMonthly", money(input.rentMonthly), "calc"]],
        },
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
        incomeValue: incomeApproachEquity,
        premiumValue: premiumApproachEquity,

        year1EquityBoost,
        year5EquityBoost,
        year10EquityBoost,

        roi,
        debug,
    };
}



export function buildScenarios(input: {
    defaults: Defaults;
    housePrice?: number;
    houseRentEstimate?: number;
    subjectSqft?: number;
    rentals: RentalListing[];
    selectedAdus: Floorplan[];
    market: RentcastMarketStats | null;
}): Scenario[] {

    const { defaults, housePrice, houseRentEstimate, subjectSqft, rentals, selectedAdus, market } = input;

    const estatesOrdered = [
        { key: "estate_350", sqft: 350, beds: 0, baths: 1 },
        { key: "estate_400", sqft: 400, beds: 0, baths: 1 },
        { key: "estate_450", sqft: 450, beds: 1, baths: 1 },
        { key: "estate_600", sqft: 600, beds: 1, baths: 1 },
        { key: "estate_750", sqft: 750, beds: 2, baths: 1 },
        { key: "estate_750_plus", sqft: 750, beds: 2, baths: 2 }, // <-- separates via premium
        { key: "estate_800", sqft: 800, beds: 2, baths: 2 },
        { key: "estate_950", sqft: 950, beds: 3, baths: 2 },
        { key: "estate_1200", sqft: 1200, beds: 3, baths: 2 },
    ];

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

            rentEstimateDebug: {
                method: "house_scaled_median",
            },
        })
    );


    // ADUs
    for (const fp of selectedAdus) {
        const { rent, debug } = estimateRent(rentals, {
            targetSqft: fp.sqft,
            targetBeds: fp.beds,
            targetBaths: fp.baths,
            estatesOrdered,
            estateKey: fp.key,
            market,
            ladderPreviewCount: 6,
        });

        out.push(
            calcScenarioBase({
                key: `adu_${fp._id}`,
                title: `ADU — ${fp.name} (${fp.sqft} SF)`,
                kind: "adu",
                sqft: fp.sqft,
                rentMonthly: rent,
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

                basePropertyValue: housePrice ?? 0,
                basePropertySqft: subjectSqft ?? 0,

                rentEstimateDebug: debug,
            })
        );
    }

    return out;
}
