// app/admin/_components/investment/InvestmentControls.tsx
"use client";

import React from "react";
import type { Defaults } from "@/lib/investment/types";
import { DEFAULTS } from "@/lib/investment/types";
import type { Floorplan } from "@/lib/rentcast/types";
import { money, num } from "@/lib/investment/format";

import styles from "../investmentModel/InvestmentModelTable.module.css";

export function InvestmentControls({
    defaults,
    defaultsProp,
    setDefaults,
    updateDefault,
    allFloorplans,
    aduCompareIds,
    toggleAdu,
}: {
    styles?: any; // not used because this file imports the same module as table
    defaults: Defaults;
    defaultsProp?: Partial<Defaults>;
    setDefaults: React.Dispatch<React.SetStateAction<Defaults>>;
    updateDefault: <K extends keyof Defaults>(key: K, next: Defaults[K]) => void;

    allFloorplans: Floorplan[];
    aduCompareIds: string[];
    toggleAdu: (id: string) => void;
}) {
    return (
        <div className={styles.controls}>
            <div className={styles.controlCard}>
                <div className={styles.controlTitle}>Compare ADUs</div>
                <div className={styles.controlSub}>Pick up to {defaults.maxAduComparisons} floorplans to compare.</div>

                <Field label="Max ADU Comparisons">
                    <NumberInput
                        value={defaults.maxAduComparisons}
                        onChange={(v) => updateDefault("maxAduComparisons", Math.max(1, Math.round(v)) as any)}
                        step={1}
                    />
                </Field>

                <div className={styles.fpList}>
                    {allFloorplans.map((fp) => {
                        const checked = aduCompareIds.includes(fp._id);
                        const disabled = !checked && aduCompareIds.length >= defaults.maxAduComparisons;

                        return (
                            <label key={fp._id} className={`${styles.fpItem} ${disabled ? styles.fpDisabled : ""}`}>
                                <input type="checkbox" checked={checked} disabled={disabled} onChange={() => toggleAdu(fp._id)} />
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

                {aduCompareIds.length === 0 ? <div className={styles.warn}>Select at least 1 ADU to compare.</div> : null}
            </div>

            <div className={styles.controlCard}>
                <div className={styles.controlTitle}>Assumptions</div>
                <div className={styles.controlSub}>Edit any default and the table updates instantly.</div>

                <div className={styles.assumptionGrid}>
                    <Field label="Interest Rate" hint="Annual (e.g. 0.065)">
                        <NumberInput value={defaults.interestRate} onChange={(v) => updateDefault("interestRate", v as any)} step={0.0005} />
                    </Field>

                    <Field label="Term Years">
                        <NumberInput value={defaults.termYears} onChange={(v) => updateDefault("termYears", Math.max(1, Math.round(v)) as any)} step={1} />
                    </Field>

                    <Field label="Tax Rate" hint="Annual (e.g. 0.0122)">
                        <NumberInput value={defaults.effectiveTaxRate} onChange={(v) => updateDefault("effectiveTaxRate", v as any)} step={0.0001} />
                    </Field>

                    <Field label="ADU Tax Discount" hint="0.50 = 50%">
                        <NumberInput value={defaults.propertyTaxDiscountAdu} onChange={(v) => updateDefault("propertyTaxDiscountAdu", v as any)} step={0.01} />
                    </Field>

                    <Field label="House Down Payment" hint="0.20 = 20%">
                        <NumberInput value={defaults.downPaymentRateHouse} onChange={(v) => updateDefault("downPaymentRateHouse", v as any)} step={0.01} />
                    </Field>

                    <Field label="ADU Down Payment">
                        <NumberInput value={defaults.downPaymentRateAdu} onChange={(v) => updateDefault("downPaymentRateAdu", v as any)} step={0.01} />
                    </Field>

                    <Field label="House Maintenance (Annual)">
                        <NumberInput value={defaults.maintenanceAnnualHouse} onChange={(v) => updateDefault("maintenanceAnnualHouse", v as any)} step={100} />
                    </Field>

                    <Field label="ADU Maintenance (Annual)">
                        <NumberInput value={defaults.maintenanceAnnualAdu} onChange={(v) => updateDefault("maintenanceAnnualAdu", v as any)} step={50} />
                    </Field>

                    <Field label="House Insurance (Annual)">
                        <NumberInput value={defaults.insuranceAnnualHouse} onChange={(v) => updateDefault("insuranceAnnualHouse", v as any)} step={50} />
                    </Field>

                    <Field label="ADU Insurance (Annual)">
                        <NumberInput value={defaults.insuranceAnnualAdu} onChange={(v) => updateDefault("insuranceAnnualAdu", v as any)} step={25} />
                    </Field>

                    <Field label="NOI Expense Ratio" hint="0.20 = 20%">
                        <NumberInput value={defaults.noiExpenseRatio} onChange={(v) => updateDefault("noiExpenseRatio", v as any)} step={0.01} />
                    </Field>

                    <Field label="ADU Cap Rate">
                        <NumberInput value={defaults.capRateAdu} onChange={(v) => updateDefault("capRateAdu", v as any)} step={0.001} />
                    </Field>

                    <Field label="House Cap Rate">
                        <NumberInput value={defaults.capRateHouse} onChange={(v) => updateDefault("capRateHouse", v as any)} step={0.001} />
                    </Field>

                    <Field label="Equity Premium" hint="0.30 = 30%">
                        <NumberInput value={defaults.equityPremium} onChange={(v) => updateDefault("equityPremium", v as any)} step={0.01} />
                    </Field>

                    <Field label="Equity Growth (Annual)">
                        <NumberInput value={defaults.equityGrowthAnnual} onChange={(v) => updateDefault("equityGrowthAnnual", v as any)} step={0.005} />
                    </Field>

                    <Field label="House Remodel Cost">
                        <NumberInput value={defaults.remodelCostHouse} onChange={(v) => updateDefault("remodelCostHouse", v as any)} step={1000} />
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
    );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
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
