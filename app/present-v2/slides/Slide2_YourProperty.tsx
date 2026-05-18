"use client";

import React from "react";
import { usePresentationStore } from "@/lib/store/presentationStore";
import s from "./Slide2.module.css";

const ADU_BLURB: Record<string, string> = {
    detached: "A standalone unit built in your backyard — separate entrance, full privacy, complete independence.",
    attached: "We handle the tie-in, firewall, and exterior matching. Seamless with your existing home.",
    garage: "We handle the conversion, structural requirements, and all permits. Your garage, reimagined.",
};

function lastNameFromFull(full?: string) {
    if (!full) return "";
    const parts = full.trim().split(/\s+/);
    return parts[parts.length - 1] ?? "";
}

function cityFromAddress(addr: string) {
    const parts = addr.split(",");
    return parts.length >= 2 ? parts[parts.length - 2].trim() : addr;
}

export function Slide2_YourProperty() {
    const { customerName, propertyAddress, aduType, propertyPhotoUrl, floorplans, comparedUnitIds, siteWorkTagsByUnitId } = usePresentationStore();

    const aduLabel = aduType
        ? ({ detached: "Detached ADU", attached: "Attached ADU", garage: "Garage Conversion" }[aduType] ?? aduType)
        : "ADU";
    const blurbText = aduType ? ADU_BLURB[aduType] : null;

    const comparedUnits = floorplans.filter((fp) => comparedUnitIds.includes(fp._id));
    const allSiteTags = Array.from(new Set(
        comparedUnitIds.flatMap((id) => siteWorkTagsByUnitId[id] ?? [])
    )).slice(0, 8);

    const lastName = lastNameFromFull(customerName);
    const city = propertyAddress ? cityFromAddress(propertyAddress) : "—";

    return (
        <div className={s.slide}>
            {/* Running header */}
            <div className="running-header rh-dark">
                <span className="running-header-left">{lastName} · {city}</span>
                <span className="running-header-center">Your Property</span>
                <span className="running-header-right">
                    <span className="running-header-num">02</span> / 13
                </span>
            </div>

            {/* Headline row */}
            <div className={s.headRow}>
                <div className={s.headLeft}>
                    <h2 className="section-title on-dark">
                        Your <em>property</em>
                    </h2>
                    <span className={s.headSubhead}>{propertyAddress}</span>
                </div>
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

                {/* RIGHT: info */}
                <div className={s.infoPanel}>
                    <div className={s.aduBadge}>{aduLabel}</div>

                    {blurbText && <p className={s.blurb}>{blurbText}</p>}

                    <div className={s.optionsSection}>
                        <div className={s.optionsEyebrow}>Options being compared</div>
                        <div className={s.unitList}>
                            {comparedUnits.length > 0 ? comparedUnits.map((fp) => (
                                <div key={fp._id} className={s.unitItem}>
                                    <span className={s.unitName}>The {fp.name}</span>
                                    <span className={s.unitSqft}>
                                        <span className={s.unitSqftNum}>{fp.sqft?.toLocaleString() ?? "—"}</span>
                                        <span className={s.unitSqftLabel}>sqft</span>
                                    </span>
                                </div>
                            )) : (
                                <div className={s.noUnits}>No units selected</div>
                            )}
                        </div>
                    </div>

                    {allSiteTags.length > 0 && (
                        <div className={s.siteFindingsSection}>
                            <div className={s.siteFindingsLabel}>Site findings</div>
                            <div className={s.siteTags}>
                                {allSiteTags.map((tag) => (
                                    <span key={tag} className={s.siteTag}>{tag}</span>
                                ))}
                            </div>
                        </div>
                    )}
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
