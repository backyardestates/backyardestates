"use client";

import { useState } from "react";
import { useFeasibilityStore } from "@/lib/feasibility/store";

export default function GeneratePDF() {
    const state = useFeasibilityStore();
    const [loading, setLoading] = useState(false);
    const [pdfUrl, setPdfUrl] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const { name, phone, email, address, city, set } = useFeasibilityStore();

    const submit = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch("/api/feasibility/submit", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: state.name,
                    phone: state.phone,
                    email: state.email,
                    address: state.address,
                    city: state.city,
                    aduType: state.aduType,
                    bed: state.bed,
                    bath: state.bath,
                    intendedUse: state.intendedUse,
                    selectedFloorplanId: state.selectedFloorplanId,
                    riskFlags: state.riskFlags,
                    outputs: state.outputs,
                }),
            });
            const json = await res.json();
            if (!res.ok) throw new Error(json?.error || "Submission failed");
            setPdfUrl(json.pdfUrl);
        } catch (e: any) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <p style={{ color: "var(--color-neutral-600)", marginBottom: "1rem" }}>
                Generate your branded report to bring to the open house. This takes a few seconds.
            </p>
            <div>
                <p className="intro" style={{ fontSize: "1.1rem", marginBottom: "1rem", color: "var(--color-neutral-600)" }}>
                    We already know 40–60% of what determines cost + timeline just from your address.
                </p>

                <label className="multistep">Name</label>
                <input className="multistep" type="text" value={name} onChange={(e) => set("name", e.target.value)} />

                <label className="multistep">Phone</label>
                <input className="multistep" type="text" value={phone} onChange={(e) => set("phone", e.target.value)} />

                <label className="multistep">Email</label>
                <input className="multistep" type="text" value={email} onChange={(e) => set("email", e.target.value)} />

                <label className="multistep">Property Address</label>
                <input className="multistep" type="text" value={address} onChange={(e) => set("address", e.target.value)} />

                <label className="multistep">City</label>
                <input className="multistep" type="text" value={city} onChange={(e) => set("city", e.target.value)} />
            </div>

            {error ? <p className="multistep error">{error}</p> : null}

            <button className="multistep button" onClick={submit} disabled={loading}>
                {loading ? "Generating…" : "Generate my Feasibility Report PDF"}
            </button>

            {pdfUrl ? (
                <div style={{ marginTop: "1rem" }}>
                    <p style={{ fontWeight: 700, color: "var(--color-brand-dark-blue)" }}>Your report is ready ✅</p>
                    <a href={pdfUrl} target="_blank" rel="noreferrer" style={{ color: "var(--color-blue)" }}>
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
