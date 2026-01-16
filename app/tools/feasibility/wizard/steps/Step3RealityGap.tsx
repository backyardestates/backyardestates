"use client";

import { useMemo, useState } from "react";
import { useFeasibilityStore } from "@/lib/feasibility/store";
import styles from "./page.module.css";

type CategoryKey =
    | "utilities"
    | "soils"
    | "engineering"
    | "access"
    | "drainage"
    | "fire";

type Category = {
    key: CategoryKey;
    title: string;
    why: string;
    questions: string[];
};

const CATEGORIES: Category[] = [
    {
        key: "utilities",
        title: "🔌 Utilities",
        why: "Can change project cost by $10,000–$40,000+",
        questions: [
            "Do you need a new water meter or upgrade? (often $5k–$10k+)",
            "Is the sewer line accessible — or does it require trenching or an ejector pump?",
            "Can your electrical panel support the ADU — or does it need a 200-amp upgrade/relocation?",
        ],
    },
    {
        key: "soils",
        title: "🧱 Soils, Slope & Foundation",
        why: "Drives engineering, excavation, and foundation cost",
        questions: [
            "Is a soils report required by the city or due to liquefaction risk?",
            "Is the site sloped enough to require grading plans or taller foundations?",
            "Are there access limitations that force mini equipment or hand work?",
        ],
    },
    {
        key: "engineering",
        title: "📐 Site Constraints That Trigger Engineering",
        why: "Turns a “simple build” into full engineering + plan sets",
        questions: [
            "Does your property require a survey due to elevation changes or lot conditions?",
            "Will the city require grading plans or a soils report because of slope/liquefaction zones?",
            "Are there easements that trigger an encroachment permit?",
            "Is the foundation required to be taller than 1’, changing structural design and cost?",
        ],
    },
    {
        key: "access",
        title: "🚧 Construction Access & Hidden Labor Multipliers",
        why: "Changes equipment, labor, and daily cost",
        questions: [
            "Can standard equipment access your backyard — or will we need mini equipment (clearance under 6 ft)?",
            "Will concrete need to be cut, removed, and re-poured to run utilities?",
            "Do utility runs require long trenching distances across the property?",
            "Will fences, gates, or hardscape need removal/rebuild just for construction access?",
        ],
    },
    {
        key: "drainage",
        title: "🚿 Drainage, Water Management & Inspection Surprises",
        why: "Can trigger unplanned scope after inspections",
        questions: [
            "Will the city require drainage lines, rain gardens, or water mitigation?",
            "Are gutters or downspout systems required due to roof size or slope?",
            "Could inspections require added doors, access steps, or temporary protections before final sign-off?",
        ],
    },
    {
        key: "fire",
        title: "🔥 Fire & Code Triggers You Don’t See Coming",
        why: "Can force material changes and system upgrades",
        questions: [
            "Does your property require a fire flow test before permit approval?",
            "Are fire sprinklers mandated based on access/distance/jurisdiction?",
            "Do windows, eaves, or vents need to be fire-rated or tempered?",
            "Does roof slope or ceiling height trigger additional structural/fire requirements?",
        ],
    },
];

function scoreSignals(selected: string[]) {
    if (selected.length >= 5) return { label: "High" as const };
    if (selected.length >= 3) return { label: "Medium" as const };
    if (selected.length >= 1) return { label: "Low" as const };
    return { label: "Unknown" as const };
}

function confidenceFromSelected(n: number) {
    // More selected unknowns => lower confidence. This is a persuasion “meter”.
    // 0 selected -> ~78% (still not 100% because we haven’t visited the site)
    // 6 selected -> ~48%
    const base = 78;
    const dropPer = 5; // each selected reduces confidence by 5%
    return Math.max(35, Math.min(78, base - n * dropPer));
}

