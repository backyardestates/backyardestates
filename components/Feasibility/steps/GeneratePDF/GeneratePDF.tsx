"use client";

import { useState } from "react";
import { useAnswersStore } from "@/lib/feasibility/stores/answers.store";

export default function GeneratePDFStep() {
    const answers = useAnswersStore((s) => s.answers);
    const setAnswer = useAnswersStore((s) => s.setAnswer);

    const [loading, setLoading] = useState(false);
    const [pdfUrl, setPdfUrl] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const submit = async () => {
        setLoading(true);
        setError(null);
        console.log(answers)
        try {
            const res = await fetch("/api/feasibility/submit", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: answers.name,
                    phone: answers.phone,
                    email: answers.email,
                    address: answers.address,
                    city: answers.city,

                    motivation: answers.motivation,
                    motivationOther: answers.motivationOther,

                    aduType: answers.aduType,
                    bed: answers.bed,
                    bath: answers.bath,
                    timeframe: answers.timeframe,

                    selectedFloorplanId: answers.selectedFloorplanId,

                    // NEW: these matter for the report
                    optionalUpgrades: answers.optionalUpgrades ?? {},
                    siteSpecific: answers.siteSpecific ?? {},
                    finance: answers.finance ?? {},

                    // legacy
                    riskFlags: answers.riskFlags ?? [],
                    outputs: answers.outputs ?? {},
                }),
            });

            const json = await res.json();
            if (!res.ok) throw new Error(json?.error || "Submission failed");
            setPdfUrl(json.pdfUrl);

            // optionally persist to answers too
            setAnswer("pdfUrl", json.pdfUrl);
        } catch (e: any) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            {error ? <p className="multistep error">{error}</p> : null}

            <button className="multistep button" onClick={submit} disabled={loading}>
                {loading ? "Generating…" : "Generate my Feasibility Report PDF"}
            </button>

            {(pdfUrl || answers.pdfUrl) ? (
                <div style={{ marginTop: "1rem" }}>
                    <p style={{ fontWeight: 700, color: "var(--color-brand-dark-blue)" }}>Your report is ready ✅</p>
                    <a href={(pdfUrl || answers.pdfUrl) as string} target="_blank" rel="noreferrer" style={{ color: "var(--color-blue)" }}>
                        Open / Download PDF
                    </a>
                    <p style={{ marginTop: ".75rem", color: "var(--color-neutral-600)" }}>
                        Next step: book your <b>Formal Property Analysis</b> at the open house to lock real numbers.
                    </p>
                </div>
            ) : null}
        </div>
    );
}
