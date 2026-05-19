"use client";

import React from "react";
import { usePresentationStore } from "@/lib/store/presentationStore";
import s from "./Slide2.module.css";

export function Slide2_YourProperty() {
    const { propertyAddress, aduType, propertyPhotoUrl, floorplans, comparedUnitIds } = usePresentationStore();

    const aduLabel = aduType
        ? ({ detached: "Detached ADU", attached: "Attached ADU", garage: "Garage Conversion" }[aduType] ?? aduType)
        : "ADU";

    const comparedUnits = floorplans.filter((fp) => comparedUnitIds.includes(fp._id));

    return (
        <div className={s.slide}>

            {/* Headline row */}
            <div className={s.headRow}>
                <div className={s.headLeft}>
                    <h2 className="section-title on-dark">
                        Your <em>property</em>
                    </h2>
                    <span className={s.headSubhead}>{propertyAddress}</span>
                </div>
                <div className={s.aduBadge}>{aduLabel}</div>
            </div>

            {/* Body */}
            <div className={s.body}>
                {/* LEFT: photo */}
                <div className={s.photoPanel}>
                    <span className={s.photoBadge}>Site Photo</span>
                    {propertyPhotoUrl ? (
                        <img
                            src={propertyPhotoUrl}
                            alt={propertyAddress || "Property photo"}
                            className={s.photoImg}
                        />
                    ) : (
                        <div className={s.photoPlaceholder} />
                    )}
                </div>

                {/* RIGHT: options being discussed */}
                <div className={s.optionsPanel}>
                    <div className={s.optionsEyebrow}>Options we'll discuss today</div>

                    <div className={s.unitGrid}>
                        {comparedUnits.length > 0 ? comparedUnits.map((fp, idx) => (
                            <div key={fp._id} className={s.unitCard}>
                                <div className={s.unitMeta}>
                                    <div className={s.unitIndex}>Option {String(idx + 1).padStart(2, "0")}</div>
                                    <div className={s.unitName}>The {fp.name}</div>
                                    <div className={s.unitStats}>
                                        <div className={s.unitStat}>
                                            <span className={s.unitStatNum}>{fp.bed ?? "—"}</span>
                                            <span className={s.unitStatLabel}>{fp.bed === 1 ? "bed" : "beds"}</span>
                                        </div>
                                        <div className={s.unitStat}>
                                            <span className={s.unitStatNum}>{fp.bath ?? "—"}</span>
                                            <span className={s.unitStatLabel}>{fp.bath === 1 ? "bath" : "baths"}</span>
                                        </div>
                                        <div className={s.unitStat}>
                                            <span className={s.unitStatNum}>{fp.sqft?.toLocaleString() ?? "—"}</span>
                                            <span className={s.unitStatLabel}>sqft</span>
                                        </div>
                                    </div>
                                </div>
                                <div className={s.unitDrawing}>
                                    {fp.floorPlanUrl ? (
                                        <img
                                            src={fp.floorPlanUrl}
                                            alt={`${fp.name} floor plan`}
                                            className={s.unitDrawingImg}
                                        />
                                    ) : (
                                        <div className={s.unitDrawingPlaceholder}>No drawing</div>
                                    )}
                                </div>
                            </div>
                        )) : (
                            <div className={s.noUnits}>No units selected</div>
                        )}
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div className={s.footer}>
                <span className={s.footerNote}>Honest site assessment · we surface everything before signing</span>
                <span className={s.tagline}>We build for you.</span>
            </div>
        </div>
    );
}
