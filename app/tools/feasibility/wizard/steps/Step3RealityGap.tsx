"use client";

import { useFeasibilityStore } from "@/lib/feasibility/store";

const flags = [
    { key: "utilities", label: "Utilities (water/sewer/power)", detail: "Can change cost by $10k–$40k" },
    { key: "soils", label: "Soils & slope", detail: "Foundation & engineering impact" },
    { key: "easements", label: "Easements", detail: "Can eliminate layouts" },
    { key: "fire", label: "Fire access", detail: "Can change entire design" },
    { key: "setbacks", label: "Setbacks", detail: "Determines max size" },
    { key: "existing", label: "Existing structures", detail: "Demo/relocation changes scope" },
];

export default function Step3RealityGap() {
    const { riskFlags, toggleRisk } = useFeasibilityStore();

    return (
        <div>
            <p className="intro" style={{ fontSize: "1.1rem", marginBottom: "1rem", color: "var(--color-neutral-600)" }}>
                Your property still has unknown variables. We resolve them through a Formal Property Analysis (architects + engineers).
            </p>

            <div style={{ display: "grid", gap: ".75rem" }}>
                {flags.map((f) => {
                    const active = riskFlags.includes(f.key);
                    return (
                        <button
                            key={f.key}
                            className="multistep button"
                            onClick={() => toggleRisk(f.key)}
                            style={{
                                textAlign: "left",
                                height: "auto",
                                padding: "1rem 1.25rem",
                                background: active ? "var(--color-brand-beige)" : "var(--color-neutral-0)",
                                color: active ? "white" : "var(--color-brand-dark-blue)",
                                border: active ? "none" : "2px solid var(--color-neutral-100)",
                            }}
                        >
                            <div style={{ fontWeight: 700 }}>{f.label}</div>
                            <div style={{ opacity: 0.9 }}>{f.detail}</div>
                        </button>
                    );
                })}
            </div>

            <p style={{ marginTop: "1rem", color: "var(--color-neutral-600)" }}>
                <b>Key point:</b> any “price” without this analysis is a guess.
            </p>
        </div>
    );
}
