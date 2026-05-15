"use client";

import React from "react";
import { usePresentationStore } from "@/lib/store/presentationStore";
import { REP_CONFIG } from "@/lib/config/repConfig";
import s from "./Slide1.module.css";

const LogoFallback = () => (
    <svg width="28" height="22" viewBox="0 0 28 22" fill="none"
        stroke="rgba(255,255,255,0.75)" strokeWidth="1.8" strokeLinecap="square">
        <polyline points="1,10 7,4 13,10" /><rect x="1" y="10" width="12" height="11" />
        <line x1="5" y1="21" x2="5" y2="15" /><line x1="5" y1="15" x2="9" y2="15" />
        <line x1="9" y1="15" x2="9" y2="21" /><polyline points="7,8 15,2 23,8" />
        <rect x="9" y="8" width="14" height="13" /><line x1="15" y1="21" x2="15" y2="15" />
        <line x1="15" y1="15" x2="19" y2="15" /><line x1="19" y1="15" x2="19" y2="21" />
    </svg>
);

export function Slide1_Cover() {
    const { customerName, propertyAddress, propertyPhotoUrl } = usePresentationStore();
    const today = new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
    const year = new Date().getFullYear();

    const aduType = usePresentationStore((s) => s.aduType);
    const aduLabel = aduType
        ? ({ detached: "Detached ADU", attached: "Attached ADU", garage: "Garage Conversion" }[aduType] ?? aduType)
        : "ADU";

    return (
        <div className={s.slide}>
            {propertyPhotoUrl ? (
                <div className={s.photoBg} style={{ backgroundImage: `url(${propertyPhotoUrl})` }} />
            ) : (
                <div className={s.photoBg} style={{ background: "radial-gradient(ellipse at 60% 40%, var(--p-teal) 0%, var(--p-dark) 65%)" }} />
            )}
            <div className={s.overlay} />

            <div className={s.content}>
                {/* TOP — Logo */}
                <div>
                    <img
                        src="/assets/be-logo-white.png"
                        alt="Backyard Estates"
                        className={s.logo}
                        style={{ filter: "brightness(0) invert(1)" }}
                        onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                    />
                </div>

                {/* BOTTOM — Text */}
                <div className={s.bottom}>
                    <div className={s.eyebrow}>ADU Proposal · {year}</div>

                    <div className={s.name}>{customerName || "Your Name"}</div>

                    <div className={s.address}>{propertyAddress || "Your Address"}</div>

                    <div className={s.rule} />

                    <div className={s.tagline}>We build for you.</div>

                    <div className={s.metaRow}>
                        <div>
                            <span className={s.metaLabel}>Date</span>
                            <span className={s.metaVal}>{today}</span>
                        </div>
                        <div className={s.metaDivider} />
                        <div>
                            <span className={s.metaLabel}>ADU Type</span>
                            <span className={s.metaVal}>{aduLabel}</span>
                        </div>
                        <div className={s.metaDivider} />
                        <div>
                            <span className={s.metaLabel}>License</span>
                            <span className={s.metaVal}>{REP_CONFIG.licenseContractor} · {REP_CONFIG.licenseDealership}</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className={s.corner}>
                {today}<br />{REP_CONFIG.licenseContractor} | {REP_CONFIG.licenseDealership}
            </div>
        </div>
    );
}
