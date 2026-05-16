"use client";

import React from "react";
import { usePresentationStore } from "@/lib/store/presentationStore";
import { REP_CONFIG } from "@/lib/config/repConfig";
import s from "./Slide3.module.css";
import { ProposalFooter } from "./_shared/ProposalFooter";

const PRE_CONSTRUCTION = [
    "Site plan visits",
    "Floor plan and site plan design & review",
    "Architectural, schematic and title 24",
    "Homeowner plan review and sign off",
    "Plan set completion",
    "Permit submittal",
    "Standard city fees and re-submittals",
    "Standard utility, school and department submittals",
    "Plan approval and permit pick up",
];

const CONSTRUCTION = [
    "Rough grading",
    "Below grade rough plumbing",
    "Trenching for electrical, sewer and water",
    "Unit construction",
    "Insulation per title 24",
    "Primary panel upgrade with 100A sub panel",
    "Mini-split HVAC system",
    "Finish MEPs",
];

function formatDate(d: Date) {
    return d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

export function Slide3_YourProperty() {
    const { propertyAddress, propertyPhotoUrl, siteWorkTagsByUnitId, comparedUnitIds } = usePresentationStore();
    const today = formatDate(new Date());

    const siteTags = Array.from(new Set(
        comparedUnitIds.flatMap((id) => siteWorkTagsByUnitId[id] ?? [])
    ));

    return (
        <div className={s.slide}>
            <div className={s.hero}>
                <img src="/images/hero-adu-optimized.webp" alt="" className={s.heroImg} />
                <div className={s.heroOverlay}>
                    <span className={s.heroEyebrow}>Backyard Estates</span>
                    <h1 className={s.heroTitle}>Your Property</h1>
                </div>
            </div>

            <div className={s.meta}>
                <span>ADU Proposal</span>
                <span className={s.metaSep}>|</span>
                <span>Date: {today}</span>
                <span className={s.metaSep}>|</span>
                <span>{REP_CONFIG.licenseContractor}</span>
                <span className={s.metaSep}>|</span>
                <span>{REP_CONFIG.licenseDealership}</span>
            </div>

            <div className={s.body}>
                <div className={s.contentGrid}>
                    <section className={s.photoPanel}>
                        <header className={s.panelHeader}>Site Plan</header>
                        <div className={s.photoArea}>
                            {propertyPhotoUrl ? (
                                <img src={propertyPhotoUrl} alt={propertyAddress || "Site"} className={s.sitePhoto} />
                            ) : (
                                <div className={s.sitePlaceholder}>
                                    <span className={s.sitePlaceholderText}>
                                        {propertyAddress || "Site plan will appear here"}
                                    </span>
                                </div>
                            )}
                        </div>
                        {siteTags.length > 0 && (
                            <div className={s.findings}>
                                <span className={s.findingsLabel}>Site findings</span>
                                <div className={s.findingsRow}>
                                    {siteTags.map((tag) => (
                                        <span key={tag} className={s.findingTag}>{tag}</span>
                                    ))}
                                </div>
                            </div>
                        )}
                    </section>

                    <section className={s.overviewPanel}>
                        <header className={s.panelHeader}>Permitting and Site Work Overview</header>
                        <div className={s.overviewBody}>
                            <div className={s.overviewCol}>
                                <h3 className={s.colTitle}>Pre-Construction</h3>
                                <ul className={s.bullets}>
                                    {PRE_CONSTRUCTION.map((item) => (
                                        <li key={item}>{item}</li>
                                    ))}
                                </ul>
                            </div>
                            <div className={s.overviewDivider} />
                            <div className={s.overviewCol}>
                                <h3 className={s.colTitle}>Construction</h3>
                                <ul className={s.bullets}>
                                    {CONSTRUCTION.map((item) => (
                                        <li key={item}>{item}</li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </section>
                </div>
            </div>

            <ProposalFooter pageNum={3} pageTotal={9} />
        </div>
    );
}
