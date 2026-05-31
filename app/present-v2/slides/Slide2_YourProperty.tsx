"use client";

import React from "react";
import { usePresentationStore } from "@/lib/store/presentationStore";
import { unitNameParts } from "@/lib/units/displayName";
import { resolveBeds, resolveBaths } from "@/lib/units/resolveUnitSpec";
import { AduTypeBadge } from "../_components/AduTypeBadge";
import s from "./Slide2.module.css";

export function Slide2_YourProperty() {
    const {
        propertyAddress,
        aduType,
        aduTypeByUnitId,
        propertyPhotoUrl,
        floorplans,
        comparedUnitIds,
        bedsByUnitId,
        bathsByUnitId,
        labelByUnitId,
    } = usePresentationStore();

    const aduLabel = aduType
        ? ({ detached: "Detached ADU", attached: "Attached ADU", garage: "Garage Conversion" }[aduType] ?? aduType)
        : "ADU";

    // Dedupe "(N)" duplicates — they share the same drawing, bed/bath, and
    // sqft as their original, so showing them here would just repeat the same
    // card. Other custom units (unique names) survive dedupe naturally.
    const seenBaseNames = new Set<string>();
    const comparedUnits = floorplans
        .filter((fp) => comparedUnitIds.includes(fp._id))
        .filter((fp) => {
            const baseName = (fp.name ?? "").replace(/\s*\(\d+\)\s*$/, "").trim();
            if (seenBaseNames.has(baseName)) return false;
            seenBaseNames.add(baseName);
            return true;
        });

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
                                <AduTypeBadge
                                    type={aduTypeByUnitId?.[fp._id] ?? aduType}
                                    variant="light"
                                    corner="top-right"
                                />
                                <div className={s.unitMeta}>
                                    <div className={s.unitIndex}>Option {String(idx + 1).padStart(2, "0")}</div>
                                    {(() => {
                                        const nm = unitNameParts(fp.name, labelByUnitId?.[fp._id]);
                                        return (
                                            <div className={s.unitName}>
                                                The {nm.base}
                                                {nm.tag ? (
                                                    <span className={s.unitNameTag}> · {nm.tag}</span>
                                                ) : nm.dupNum ? (
                                                    ` (${nm.dupNum})`
                                                ) : null}
                                            </div>
                                        );
                                    })()}
                                    {(() => {
                                        const beds = resolveBeds(fp, bedsByUnitId);
                                        const baths = resolveBaths(fp, bathsByUnitId);
                                        return (
                                    <div className={s.unitStats}>
                                        <div className={s.unitStat}>
                                            <span className={s.unitStatNum}>{beds || "—"}</span>
                                            <span className={s.unitStatLabel}>{beds === 1 ? "bed" : "beds"}</span>
                                        </div>
                                        <div className={s.unitStat}>
                                            <span className={s.unitStatNum}>{baths || "—"}</span>
                                            <span className={s.unitStatLabel}>{baths === 1 ? "bath" : "baths"}</span>
                                        </div>
                                        <div className={s.unitStat}>
                                            <span className={s.unitStatNum}>{fp.sqft?.toLocaleString() ?? "—"}</span>
                                            <span className={s.unitStatLabel}>sqft</span>
                                        </div>
                                    </div>
                                        );
                                    })()}
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
