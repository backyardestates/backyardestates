"use client";

import { useEffect, useMemo, useState } from "react";
import { client } from "@/sanity/client";
import { useAnswersStore } from "@/lib/feasibility/stores/answers.store";

const FLOORPLAN_PRICE_BY_ID = `
*[_type=="floorplan" && _id==$id][0]{
  price,
  sqft,
  name
}
`;

function monthlyPayment(principal: number, annualRatePct: number, termMonths: number) {
    if (!principal || principal <= 0) return 0;
    const r = (annualRatePct / 100) / 12;
    if (r === 0) return principal / termMonths;
    return principal * (r * Math.pow(1 + r, termMonths)) / (Math.pow(1 + r, termMonths) - 1);
}

export default function FinanceStep() {
    const answers = useAnswersStore((s) => s.answers);
    const setAnswer = useAnswersStore((s) => s.setAnswer);

    const selectedFloorplanId = answers.selectedFloorplanId ?? null;

    const [floorplanPrice, setFloorplanPrice] = useState<number | null>(null);
    const [loadingFp, setLoadingFp] = useState(false);

    const downPayment = Number(answers.downPayment ?? 0);
    const rate = Number(answers.interestRate ?? 7.5);
    const termMonths = Number(answers.termMonths ?? 360);

    useEffect(() => {
        (async () => {
            if (!selectedFloorplanId) {
                setFloorplanPrice(null);
                return;
            }
            setLoadingFp(true);
            try {
                const fp = await client.fetch(FLOORPLAN_PRICE_BY_ID, { id: selectedFloorplanId });
                setFloorplanPrice(fp?.price ?? null);
            } finally {
                setLoadingFp(false);
            }
        })();
    }, [selectedFloorplanId]);

    const estimatedTotalCost = useMemo(() => {
        const fromFp = floorplanPrice && floorplanPrice > 0 ? floorplanPrice : null;
        return fromFp ?? Number(answers.outputs?.estimatedTotalCost ?? 250000);
    }, [floorplanPrice, answers.outputs?.estimatedTotalCost]);

    const principal = Math.max(0, estimatedTotalCost - (downPayment || 0));
    const payment = useMemo(() => Math.round(monthlyPayment(principal, rate, termMonths)), [principal, rate, termMonths]);

    // Persist outputs back into answers store
    useEffect(() => {
        setAnswer("outputs", {
            ...(answers.outputs ?? {}),
            estimatedTotalCost,
            monthlyPayment: payment,
            interestRate: rate,
            termMonths,
            principal,
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [estimatedTotalCost, payment, rate, termMonths, principal]);

    return (
        <div>
            <p style={{ color: "var(--color-neutral-600)", marginBottom: "1rem" }}>
                This is a <b>preliminary snapshot</b>. Your Formal Property Analysis is what makes these numbers contract-ready.
            </p>

            <div style={{ padding: "1rem", border: "2px solid var(--color-neutral-100)", borderRadius: "var(--radius)", marginBottom: "1rem" }}>
                <p style={{ fontWeight: 800, color: "var(--color-brand-dark-blue)", marginBottom: ".25rem" }}>
                    Estimated Total Cost
                </p>
                <p style={{ fontSize: "1.5rem", fontWeight: 800 }}>
                    ${Number(estimatedTotalCost).toLocaleString()}
                </p>
                <p style={{ color: "var(--color-neutral-600)" }}>
                    {loadingFp ? "Loading floorplan pricing…" : selectedFloorplanId ? "Based on the floorplan you selected (if available)." : "Based on a baseline estimate until you select a floorplan."}
                </p>
            </div>

            <label className="multistep">Down payment (estimate)</label>
            <input
                className="multistep"
                type="text"
                value={String(answers.downPayment ?? "")}
                onChange={(e) => setAnswer("downPayment", e.target.value)}
            />

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <div>
                    <label className="multistep">Interest rate (%)</label>
                    <input
                        className="multistep"
                        type="text"
                        value={String(answers.interestRate ?? "")}
                        onChange={(e) => setAnswer("interestRate", e.target.value)}
                    />
                </div>

                <div>
                    <label className="multistep">Term</label>
                    <select
                        className="multistep"
                        value={String(answers.termMonths ?? 360)}
                        onChange={(e) => setAnswer("termMonths", e.target.value)}
                        style={{
                            width: "100%",
                            height: "3rem",
                            borderRadius: "var(--radius)",
                            border: "2px solid var(--color-neutral-200)",
                            padding: "0.5rem 0.75rem",
                            fontFamily: "var(--font-sans)",
                            color: "var(--color-brand-dark-blue)",
                        }}
                    >
                        <option value="180">15 years</option>
                        <option value="240">20 years</option>
                        <option value="360">30 years</option>
                    </select>
                </div>
            </div>

            <div style={{ marginTop: "1rem", padding: "1rem", border: "2px solid var(--color-neutral-100)", borderRadius: "var(--radius)" }}>
                <p style={{ fontWeight: 800, color: "var(--color-brand-dark-blue)", marginBottom: ".25rem" }}>
                    Estimated Monthly Payment
                </p>
                <p style={{ fontSize: "1.5rem", fontWeight: 800 }}>
                    ${Number(payment).toLocaleString()}/mo
                </p>
                <p style={{ color: "var(--color-neutral-600)" }}>
                    Loan amount: ${Number(principal).toLocaleString()}
                </p>
            </div>
        </div>
    );
}
