// lib/investment/types.ts
import type React from "react";

export type Money = number;

export type Defaults = {
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

    // model knobs
    noiExpenseRatio: number;
    maxAduComparisons: number;
};

export const DEFAULTS: Defaults = {
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

export type DebugSource = "input" | "api" | "calc";

export type Debug = Record<
    string,
    {
        value: React.ReactNode;
        formula: string;
        parts: Array<[string, React.ReactNode, DebugSource?]>;
    }
>;

export type Scenario = {
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

export type RowSpec = {
    type: "section" | "spacer" | "row";
    label?: string;
    field?: keyof Debug;
    render?: (s: Scenario) => React.ReactNode;
    source?: DebugSource | ((s: Scenario) => DebugSource);
};
