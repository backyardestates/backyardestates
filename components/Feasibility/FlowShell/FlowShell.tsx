"use client";

import { useEffect } from "react";
import StepNav from "../StepNav";
import { FLOW, STEPS } from "@/lib/feasibility/flow";
import { isComplete } from "@/lib/feasibility/types";
import { useAnswersStore } from "@/lib/feasibility/stores/answers.store";
import { useNavStore } from "@/lib/feasibility/stores/nav.store";
import { useFeasibilityStore } from "@/lib/feasibility/store";

import Review from "../steps/Review/Review";
import Motivation from "../steps/Motivation/Motivation";
import ADUType from "../steps/ADUType/ADUType";
import FloorplansStep from "../steps/Floorplans/Floorplans";
import SiteSpecificWorkStep from "../steps/siteSpecific/SiteSpecificWorkStep";
import IncludedWork from "../steps/siteSpecific/IncludedWork";
import OptionalUpgrades from "../steps/siteSpecific/OptionalUpgrades";
import FinanceStatusStep from "../steps/Finance/FinanceStatusStep";
import FinanceAssumptionsStep from "../steps/Finance/FinanceAssumptionsStep";
import FinancePathStep from "../steps/Finance/FinancePath";
import ContactStep from "../steps/Contact/Contact";

import styles from "./FlowShell.module.css";

const MOTIVATION_OPTIONS = [
    { value: "family", title: "Housing for family", desc: "Support parents, adult kids, or multi-generational living." },
    { value: "rental", title: "Rental income", desc: "Offset mortgage or build long-term investment value." },
    { value: "office", title: "Home office / studio", desc: "Dedicated space for work, clients, or creative focus." },
    { value: "guest", title: "Guest housing", desc: "Comfortable space for visitors without disrupting the main home." },
    { value: "value", title: "Increase property value", desc: "Add functional square footage and flexibility for the future." },
    { value: "other", title: "Other", desc: "Tell us what you’re trying to achieve—we’ll map the best path." },
];

const ADU_TYPE_OPTIONS = [
    {
        value: "detachedNew",
        title: "Detached New Construction",
        desc: "Stand-alone unit with maximum privacy & layout flexibility.",
        meta: "Best for: rentals + multi-gen living",
    },
    {
        value: "attachedNew",
        title: "Attached New Construction",
        desc: "Connected to the main home—often efficient utilities + footprint.",
        meta: "Best for: family + cost control",
    },
    {
        value: "garageConversion",
        title: "Garage Conversion",
        desc: "Fastest path when the structure works (and zoning supports it).",
        meta: "Best for: speed + budget",
    },
    {
        value: "jadu",
        title: "JADU (≤ 500 sq ft)",
        desc: "Within the primary structure—small footprint, big impact.",
        meta: "Best for: simple living + family support",
    },
];

function StepBody({
    id,
    onRealityJump,
    onFinanceJump,
}: {
    id: string;
    onRealityJump: (tab: 0 | 1 | 2) => void;
    onFinanceJump: (tab: 0 | 1 | 2) => void;
}) {
    switch (id) {
        case "property":
            return <ContactStep />;

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

        case "financeStatus":
            return <FinanceStatusStep onJump={onFinanceJump} />;

        case "financePath":
            return <FinancePathStep onJump={onFinanceJump} />;

        case "financeAssumptions":
            return <FinanceAssumptionsStep onJump={onFinanceJump} />;

        case "reviewScreen":
            return <Review />;

        default:
            return null;
    }
}

export default function FlowShell() {
    const answers = useAnswersStore((s) => s.answers);

    const cursor = useNavStore((s) => s.cursor);
    const goPrev = useNavStore((s) => s.goPrev);
    const goNext = useNavStore((s) => s.goNext);
    const goToStep = useNavStore((s) => s.goToStep);
    const goToId = useNavStore((s) => s.goToId);

    const q = FLOW[cursor];
    const canNext = isComplete(q, answers);

    // keep your mirroring into feasibility store for legacy components
    const setFeas = useFeasibilityStore((s) => s.set);
    const setOutputs = useFeasibilityStore((s) => s.setOutputs);

    const onRealityJump = (tab: 0 | 1 | 2) => {
        const idByTab = ["includedBrowse", "upgradesBrowse", "riskFlags"] as const;
        goToId(FLOW, idByTab[tab]);
    };

    const onFinanceJump = (tab: 0 | 1 | 2) => {
        const idByTab = ["financeStatus", "financePath", "financeAssumptions"] as const;
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

        if ("downPayment" in answers) setOutputs({ downPayment: Number((answers as any).downPayment) } as any);
        if ("interestRate" in answers) setOutputs({ interestRate: Number((answers as any).interestRate) } as any);
        if ("termMonths" in answers) setOutputs({ termMonths: Number((answers as any).termMonths) } as any);

        if ("name" in answers) setFeas("name", answers.name);
        if ("phone" in answers) setFeas("phone", answers.phone);
        if ("email" in answers) setFeas("email", answers.email);
        if ("address" in answers) setFeas("address", answers.address);
    }, [answers, setFeas, setOutputs]);

    return (
        <section className={styles.shell} aria-label="Feasibility flow">
            <div className={styles.inner}>
                {/* Sticky progress navigation */}
                <div className={styles.navSticky}>
                    <StepNav steps={STEPS} currentStep={q.step} onStepClick={(step) => goToStep(FLOW, step)} />
                </div>

                {/* Step content */}
                <div className={styles.body}>
                    <StepBody id={q.id} onRealityJump={onRealityJump} onFinanceJump={onFinanceJump} />
                </div>

                {/* Bottom controls */}
                <footer className={styles.controls} aria-label="Step controls">
                    <div className={styles.controlsLeft}>
                        <button
                            type="button"
                            className={`${styles.btn} ${styles.btnSecondary}`}
                            onClick={goPrev}
                            disabled={cursor === 0}
                        >
                            Back
                        </button>
                    </div>
                    <div className={styles.controlsHint}>
                        {canNext ? (
                            <span className={styles.hintOk}>Ready</span>
                        ) : (
                            <span className={styles.hintWarn}>Complete this step to continue</span>
                        )}
                    </div>

                    <div className={styles.controlsRight}>
                        <button
                            type="button"
                            className={`${styles.btn} ${styles.btnPrimary}`}
                            onClick={() => canNext && goNext(FLOW, answers)}
                            disabled={!canNext}
                            aria-disabled={!canNext}
                        >
                            Next
                        </button>


                    </div>
                </footer>
            </div>
        </section>
    );
}
