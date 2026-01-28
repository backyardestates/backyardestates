"use client";

import { useEffect } from "react";
import StepNav from "./StepNav";
import { FLOW, STEPS } from "@/lib/feasibility/flow";
import { isComplete } from "@/lib/feasibility/types";
import { useAnswersStore } from "@/lib/feasibility/stores/answers.store";
import { useNavStore } from "@/lib/feasibility/stores/nav.store";
import { useFeasibilityStore } from "@/lib/feasibility/store";

// steps
// import AduTypeStep from "./steps/";
// import PriorityStep from "./steps/vision/PriorityStep";

// import BedStep from "./steps2/floorplans/BedStep";
// import BathStep from "./steps2/floorplans/BathStep";
// import TimeframeStep from "./steps2/floorplans/TimeframeStep";
// import FloorplanPickStep from "./steps/Floorplans/Floorplans"; // keep your existing

// import RealityIncludedStep from "./steps2/reality/RealityIncludedStep";
// import RealityUpgradesStep from "./steps2/reality/RealityUpgradesStep";
// import SiteSpecificWorkStep from "./steps2/reality/SiteSpecificWorkStep";

import Finance from "./steps/Finance/Finance";
import Review from "./steps/Review/Review";
import GeneratePDF from "./steps/GeneratePDF/GeneratePDF";
import Motivation from "./steps/Motivation/Motivation";
import ADUType from "./steps/ADUType/ADUType";
import FloorplanStep from "./steps/Floorplans/Floorplans";
import FloorplansStep from "./steps/Floorplans/Floorplans";
import SiteSpecificWorkStep from "./steps/siteSpecific/SiteSpecificWorkStep";
import IncludedWork from "./steps/siteSpecific/IncludedWork";
import OptionalUpgrades from "./steps/siteSpecific/OptionalUpgrades";
import FinanceStep from "./steps/Finance/Finance";

// Motivation options (your existing copy)
const MOTIVATION_OPTIONS = [
    { value: "family", title: "Housing for family", desc: "Support parents, adult kids, or multi-generational living." },
    { value: "rental", title: "Rental income", desc: "Offset mortgage or build long-term investment value." },
    { value: "office", title: "Home office / studio", desc: "Dedicated space for work, clients, or creative focus." },
    { value: "guest", title: "Guest housing", desc: "Comfortable space for visitors without disrupting the main home." },
    { value: "value", title: "Increase property value", desc: "Add functional square footage and flexibility for the future." },
    { value: "other", title: "Other", desc: "Tell us what you’re trying to achieve—we’ll map the best path." },
];

const ADU_TYPE_OPTIONS = [
    { value: "detachedNew", title: "Detached New Construction", desc: "Stand-alone unit with maximum privacy & layout flexibility.", meta: "Best for: rentals + multi-gen living" },
    { value: "attachedNew", title: "Attached New Construction", desc: "Connected to the main home—often efficient utilities + footprint.", meta: "Best for: family + cost control" },
    { value: "garageConversion", title: "Garage Conversion", desc: "Fastest path when the structure works (and zoning supports it).", meta: "Best for: speed + budget" },
    { value: "jadu", title: "JADU (≤ 500 sq ft)", desc: "Within the primary structure—small footprint, big impact.", meta: "Best for: simple living + family support" },
]



function StepBody({
    id,
    onRealityJump,
}: {
    id: string;
    onRealityJump: (tab: 0 | 1 | 2) => void;
}) {
    switch (id) {
        case "motivation":
            return <Motivation options={MOTIVATION_OPTIONS} />;

        case "aduType":
            return <ADUType options={ADU_TYPE_OPTIONS} />;

        case "floorplansStep":
            return <FloorplansStep />;

        case "includedBrowse":
            return <IncludedWork onJump={onRealityJump} />;

        case "upgradesBrowse":
            return <OptionalUpgrades onJump={onRealityJump} />;

        case "riskFlags":
            return <SiteSpecificWorkStep onJump={onRealityJump} />;

        case "financeStep":
            return <FinanceStep />;

        case "reviewScreen":
            return <Review />;

        case "generatePdf":
            return <GeneratePDF />;

        default:
            return null;
    }
}



export default function FlowShell() {
    const answers = useAnswersStore((s) => s.answers);
    const setAnswer = useAnswersStore((s) => s.setAnswer);

    const cursor = useNavStore((s) => s.cursor);
    const goPrev = useNavStore((s) => s.goPrev);
    const goNext = useNavStore((s) => s.goNext);
    const goToStep = useNavStore((s) => s.goToStep);

    const q = FLOW[cursor];
    const canNext = isComplete(q, answers);

    // keep your mirroring into feasibility store for legacy components
    const setFeas = useFeasibilityStore((s) => s.set);
    const setOutputs = useFeasibilityStore((s) => s.setOutputs);

    const goToId = useNavStore((s) => s.goToId);

    const onRealityJump = (tab: 0 | 1 | 2) => {
        const idByTab = ["includedBrowse", "upgradesBrowse", "riskFlags"] as const;
        goToId(FLOW, idByTab[tab]);
    };


    useEffect(() => {
        if ("motivation" in answers) setFeas("motivation", answers.motivation);
        if ("aduType" in answers) setFeas("aduType", answers.aduType);
        if ("priority" in answers) setFeas("priority", answers.priority);

        if ("bed" in answers) setFeas("bed", Number(answers.bed));
        if ("bath" in answers) setFeas("bath", Number(answers.bath));
        if ("timeframe" in answers) setFeas("timeframe", answers.timeframe);

        if ("selectedFloorplanId" in answers) setFeas("selectedFloorplanId", answers.selectedFloorplanId);
        if ("riskFlags" in answers) setFeas("riskFlags", answers.riskFlags);

        if ("downPayment" in answers) setOutputs({ downPayment: Number(answers.downPayment) } as any);
        if ("interestRate" in answers) setOutputs({ interestRate: Number(answers.interestRate) } as any);
        if ("termMonths" in answers) setOutputs({ termMonths: Number(answers.termMonths) } as any);

        if ("name" in answers) setFeas("name", answers.name);
        if ("phone" in answers) setFeas("phone", answers.phone);
        if ("email" in answers) setFeas("email", answers.email);
        if ("address" in answers) setFeas("address", answers.address);
        if ("city" in answers) setFeas("city", answers.city);
    }, [answers, setFeas, setOutputs]);

    return (
        <div style={{ display: "grid", gap: "1rem" }}>
            <StepNav
                steps={STEPS}
                currentStep={q.step}
                onStepClick={(step) => goToStep(FLOW, step)}
            />

            <StepBody id={q.id} onRealityJump={onRealityJump} />

            <div style={{ display: "flex", gap: 12 }}>
                <button type="button" onClick={goPrev} disabled={cursor === 0}>
                    Back
                </button>

                <button
                    type="button"
                    onClick={() => canNext && goNext(FLOW, answers)}
                    disabled={!canNext}
                >
                    Next
                </button>
            </div>
        </div>
    );
}