export default function Step3RealityGap() {
    const { riskFlags, toggleRisk, address, city } = useFeasibilityStore();
    const [openKey, setOpenKey] = useState<CategoryKey | null>("utilities");

    const selectedCount = riskFlags.length;
    const signal = useMemo(() => scoreSignals(riskFlags), [riskFlags]);

    const headline = useMemo(() => {
        if (!address && !city) return "This is why we do a Formal Property Analysis.";
        return `This is why ${city ? `projects in ${city}` : "your project"} need a Formal Property Analysis.`;
    }, [address, city]);

    const signalClass =
        signal.label === "High"
            ? styles.badgeHigh
            : signal.label === "Medium"
                ? styles.badgeMedium
                : signal.label === "Low"
                    ? styles.badgeLow
                    : styles.badgeUnknown;

    const confidencePct = useMemo(() => confidenceFromSelected(selectedCount), [selectedCount]);

    const selectedLabel =
        selectedCount === 0
            ? "No unknowns selected yet"
            : selectedCount === 1
                ? "1 unknown selected"
                : `${selectedCount} unknowns selected`;

    return (
        <div className={styles.step}>
            {/* ===== Header / framing ===== */}


            {/* ===== Category accordion cards ===== */}
            <div className={styles.accordionGrid}>
                {CATEGORIES.map((c) => {
                    const active = riskFlags.includes(c.key);
                    const open = openKey === c.key;

                    return (
                        <div key={c.key} className={`${styles.accordionItem} ${active ? styles.accordionItemActive : ""}`}>
                            <button
                                type="button"
                                className={`${styles.accordionHeader} ${open ? styles.accordionHeaderOpen : ""}`}
                                onClick={() => setOpenKey(open ? null : c.key)}
                            >
                                <div className={styles.accordionHeaderInner}>
                                    <div className={styles.accordionLeft}>
                                        <div className={styles.accordionTitleRow}>
                                            <div className={styles.accordionTitle}>{c.title}</div>

                                            {/* Chip that behaves like a fast toggle without opening */}
                                            <span
                                                className={`${styles.pill} ${active ? styles.pillActive : ""}`}
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                    toggleRisk(c.key);
                                                }}
                                                role="button"
                                                tabIndex={0}
                                                onKeyDown={(e) => {
                                                    if (e.key === "Enter" || e.key === " ") {
                                                        e.preventDefault();
                                                        toggleRisk(c.key);
                                                    }
                                                }}
                                                aria-label={active ? "Remove selection" : "Mark as might apply"}
                                                title={active ? "Click to remove" : "Click if this might apply"}
                                            >
                                                {active ? "Applies" : "Might apply"}
                                            </span>
                                        </div>

                                        <div className={styles.accordionWhy}>{c.why}</div>
                                    </div>

                                    <div className={styles.accordionMeta}>
                                        <span className={styles.plusMinus}>{open ? "–" : "+"}</span>
                                    </div>
                                </div>
                            </button>

                            {open ? (
                                <div className={styles.accordionBody}>
                                    <p className={styles.helperText}>
                                        Critical questions we verify on-site:
                                    </p>

                                    <ol className={styles.questionList}>
                                        {c.questions.map((q) => (
                                            <li key={q} className={styles.questionItem}>
                                                {q}
                                            </li>
                                        ))}
                                    </ol>

                                    <div className={styles.actionsRow}>
                                        <button
                                            type="button"
                                            className={`${styles.optionButton} ${active ? styles.optionButtonDark : styles.optionButtonAlt}`}
                                            onClick={() => toggleRisk(c.key)}
                                        >
                                            {active ? "Remove from my property" : "This might apply to my property"}
                                        </button>

                                        <button
                                            type="button"
                                            className={`${styles.smallButton} ${styles.smallButtonGhost}`}
                                            onClick={() => setOpenKey(null)}
                                        >
                                            Collapse
                                        </button>
                                    </div>
                                </div>
                            ) : null}
                        </div>
                    );
                })}
            </div>

            {/* <div className={`${styles.heroCard}`}>
                <div className={styles.heroTop}>
                    <div>
                        <p className={styles.heroEyebrow}>Site-specific characteristics</p>
                        <p className={styles.heroHeadline}>{headline}</p>
                        <p className={styles.heroSubhead}>
                            Pick anything that might apply. Each “unknown” is where surprise costs, delays, and change orders come from.
                            Our Formal Property Analysis turns unknowns into <b>verified facts</b>.
                        </p>
                    </div>

                    <div className={styles.heroRight}>
                        <div className={styles.metricStack}>
                            <div className={styles.metricCard}>
                                <div className={styles.metricLabel}>Confidence (pre-site)</div>
                                <div className={styles.metricValue}>{confidencePct}%</div>
                                <div className={styles.progressWrap} aria-hidden="true">
                                    <div className={styles.progressBar} style={{ width: `${confidencePct}%` }} />
                                </div>
                                <div className={styles.metricHint}>
                                    100% confidence happens after the <b>Formal Property Analysis</b>.
                                </div>
                            </div>

                            <div className={styles.badgeRow}>
                                <div className={styles.badge}>{selectedLabel}</div>
                                <div className={`${styles.badge} ${styles.badgeSignal} ${signalClass}`}>
                                    Potential Added Cost: {signal.label}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className={styles.heroDivider} />
            </div> */}

            {/* ===== Conversion close ===== */}
            <div className={`${styles.card} ${styles.cardShadow}`}>
                <div className={styles.closeTop}>
                    <div>
                        <p className={styles.sectionTitle}>What this means for your quote</p>
                        <p className={styles.helperText}>
                            Without verifying these site-specific variables, any “price” is a range — and ranges create{" "}
                            <b>change orders, delays, and stress</b>. The assessment is how we lock the real scope before you commit.
                        </p>
                    </div>

                    {/* <div className={styles.closeBadge}>
                        <div className={styles.closeBadgeTitle}>Confidence after assessment</div>
                        <div className={styles.closeBadgeValue}>100%</div>
                    </div> */}
                </div>

                <div className={styles.compareGrid}>
                    <div className={styles.compareCard}>
                        <p className={styles.cardTitle}>Without Formal Property Analysis</p>
                        <ul className={styles.bulletList}>
                            <li>Guess pricing</li>
                            <li>Timeline shifts</li>
                            <li>Change orders</li>
                            <li>Late “inspection surprises”</li>
                            <li>Budget anxiety</li>
                        </ul>
                    </div>

                    <div className={styles.compareCard}>
                        <p className={styles.cardTitle}>With Formal Property Analysis</p>
                        <ul className={styles.bulletList}>
                            <li>Real feasibility confirmed</li>
                            <li>Accurate scope + site plan assumptions</li>
                            <li>Pricing you can trust</li>
                            <li>Predictable timeline</li>
                            <li>Near-zero change orders</li>
                        </ul>
                    </div>
                </div>

                <div className={styles.callout}>
                    <p className={styles.calloutText}>
                        Any number given without a Formal Property Analysis is <b>marketing</b> — not construction.
                    </p>
                    <p className={styles.helperText}>
                        Book the assessment to move from <b>{signal.label}</b> uncertainty to <b>contract-ready clarity</b>.
                    </p>
                </div>
            </div>
        </div>
    );
}
