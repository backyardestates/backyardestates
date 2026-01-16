"use client";

import { useMemo, useState } from "react";
import { useFeasibilityStore } from "@/lib/feasibility/store";

import Step2Vision from "./steps/Step2Vision";
import Step3RealityGap from "./steps/Step3RealityGap";
import Step5Finance from "./steps/Step5Finance";
import Step6Floorplan from "./steps/Step6Floorplan";
import Step7Review from "./steps/Step7Review";
import Step8Submit from "./steps/Step8Submit";

const steps = [
    { title: "Build your vision", Component: Step2Vision },
    { title: "What we still don’t know (yet)", Component: Step3RealityGap },
    { title: "Financing snapshot", Component: Step5Finance },
    { title: "Recommended floorplans", Component: Step6Floorplan },
    { title: "Your summary", Component: Step7Review },
    { title: "Generate your report", Component: Step8Submit },
];

export default function FeasibilityWizard() {
    const [i, setI] = useState(0);
    const { address, city, aduType, bed, bath, intendedUse } = useFeasibilityStore();

    const confidence = useMemo(() => {
        // Simple “wow” meter: increases as they provide key fields
        let score = 40;
        if (address && city) score += 10;
        if (aduType) score += 10;
        if (bed !== null && bath !== null) score += 10;
        if (intendedUse) score += 5;
        if (score > 72) score = 72; // stays <100 until Formal Property Analysis
        return score;
    }, [address, city, aduType, bed, bath, intendedUse]);

    const Step = steps[i].Component;

    return (
        <div className="centered">
            <div style={{ gridColumn: "2 / span 10" }}>
                <p className="small-caps">ADU Feasibility & Investment Engine™</p>
                <h2 className="multistep">{steps[i].title}</h2>

                <div style={{ marginBottom: "1rem" }}>
                    <p style={{ color: "var(--color-neutral-600)", marginBottom: ".25rem" }}>
                        Confidence in your project: <b>{confidence}%</b> (100% after Formal Property Analysis)
                    </p>
                    <div
                        style={{
                            height: 10,
                            width: "100%",
                            background: "var(--color-neutral-100)",
                            borderRadius: 999,
                            overflow: "hidden",
                        }}
                    >
                        <div
                            style={{
                                height: 10,
                                width: `${confidence}%`,
                                background: "var(--color-brand-beige)",
                            }}
                        />
                    </div>
                </div>

                <Step />

                <div className="multistep buttons" style={{ marginTop: "1rem" }}>
                    <button
                        className="multistep button"
                        onClick={() => setI((v) => Math.max(0, v - 1))}
                        disabled={i === 0}
                        style={{ opacity: i === 0 ? 0.6 : 1 }}
                    >
                        Back
                    </button>

                    <button
                        className="multistep button"
                        onClick={() => setI((v) => Math.min(steps.length - 1, v + 1))}
                        disabled={i === steps.length - 1}
                        style={{ opacity: i === steps.length - 1 ? 0.6 : 1 }}
                    >
                        Next
                    </button>
                </div>
            </div>
        </div>
    );
}
