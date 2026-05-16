"use client";

import React from "react";
import { usePresentationStore } from "@/lib/store/presentationStore";
import { REP_CONFIG } from "@/lib/config/repConfig";
import s from "./Slide2.module.css";
import { ProposalFooter } from "./_shared/ProposalFooter";

const TIMELINE_STEPS = [
    "Sign your ADU Agreement",
    "Pay your deposit",
    "Survey Team onsite",
    "Site plan & Schematic Design Review",
];

function formatDate(d: Date) {
    return d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

const ADU_LABEL: Record<string, string> = {
    detached: "Detached ADU",
    attached: "Attached ADU",
    garage: "Garage Conversion",
};

export function Slide2_FloorPlans() {
    const {
        propertyPhotoUrl,
        propertyAddress,
        customerName,
        aduType,
        floorplans,
        comparedUnitIds,
    } = usePresentationStore();

    const today = formatDate(new Date());

    const comparedUnits = floorplans.filter((fp) => comparedUnitIds.includes(fp._id));
    const displayUnits = comparedUnits.length > 0 ? comparedUnits : floorplans.slice(0, 3);

    const aduLabel = aduType ? ADU_LABEL[aduType] ?? aduType : "ADU";

    return (
        <div className={s.slide}>
            <div className={s.hero}>
                <img src="/images/hero-adu-optimized.webp" alt="" className={s.heroImg} />
                <div className={s.heroOverlay}>
                    <span className={s.heroEyebrow}>Backyard Estates</span>
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
                <div className={s.topRow}>
                    <section className={s.card}>
                        <header className={`${s.cardHeader} ${s.tealHeader}`}>Estate Details</header>
                        <div className={s.cardBody}>
                            <div className={s.detailsGrid}>
                                <div className={s.detailsPhotoCol}>
                                    {propertyPhotoUrl ? (
                                        <img src={propertyPhotoUrl} alt={propertyAddress || "Estate"} className={s.detailsPhoto} />
                                    ) : (
                                        <div className={s.detailsPhotoEmpty}>Property photo</div>
                                    )}
                                </div>
                                <dl className={s.detailsList}>
                                    {customerName && (
                                        <div className={s.detailItem}>
                                            <dt>Owner</dt>
                                            <dd>{customerName}</dd>
                                        </div>
                                    )}
                                    {propertyAddress && (
                                        <div className={s.detailItem}>
                                            <dt>Address</dt>
                                            <dd>{propertyAddress}</dd>
                                        </div>
                                    )}
                                    <div className={s.detailItem}>
                                        <dt>ADU Type</dt>
                                        <dd>{aduLabel}</dd>
                                    </div>
                                    <div className={s.detailItem}>
                                        <dt>Plans Compared</dt>
                                        <dd>{displayUnits.length}</dd>
                                    </div>
                                </dl>
                            </div>
                        </div>
                    </section>

                    <section className={s.card}>
                        <header className={`${s.cardHeader} ${s.tanHeader}`}>Floor Plans</header>
                        <div className={s.cardBody}>
                            {displayUnits.length > 0 ? (
                                <div
                                    className={s.plansGrid}
                                    style={{ gridTemplateColumns: `repeat(${displayUnits.length}, 1fr)` }}
                                >
                                    {displayUnits.map((fp) => (
                                        <div key={fp._id} className={s.planCard}>
                                            <div className={s.planName}>The {fp.name}</div>
                                            <div className={s.planSqftRow}>
                                                <span className={s.planSqftNum}>{fp.sqft?.toLocaleString() ?? "—"}</span>
                                                <span className={s.planSqftLabel}>sqft</span>
                                            </div>
                                            <div className={s.planBb}>
                                                <span>{fp.bed} bed</span>
                                                <span className={s.dotSep}>·</span>
                                                <span>{fp.bath} bath</span>
                                            </div>
                                            {fp.length && fp.width && (
                                                <div className={s.planDims}>{fp.length}' × {fp.width}'</div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className={s.emptyPlans}>Plans appear once selected in admin</div>
                            )}
                        </div>
                    </section>
                </div>

                <section className={`${s.card} ${s.timelineCard}`}>
                    <header className={`${s.cardHeader} ${s.tealHeader}`}>Timeline</header>
                    <div className={`${s.cardBody} ${s.timelineBody}`}>
                        <div className={s.timelineCurrent}>
                            <span className={s.timelineCurrentEyebrow}>Current</span>
                            <span className={s.timelineCurrentTitle}>ADU Proposal Review</span>
                        </div>
                        <span className={s.timelineArrow}>→</span>
                        <div className={s.timelineSteps}>
                            <span className={s.timelineStepsTitle}>Next Steps</span>
                            <ol className={s.timelineList}>
                                {TIMELINE_STEPS.map((step, i) => (
                                    <li key={step}>
                                        <span className={s.timelineNum}>{i + 1}.</span> {step}
                                    </li>
                                ))}
                            </ol>
                        </div>
                    </div>
                </section>
            </div>

            <ProposalFooter pageNum={2} pageTotal={9} />
        </div>
    );
}
