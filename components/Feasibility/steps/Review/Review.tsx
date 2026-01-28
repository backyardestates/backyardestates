"use client";

import { useEffect, useState } from "react";
import { client } from "@/sanity/client";
import { useAnswersStore } from "@/lib/feasibility/stores/answers.store";

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

export default function ReviewStep() {
    const answers = useAnswersStore((s) => s.answers);

    const [floorplan, setFloorplan] = useState<Floorplan | null>(null);
    const [loadingFp, setLoadingFp] = useState(false);

    const selectedFloorplanId = answers.selectedFloorplanId ?? null;

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

    return (
        <div>
            <p style={{ color: "var(--color-neutral-600)", marginBottom: "1rem" }}>
                Here’s your summary. Next step is generating your branded PDF report.
            </p>

            <div style={{ border: "2px solid var(--color-neutral-100)", borderRadius: "var(--radius)", padding: "1rem", marginBottom: "1rem" }}>
                <p style={{ fontWeight: 800, color: "var(--color-brand-dark-blue)", marginBottom: ".5rem" }}>Your info</p>
                <div style={{ display: "grid", gap: ".35rem", color: "var(--color-neutral-700)" }}>
                    <div><b>Name:</b> {answers.name || "—"}</div>
                    <div><b>Phone:</b> {answers.phone || "—"}</div>
                    <div><b>Email:</b> {answers.email || "—"}</div>
                    <div><b>Property:</b> {answers.address || "—"}</div>
                    <div><b>City:</b> {answers.city || "—"}</div>
                </div>
            </div>

            <div style={{ border: "2px solid var(--color-neutral-100)", borderRadius: "var(--radius)", padding: "1rem", marginBottom: "1rem" }}>
                <p style={{ fontWeight: 800, color: "var(--color-brand-dark-blue)", marginBottom: ".5rem" }}>Your vision</p>
                <div style={{ display: "grid", gap: ".35rem", color: "var(--color-neutral-700)" }}>
                    <div><b>Purpose:</b> {answers.motivation ?? "—"}</div>
                    <div><b>ADU Type:</b> {answers.aduType ?? "—"}</div>
                    <div><b>Priority:</b> {answers.priority ?? "—"}</div>
                    <div><b>Layout:</b> {answers.bed ?? "—"} bed / {answers.bath ?? "—"} bath</div>
                    <div><b>Timeframe:</b> {answers.timeframe ?? "—"}</div>
                    <div>
                        <b>Selected floorplan:</b>{" "}
                        {loadingFp ? "Loading…" : floorplan ? `${floorplan.name} • ${floorplan.sqft} sqft • ${formatMoney(floorplan.price)}` : "—"}
                    </div>
                </div>
            </div>

            <div style={{ border: "2px solid var(--color-neutral-100)", borderRadius: "var(--radius)", padding: "1rem", marginBottom: "1rem" }}>
                <p style={{ fontWeight: 800, color: "var(--color-brand-dark-blue)", marginBottom: ".5rem" }}>
                    Potential Site-Specific Work
                </p>

                {Array.isArray(answers.riskFlags) && answers.riskFlags.length ? (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: ".5rem" }}>
                        {answers.riskFlags.map((f: string) => (
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
                        None selected yet — that’s okay. The Formal Property Analysis identifies them precisely.
                    </p>
                )}
            </div>

            <div style={{ border: "2px solid var(--color-neutral-100)", borderRadius: "var(--radius)", padding: "1rem", marginBottom: "1rem" }}>
                <p style={{ fontWeight: 800, color: "var(--color-brand-dark-blue)", marginBottom: ".5rem" }}>
                    Financial snapshot (preliminary)
                </p>
                <div style={{ display: "grid", gap: ".35rem", color: "var(--color-neutral-700)" }}>
                    <div><b>Estimated total cost:</b> {formatMoney(answers.outputs?.estimatedTotalCost)}</div>
                    <div><b>Estimated monthly payment:</b> {formatMoney(answers.outputs?.monthlyPayment)}/mo</div>
                    <div><b>Interest / term:</b> {answers.outputs?.interestRate ?? "—"}% • {answers.outputs?.termMonths ?? "—"} months</div>
                </div>
            </div>
        </div>
    );
}
