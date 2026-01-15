"use client";

import { useEffect, useMemo, useState } from "react";
import { client } from "@/sanity/client";
import { useFeasibilityStore } from "@/lib/feasibility/store";

const FLOORPLAN_PRICE_BY_ID = `
*[_type=="floorplan" && _id==$id][0]{
  price,
  sqft,
  name
}
`;

// Standard fixed-rate mortgage payment
function monthlyPayment(principal: number, annualRatePct: number, termMonths: number) {
    if (!principal || principal <= 0) return 0;
    const r = (annualRatePct / 100) / 12;
    if (r === 0) return principal / termMonths;
    return principal * (r * Math.pow(1 + r, termMonths)) / (Math.pow(1 + r, termMonths) - 1);
}

export default function Step5Finance() {
    const {
        selectedFloorplanId,
        outputs,
        setOutputs,
    } = useFeasibilityStore();

    const [floorplanPrice, setFloorplanPrice] = useState<number | null>(null);
    const [loadingFp, setLoadingFp] = useState(false);

    // Inputs (local UI state)
    const [downPayment, setDownPayment] = useState<number>(Math.round((outputs.estimatedTotalCost ?? 250000) * 0.2));
    const [rate, setRate] = useState<number>(outputs.interestRate ?? 7.5);
    const [termMonths, setTermMonths] = useState<number>(outputs.termMonths ?? 360);

    // Fetch floorplan price if they selected one already
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

    // Cost model (today): use floorplan price if available, else fallback baseline
    // You can tweak these multipliers quickly.
    const estimatedTotalCost = useMemo(() => {
        if (floorplanPrice && floorplanPrice > 0) return floorplanPrice;

        // fallback if no floorplan selected yet
        // choose a conservative baseline so you don't underquote
        return outputs.estimatedTotalCost ?? 250000;
    }, [floorplanPrice, outputs.estimatedTotalCost]);

    const principal = Math.max(0, estimatedTotalCost - (downPayment || 0));
    const payment = useMemo(
        () => Math.round(monthlyPayment(principal, rate, termMonths)),
        [principal, rate, termMonths]
    );

    // Persist calculated outputs into global store
    useEffect(() => {
        setOutputs({
            estimatedTotalCost,
            monthlyPayment: payment,
            interestRate: rate,
            termMonths,
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [estimatedTotalCost, payment, rate, termMonths]);

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
                value={downPayment.toString()}
                onChange={(e) => setDownPayment(e.target.value ? Number(e.target.value) : 0)}
            />

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <div>
                    <label className="multistep">Interest rate (%)</label>
                    <input
                        className="multistep"
                        type="text"
                        value={rate.toString()}
                        onChange={(e) => setRate(e.target.value ? Number(e.target.value) : 0)}
                    />
                </div>
                <div>
                    <label className="multistep">Term</label>
                    <select
                        className="multistep"
                        value={termMonths}
                        onChange={(e) => setTermMonths(Number(e.target.value))}
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
                        <option value={180}>15 years</option>
                        <option value={240}>20 years</option>
                        <option value={360}>30 years</option>
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

            <p style={{ marginTop: "1rem", color: "var(--color-brand-dark-blue)", fontWeight: 700 }}>
                These numbers become contract-ready after your Formal Property Analysis.
            </p>
        </div>
    );
}
