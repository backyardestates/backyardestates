"use client";

import { useEffect, useState } from "react";

interface Flag {
    label?: string;
    flagType?: string;
    flagNote?: string;
    estCostImpact?: number | null;
}

const TYPE_LABEL: Record<string, string> = {
    COST_ADDER: "Cost adder",
    CONCERN: "Concern",
    QUESTION: "Open question",
};

const TYPE_COLOR: Record<string, string> = {
    COST_ADDER: "#b45309",
    CONCERN: "#b91c1c",
    QUESTION: "#1d4ed8",
};

const money = (n: number) =>
    n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

/**
 * Read-only callout that surfaces the architect's flags for the proposal at
 * this address. Purely additive: fetches on its own and renders nothing when
 * there are no flags or the request fails, so it can never break the builder.
 * The rep references cost-adders here while entering site work (we deliberately
 * do not auto-mutate the estimator).
 */
export function ArchitectFlagsPanel({ addressKey }: { addressKey: string }) {
    const [flags, setFlags] = useState<Flag[]>([]);
    const [customerName, setCustomerName] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;
        if (!addressKey || addressKey.length < 6) {
            setFlags([]);
            return;
        }
        (async () => {
            try {
                const res = await fetch(
                    `/api/architect/flags?addressKey=${encodeURIComponent(addressKey)}`,
                );
                if (!res.ok) return;
                const data = await res.json();
                if (cancelled) return;
                setFlags(Array.isArray(data.flags) ? data.flags : []);
                setCustomerName(data.customerName ?? null);
            } catch {
                /* fail-safe: render nothing */
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [addressKey]);

    if (flags.length === 0) return null;

    const costAdders = flags.filter((f) => f.flagType === "COST_ADDER");
    const costTotal = costAdders.reduce((sum, f) => sum + (Number(f.estCostImpact) || 0), 0);

    return (
        <div
            style={{
                border: "1px solid #fcd9a8",
                background: "#fffaf2",
                borderRadius: 10,
                padding: "14px 16px",
                marginBottom: 16,
            }}
        >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12 }}>
                <strong style={{ fontSize: 14 }}>
                    Architect findings{customerName ? ` — ${customerName}` : ""}
                </strong>
                {costTotal > 0 && (
                    <span style={{ fontSize: 13, color: "#b45309", fontWeight: 700 }}>
                        Cost-adders: {money(costTotal)}
                    </span>
                )}
            </div>
            <p style={{ fontSize: 12, color: "#6b7280", margin: "2px 0 10px" }}>
                From the on-site analysis. Add cost-adders into your site-work estimate below.
            </p>
            <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
                {flags.map((f, i) => (
                    <li
                        key={i}
                        style={{
                            padding: "6px 0",
                            borderTop: i === 0 ? "none" : "1px solid #f1e7d6",
                            fontSize: 13,
                        }}
                    >
                        <span
                            style={{
                                fontSize: 10,
                                textTransform: "uppercase",
                                letterSpacing: "0.04em",
                                fontWeight: 700,
                                color: TYPE_COLOR[f.flagType ?? ""] ?? "#374151",
                                marginRight: 8,
                            }}
                        >
                            {TYPE_LABEL[f.flagType ?? ""] ?? "Flag"}
                        </span>
                        <span style={{ fontWeight: 600 }}>{f.label || "(unlabeled)"}</span>
                        {f.flagType === "COST_ADDER" && f.estCostImpact != null && (
                            <span style={{ color: "#b45309" }}> · {money(Number(f.estCostImpact))}</span>
                        )}
                        {f.flagNote && <span style={{ color: "#6b7280" }}> — {f.flagNote}</span>}
                    </li>
                ))}
            </ul>
        </div>
    );
}
