"use client";

import React from "react";

export type FinancingOptionResult = {
    key: string;
    label: string;
    ok: boolean;

    maxAllowedLoan: number;
    neededTotalDebt: number;
    cashAvailable: number;

    aduPmtMonthly?: number;
    totalPmtMonthly?: number;
    deltaPmtMonthly?: number;

    notes: string[];
};

function money(n?: number) {
    if (typeof n !== "number" || !Number.isFinite(n)) return "—";
    return n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}

export function FinancingOptionsCard({
    title,
    options,
}: {
    title: string;
    options: FinancingOptionResult[];
}) {
    if (!options?.length) return null;

    return (
        <div style={{ border: "1px solid rgba(0,0,0,0.08)", borderRadius: 14, padding: 14 }}>
            <div style={{ fontWeight: 650, marginBottom: 10 }}>{title}</div>

            <div style={{ display: "grid", gap: 10 }}>
                {options.map((o) => (
                    <div
                        key={o.key}
                        style={{
                            border: "1px solid rgba(0,0,0,0.08)",
                            borderRadius: 12,
                            padding: 12,
                            opacity: o.ok ? 1 : 0.55,
                        }}
                    >
                        <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                            <div style={{ fontWeight: 600 }}>
                                {o.ok ? "✅" : "❌"} {o.label}
                            </div>
                            <div style={{ fontWeight: 650 }}>{money(o.totalPmtMonthly)}</div>
                        </div>

                        <div style={{ marginTop: 6, display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 8 }}>
                            <div>
                                <div style={{ fontSize: 12, opacity: 0.7 }}>ADU PMT</div>
                                <div>{money(o.aduPmtMonthly)}</div>
                            </div>
                            <div>
                                <div style={{ fontSize: 12, opacity: 0.7 }}>Δ PMT</div>
                                <div>{money(o.deltaPmtMonthly)}</div>
                            </div>
                            <div>
                                <div style={{ fontSize: 12, opacity: 0.7 }}>Max Allowed</div>
                                <div>{money(o.maxAllowedLoan)}</div>
                            </div>
                            <div>
                                <div style={{ fontSize: 12, opacity: 0.7 }}>Needed</div>
                                <div>{money(o.neededTotalDebt)}</div>
                            </div>
                            <div>
                                <div style={{ fontSize: 12, opacity: 0.7 }}>Cash Available</div>
                                <div>{money(o.cashAvailable)}</div>
                            </div>
                        </div>

                        {o.notes?.length ? (
                            <div style={{ marginTop: 8, fontSize: 12, opacity: 0.75 }}>
                                {o.notes.slice(0, 2).join(" • ")}
                            </div>
                        ) : null}
                    </div>
                ))}
            </div>
        </div>
    );
}
