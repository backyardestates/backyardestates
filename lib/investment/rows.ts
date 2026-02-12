// lib/investment/rows.ts
import type { Defaults, RowSpec } from "./types";
import { money, pct } from "./format";

export function buildRows(defaults: Defaults): RowSpec[] {
    return [
        { type: "section", label: "Output" },

        {
            type: "row",
            label: "Purchase Price",
            field: "purchasePrice",
            render: (s) => money(s.purchasePrice),
            source: (s) => (s.kind === "house" ? "api" : "input"),
        },

        { type: "row", label: "Down Payment", field: "downPayment", render: (s) => money(s.downPayment), source: "calc" },
        { type: "row", label: "Loan Amount", field: "loanAmount", render: (s) => money(s.loanAmount), source: "calc" },

        {
            type: "row",
            label: "Remodel",
            render: (s) => money(s.remodelCost),
            source: (s) => (s.kind === "house" ? "input" : "calc"),
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

        {
            type: "row",
            label: "Sqft Approach",
            field: "sqftValue",
            render: (s) => (s.kind === "house" ? "—" : money(s.sqftValue)),
            source: "calc",
        },
        {
            type: "row",
            label: "Income Value",
            field: "incomeValue",
            render: (s) => (s.kind === "house" ? "—" : money(s.incomeValue)),
            source: "calc",
        },
        {
            type: "row",
            label: "Premium Value",
            field: "premiumValue",
            render: (s) => (s.kind === "house" ? "—" : money(s.premiumValue)),
            source: "calc",
        },
        {
            type: "row",
            label: "Year 1",
            field: "year1EquityBoost",
            render: (s) => (s.kind === "house" ? "—" : money(s.year1EquityBoost)),
            source: "calc",
        },
        {
            type: "row",
            label: "Year 5",
            field: "year5EquityBoost",
            render: (s) => (s.kind === "house" ? "—" : money(s.year5EquityBoost)),
            source: "calc",
        },
        {
            type: "row",
            label: "Year 10",
            field: "year10EquityBoost",
            render: (s) => (s.kind === "house" ? "—" : money(s.year10EquityBoost)),
            source: "calc",
        },

        { type: "spacer" },

        { type: "row", label: "ROI", field: "roi", render: (s) => (s.roi == null ? "—" : pct(s.roi)), source: "calc" },

        { type: "spacer" },
    ];
}
