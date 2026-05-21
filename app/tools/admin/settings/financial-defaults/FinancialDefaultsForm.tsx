"use client";

import React, { useState } from "react";
import type { Defaults } from "@/lib/investment/types";

type SaveState =
    | { kind: "idle" }
    | { kind: "saving" }
    | { kind: "saved"; at: number }
    | { kind: "error"; message: string };

type FieldDef = {
    key: keyof Defaults;
    label: string;
    help?: string;
    /** "pct" for rates stored as 0–1 decimals; "int" for whole dollars; "float" for misc. */
    kind: "pct" | "int" | "float";
};

const GROUPS: { title: string; fields: FieldDef[] }[] = [
    {
        title: "Loan terms",
        fields: [
            { key: "interestRate", label: "Interest rate", kind: "pct", help: "Annual APR (e.g. 6.5% → 0.065)" },
            { key: "termYears", label: "Term (years)", kind: "int" },
            { key: "downPaymentRateHouse", label: "Down payment — house", kind: "pct" },
            { key: "downPaymentRateAdu", label: "Down payment — ADU", kind: "pct" },
        ],
    },
    {
        title: "Taxes",
        fields: [
            { key: "effectiveTaxRate", label: "Effective property tax rate", kind: "pct" },
            { key: "propertyTaxDiscountAdu", label: "Property tax discount (ADU)", kind: "pct", help: "Share of ADU value NOT reassessed (e.g. 0.5 = half)" },
        ],
    },
    {
        title: "Maintenance & insurance",
        fields: [
            { key: "maintenanceAnnualHouse", label: "Maintenance / yr (house)", kind: "int" },
            { key: "maintenanceAnnualAdu", label: "Maintenance / yr (ADU)", kind: "int" },
            { key: "insuranceAnnualHouse", label: "Insurance / yr (house)", kind: "int" },
            { key: "insuranceAnnualAdu", label: "Insurance / yr (ADU)", kind: "int" },
        ],
    },
    {
        title: "Growth & premium",
        fields: [
            { key: "rentGrowthYoY", label: "Rent growth (annual)", kind: "pct" },
            { key: "equityGrowthAnnual", label: "Equity growth (annual)", kind: "pct" },
            { key: "equityPremium", label: "Equity premium", kind: "float" },
            { key: "capRateHouse", label: "Cap rate (house)", kind: "pct" },
            { key: "capRateAdu", label: "Cap rate (ADU)", kind: "pct" },
        ],
    },
    {
        title: "Other",
        fields: [
            { key: "remodelCostHouse", label: "Remodel cost (house)", kind: "int" },
            { key: "noiExpenseRatio", label: "NOI expense ratio", kind: "pct" },
            { key: "maxAduComparisons", label: "Max ADU comparisons", kind: "int" },
        ],
    },
];

export function FinancialDefaultsForm({ initial }: { initial: Defaults }) {
    const [values, setValues] = useState<Defaults>(initial);
    const [save, setSave] = useState<SaveState>({ kind: "idle" });

    function update(k: keyof Defaults, v: number) {
        setValues((prev) => ({ ...prev, [k]: v }));
        setSave({ kind: "idle" });
    }

    async function onSubmit(e: React.FormEvent) {
        e.preventDefault();
        setSave({ kind: "saving" });
        try {
            const res = await fetch("/api/admin/settings/financial-defaults", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(values),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data?.error ?? `HTTP ${res.status}`);
            setValues(data.defaults);
            setSave({ kind: "saved", at: Date.now() });
        } catch (err) {
            setSave({ kind: "error", message: err instanceof Error ? err.message : String(err) });
        }
    }

    function onReset() {
        setValues(initial);
        setSave({ kind: "idle" });
    }

    return (
        <form
            onSubmit={onSubmit}
            style={{
                display: "flex",
                flexDirection: "column",
                gap: 28,
            }}
        >
            {GROUPS.map((g) => (
                <section
                    key={g.title}
                    style={{
                        background: "#fff",
                        border: "1px solid #e5e1d8",
                        borderRadius: 12,
                        padding: "20px 24px",
                    }}
                >
                    <h2
                        style={{
                            fontSize: 12,
                            letterSpacing: "0.2em",
                            textTransform: "uppercase",
                            color: "#B8954A",
                            fontWeight: 700,
                            margin: 0,
                            marginBottom: 16,
                        }}
                    >
                        {g.title}
                    </h2>
                    <div
                        style={{
                            display: "grid",
                            gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                            gap: "14px 24px",
                        }}
                    >
                        {g.fields.map((f) => (
                            <label key={f.key} style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                                <span style={{ fontSize: 12, color: "#5A5550", fontWeight: 600 }}>
                                    {f.label}
                                </span>
                                <input
                                    type="number"
                                    step={f.kind === "int" ? 1 : f.kind === "pct" ? 0.001 : 0.01}
                                    value={values[f.key]}
                                    onChange={(e) => update(f.key, Number(e.target.value))}
                                    style={{
                                        padding: "8px 12px",
                                        border: "1px solid #d4c4a0",
                                        borderRadius: 6,
                                        fontSize: 14,
                                        color: "#14302F",
                                        background: "#fff",
                                    }}
                                />
                                {f.help && (
                                    <span style={{ fontSize: 11, color: "#8A8278", fontStyle: "italic" }}>
                                        {f.help}
                                    </span>
                                )}
                            </label>
                        ))}
                    </div>
                </section>
            ))}

            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 16,
                    padding: "12px 0",
                }}
            >
                <span
                    style={{
                        fontSize: 13,
                        color:
                            save.kind === "error"
                                ? "#b8503e"
                                : save.kind === "saved"
                                ? "#1f7a4f"
                                : "#8A8278",
                    }}
                >
                    {save.kind === "saving" && "Saving…"}
                    {save.kind === "saved" && `Saved at ${new Date(save.at).toLocaleTimeString()}`}
                    {save.kind === "error" && `Error: ${save.message}`}
                    {save.kind === "idle" && "Changes apply only to NEW proposals from this point on."}
                </span>

                <div style={{ display: "flex", gap: 12 }}>
                    <button
                        type="button"
                        onClick={onReset}
                        style={{
                            padding: "10px 18px",
                            background: "#fff",
                            color: "#5A5550",
                            border: "1px solid #d4c4a0",
                            borderRadius: 8,
                            fontSize: 13,
                            fontWeight: 600,
                            cursor: "pointer",
                        }}
                    >
                        Revert
                    </button>
                    <button
                        type="submit"
                        disabled={save.kind === "saving"}
                        style={{
                            padding: "10px 22px",
                            background: "#14302F",
                            color: "#F7F5F0",
                            border: 0,
                            borderRadius: 8,
                            fontSize: 13,
                            fontWeight: 600,
                            letterSpacing: "0.04em",
                            cursor: save.kind === "saving" ? "wait" : "pointer",
                            opacity: save.kind === "saving" ? 0.6 : 1,
                        }}
                    >
                        Save defaults
                    </button>
                </div>
            </div>
        </form>
    );
}
