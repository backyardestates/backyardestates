"use client";

import { useFeasibilityStore } from "@/lib/feasibility/store";

export default function Step2Vision() {
    const { aduType, bed, bath, intendedUse, set } = useFeasibilityStore();

    return (
        <div>
            <label className="multistep">ADU Type</label>
            <div className="multistep buttons">
                {[
                    { v: "attached", label: "Attached ADU" },
                    { v: "detached", label: "Detached ADU" },
                    { v: "garageConversion", label: "Garage Conversion" },
                ].map((o) => (
                    <button
                        key={o.v}
                        className="multistep button"
                        onClick={() => set("aduType", o.v as any)}
                        style={{
                            background: aduType === o.v ? "var(--color-brand-beige)" : "var(--color-brand-dark-blue)",
                        }}
                    >
                        {o.label}
                    </button>
                ))}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginTop: "1rem" }}>
                <div>
                    <label className="multistep">Bedrooms</label>
                    <input
                        className="multistep"
                        type="text"
                        value={bed ?? ""}
                        onChange={(e) => set("bed", e.target.value ? Number(e.target.value) : null)}
                    />
                </div>
                <div>
                    <label className="multistep">Bathrooms</label>
                    <input
                        className="multistep"
                        type="text"
                        value={bath ?? ""}
                        onChange={(e) => set("bath", e.target.value ? Number(e.target.value) : null)}
                    />
                </div>
            </div>

            <label className="multistep" style={{ marginTop: "1rem" }}>
                Intended Use
            </label>
            <div className="multistep buttons">
                {[
                    { v: "family", label: "Family" },
                    { v: "investment", label: "Investment (rental)" },
                    { v: "both", label: "Both" },
                ].map((o) => (
                    <button
                        key={o.v}
                        className="multistep button"
                        onClick={() => set("intendedUse", o.v as any)}
                        style={{
                            background: intendedUse === o.v ? "var(--color-brand-beige)" : "var(--color-brand-dark-blue)",
                        }}
                    >
                        {o.label}
                    </button>
                ))}
            </div>
        </div>
    );
}
