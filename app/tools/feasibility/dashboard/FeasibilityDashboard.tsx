"use client";

import { useMemo, useState } from "react";
import { useFeasibilityStore } from "@/lib/feasibility/store";

import Step2Vision from "../wizard/steps/Step2Vision";
import Step3RealityGap from "../wizard/steps/Step3RealityGap";
import Step5Finance from "../wizard/steps/Step5Finance";
import Step6Floorplan from "../wizard/steps/Step6Floorplan";
import Step7Review from "../wizard/steps/Step7Review";
import Step8Submit from "../wizard/steps/Step8Submit";
import style from "./page.module.css"
import { House, Circle, Check } from "lucide-react"

type StepKey =
    | "vision"
    | "reality"
    | "finance"
    | "floorplans"
    | "review"
    | "submit";

const stepMap: Record<
    StepKey,
    { title: string; Icon: React.FC; Component: React.FC }
> = {
    vision: {
        title: "Vision",
        Icon: House,
        Component: Step2Vision,
    },
    floorplans: {
        title: "Floorplans",
        Icon: House,
        Component: Step6Floorplan,
    },
    reality: {
        title: "Site-Specific Work",
        Icon: House,
        Component: Step3RealityGap,
    },
    finance: {
        title: "Finance",
        Icon: House,
        Component: Step5Finance,
    },
    review: {
        title: "Review",
        Icon: House,
        Component: Step7Review,
    },
    submit: {
        title: "Generate PDF",
        Icon: House,
        Component: Step8Submit,
    },
};

function missingRequiredFields(state: ReturnType<typeof useFeasibilityStore.getState>) {
    const missing: string[] = [];
    if (!state.name) missing.push("Name");
    if (!state.phone) missing.push("Phone");
    if (!state.email) missing.push("Email");
    if (!state.address) missing.push("Address");
    if (!state.city) missing.push("City");
    if (!state.aduType) missing.push("ADU type");
    if (state.bed == null) missing.push("Bedrooms");
    if (state.bath == null) missing.push("Bathrooms");
    if (!state.intendedUse) missing.push("Intended use");

    return missing;
}

export default function FeasibilityDashboard() {
    const store = useFeasibilityStore();
    const [active, setActive] = useState<StepKey>("vision");

    const missing = useMemo(() => missingRequiredFields(store), [store]);
    const ready = missing.length === 0;

    const ActiveComp = stepMap[active].Component;

    return (
        <div className={style.dashboard}>
            <div style={{ gridColumn: "2 / span 5" }}>
                <p className="small-caps">ADU Feasibility & Investment Engine™</p>
                {/* Grid of step cards */}
                <div className={style.stepGrid}>
                    {(Object.keys(stepMap) as StepKey[]).map((k) => {
                        const s = stepMap[k];
                        const isActive = active === k;
                        const Icon = s.Icon;
                        return (

                            <button
                                key={k}
                                className={`${style.stepCard} ${isActive ? style.stepCardActive : ""}`}
                                onClick={() => setActive(k)}
                            >
                                <div className={style.stepCardDesc}><Icon /></div>
                                <div className={style.stepCardTitle}>{s.title}</div>
                                <span className={style.stepCardStatus}>{missing ? <Check className={style.stepCardIcon} /> : <Circle className={style.stepCardIcon} />}</span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Active step panel */}
            <div className={style.rightCol}>
                <div className={style.panel}>
                    <p className="small-caps" style={{ textAlign: "left" }}>
                        {stepMap[active].title}
                    </p>
                    <div style={{ marginTop: "1rem" }}>
                        <ActiveComp />
                    </div>
                </div>
            </div>
        </div>
    );
}
