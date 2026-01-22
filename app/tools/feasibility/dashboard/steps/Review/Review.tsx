"use client";

import { useEffect, useState } from "react";
import { useFeasibilityStore } from "@/lib/feasibility/store";
import { client } from "@/sanity/client";

const FLOORPLAN_BY_ID = `
*[_type=="floorplan" && _id==$id][0]{
  _id,
  name,
  bed,
  bath,
  sqft,
  price
}
`;

type Floorplan = {
    _id: string;
    name: string;
    bed: number;
    bath: number;
    sqft: number;
    price: number;
};

function formatMoney(n?: number) {
    if (typeof n !== "number" || Number.isNaN(n)) return "—";
    return `$${Math.round(n).toLocaleString()}`;
}

export default function Review() {
    const {
        name,
        phone,
        email,
        address,
        city,
        aduType,
        bed,
        bath,
        intendedUse,
        selectedFloorplanId,
        riskFlags,
        outputs,
    } = useFeasibilityStore();

    const [floorplan, setFloorplan] = useState<Floorplan | null>(null);
    const [loadingFp, setLoadingFp] = useState(false);

    useEffect(() => {
        (async () => {
            if (!selectedFloorplanId) {
                setFloorplan(null);
                return;
            }
            setLoadingFp(true);
            try {
                const fp = await client.fetch(FLOORPLAN_BY_ID, { id: selectedFloorplanId });
                setFloorplan(fp ?? null);
            } finally {
                setLoadingFp(false);
            }
        })();
    }, [selectedFloorplanId]);

    const aduTypeLabel =
        aduType === "garageConversion"
            ? "Garage Conversion"
            : aduType === "attached"
                ? "Attached ADU"
                : aduType === "detached"
                    ? "Detached ADU"
                    : "—";

    const intendedUseLabel =
        intendedUse === "investment"
            ? "Investment (rental)"
            : intendedUse === "family"
                ? "Family"
                : intendedUse === "both"
                    ? "Both"
                    : "—";

    return (
        <div>
            <p style={{ color: "var(--color-neutral-600)", marginBottom: "1rem" }}>
                Here’s your summary. Next step is generating your branded PDF report.
            </p>

            {/* Contact / Property */}
            <div
                style={{
                    border: "2px solid var(--color-neutral-100)",
                    borderRadius: "var(--radius)",
                    padding: "1rem",
                    marginBottom: "1rem",
                }}
            >
                <p style={{ fontWeight: 800, color: "var(--color-brand-dark-blue)", marginBottom: ".5rem" }}>
                    Your info
                </p>

                <div style={{ display: "grid", gap: ".35rem", color: "var(--color-neutral-700)" }}>
                    <div><b>Name:</b> {name || "—"}</div>
                    <div><b>Phone:</b> {phone || "—"}</div>
                    <div><b>Email:</b> {email || "—"}</div>
                    <div><b>Property:</b> {address || "—"}</div>
                    <div><b>City:</b> {city || "—"}</div>
                </div>
            </div>

            {/* Vision */}
            <div
                style={{
                    border: "2px solid var(--color-neutral-100)",
                    borderRadius: "var(--radius)",
                    padding: "1rem",
                    marginBottom: "1rem",
                }}
            >
                <p style={{ fontWeight: 800, color: "var(--color-brand-dark-blue)", marginBottom: ".5rem" }}>
                    Your vision
                </p>

                <div style={{ display: "grid", gap: ".35rem", color: "var(--color-neutral-700)" }}>
                    <div><b>ADU Type:</b> {aduTypeLabel}</div>
                    <div><b>Layout:</b> {bed ?? "—"} bed / {bath ?? "—"} bath</div>
                    <div><b>Intended use:</b> {intendedUseLabel}</div>
                    <div>
                        <b>Selected floorplan:</b>{" "}
                        {loadingFp ? "Loading…" : floorplan ? `${floorplan.name} • ${floorplan.sqft} sqft • ${formatMoney(floorplan.price)}` : "—"}
                    </div>
                </div>
            </div>

            {/* Risk Snapshot */}
            <div
                style={{
                    border: "2px solid var(--color-neutral-100)",
                    borderRadius: "var(--radius)",
                    padding: "1rem",
                    marginBottom: "1rem",
                }}
            >
                <p style={{ fontWeight: 800, color: "var(--color-brand-dark-blue)", marginBottom: ".5rem" }}>
                    Potential Site-Specific Work
                </p>

                {riskFlags?.length ? (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: ".5rem" }}>
                        {riskFlags.map((f) => (
                            <span
                                key={f}
                                style={{
                                    padding: ".35rem .6rem",
                                    borderRadius: 999,
                                    background: "var(--color-brand-beige-A020)",
                                    border: "1px solid var(--color-brand-beige-A040)",
                                    color: "var(--color-brand-dark-blue)",
                                    fontFamily: "var(--font-sans)",
                                    fontSize: ".95rem",
                                }}
                            >
                                {f}
                            </span>
                        ))}
                    </div>
                ) : (
                    <p style={{ color: "var(--color-neutral-600)" }}>
                        No potential site-specific work identified yet — that’s okay. The Formal Property Analysis identifies them precisely.
                    </p>
                )}

                <p style={{ marginTop: ".75rem", color: "var(--color-neutral-600)" }}>
                    Your Formal Property Analysis is what converts “unknowns” into a real scope, real price, and real timeline.
                </p>
            </div>

            {/* Financial Snapshot */}
            <div
                style={{
                    border: "2px solid var(--color-neutral-100)",
                    borderRadius: "var(--radius)",
                    padding: "1rem",
                    marginBottom: "1rem",
                }}
            >
                <p style={{ fontWeight: 800, color: "var(--color-brand-dark-blue)", marginBottom: ".5rem" }}>
                    Financial snapshot (preliminary)
                </p>

                <div style={{ display: "grid", gap: ".35rem", color: "var(--color-neutral-700)" }}>
                    <div><b>Estimated total cost:</b> {formatMoney(outputs.estimatedTotalCost)}</div>
                    <div><b>Estimated monthly payment:</b> {formatMoney(outputs.monthlyPayment)}/mo</div>
                    <div>
                        <b>Interest / term:</b> {outputs.interestRate ?? "—"}% • {outputs.termMonths ?? "—"} months
                    </div>
                </div>

                <p style={{ marginTop: ".75rem", color: "var(--color-brand-dark-blue)", fontWeight: 700 }}>
                    These numbers become contract-ready after your Formal Property Analysis.
                </p>
            </div>

            {/* Close */}
            <div
                style={{
                    padding: "1rem",
                    borderRadius: "var(--radius)",
                    background: "var(--color-brand-beige-subtle)",
                    border: "1px solid var(--color-brand-beige-A040)",
                }}
            >
                <p style={{ fontWeight: 800, color: "var(--color-brand-dark-blue)", marginBottom: ".5rem" }}>
                    Next step
                </p>
                <p style={{ color: "var(--color-neutral-700)" }}>
                    Generate your PDF, bring it to the open house tomorrow, and we’ll help you lock a real plan with a Formal Property Analysis.
                </p>
                <p style={{ marginTop: ".5rem", color: "var(--color-neutral-600)" }}>
                    We only run a limited number of Formal Property Analyses per week per city.
                </p>
            </div>
        </div>
    );
}
