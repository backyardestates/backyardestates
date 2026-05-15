"use client";

import React from "react";
import { usePresentationStore } from "@/lib/store/presentationStore";
import s from "./Slide2.module.css";

const ADU_INFO: Record<string, string> = {
    attached: "We handle the tie-in, firewall, and exterior matching.",
    garage: "We handle the conversion, structural requirements, and all permits.",
};

export function Slide2_YourProperty() {
    const { customerName, propertyAddress, aduType, propertyPhotoUrl, floorplans, comparedUnitIds, siteWorkTagsByUnitId } = usePresentationStore();

    const aduLabel = aduType
        ? ({ detached: "Detached ADU", attached: "Attached ADU", garage: "Garage Conversion" }[aduType] ?? aduType)
        : "ADU";
    const infoText = aduType ? ADU_INFO[aduType] : null;

    const comparedUnits = floorplans.filter((fp) => comparedUnitIds.includes(fp._id));
    const allSiteTags = Array.from(new Set(
        comparedUnitIds.flatMap((id) => siteWorkTagsByUnitId[id] ?? [])
    )).slice(0, 8);

    return (
        <div className={s.slide}>
            <div className="slide-header">
                <span className="slide-header-title" style={{ textTransform: "uppercase", letterSpacing: "0.5px" }}>Your Property</span>
                <span style={{ fontSize: "var(--p-xs)", color: "var(--p-text-white-50)" }}>{propertyAddress}</span>
            </div>

            <div className={s.body}>
                {/* LEFT: photo */}
                <div className={s.photoPanel}>
                    {propertyPhotoUrl ? (
                        <img src={propertyPhotoUrl} alt="Property" className={s.photoImg} />
                    ) : (
                        <div className={s.photoPlaceholder}>
                            <span style={{ fontSize: 48, opacity: 0.10 }}>🏡</span>
                            <span className={s.photoPlaceholderText}>Upload property photo in Step 1</span>
                        </div>
                    )}
                </div>

                {/* RIGHT: info */}
                <div className={s.infoPanel}>
                    <div className={s.sectionLabel}>ADU Type</div>
                    <div className={s.aduBadge}>{aduLabel}</div>

                    <div className={s.optionsLabel}>Available Options</div>

                    <div className={s.unitPills}>
                        {comparedUnits.length > 0 ? comparedUnits.map((fp) => (
                            <div key={fp._id} className={s.unitPill}>
                                <span className={s.unitSqft}>{fp.sqft?.toLocaleString()}</span>
                                <span className={s.unitSqftLabel}>sq ft</span>
                                <span className={s.unitName}>{fp.name}</span>
                            </div>
                        )) : (
                            <div style={{ fontSize: "var(--p-small)", color: "var(--p-text-white-30)" }}>No units selected</div>
                        )}
                    </div>

                    {infoText && <div className={s.infoCard}>{infoText}</div>}

                    {allSiteTags.length > 0 && (
                        <div className={s.siteSpacer}>
                            <div className={s.siteFindingsLabel}>Site Findings</div>
                            <div className={s.siteTags}>
                                {allSiteTags.map((tag) => (
                                    <span key={tag} className="p-tag">{tag}</span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
            <div className={s.wbfy}>We build for you.</div>
        </div>
    );
}
