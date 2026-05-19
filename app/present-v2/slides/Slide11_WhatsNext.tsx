"use client";

import React from "react";
import { usePresentationStore } from "@/lib/store/presentationStore";
import { REP_CONFIG } from "@/lib/config/repConfig";
import s from "./Slide11.module.css";

const NEXT_STEPS = [
    { title: "Sign & Deposit", desc: "DocuSign hits your inbox by tomorrow. 5 minutes start to finish." },
    { title: "Schedule Site Visit", desc: "Our team measures, photographs, and confirms feasibility on-site." },
    { title: "Design Your ADU", desc: "Floor plan, selections, exterior — your input, our drafting team." },
    { title: "Break Ground", desc: "Permits pulled, financing arranged. We move dirt within 30 days of approval." },
];

function lastNameFromFull(full?: string) {
    if (!full) return "";
    const parts = full.trim().split(/\s+/);
    return parts[parts.length - 1] ?? "";
}

function cityFromAddress(addr: string) {
    const parts = addr.split(",");
    return parts.length >= 2 ? parts[parts.length - 2].trim() : addr;
}

export function Slide11_WhatsNext() {
    const { customerName, propertyAddress } = usePresentationStore();
    const lastName = lastNameFromFull(customerName);
    const city = propertyAddress ? cityFromAddress(propertyAddress) : "your area";

    return (
        <div className={s.slide}>
            <div className={s.innerFrame} />

            {/* Running header */}
            <div className="running-header rh-dark">
                <span className="running-header-left">{lastName} · {city}</span>
                <span className="running-header-center">What's Next</span>
                <span className="running-header-right">
                    <span className="running-header-num">11</span> / 13
                </span>
            </div>

            {/* HEADER — logo over headline, centered */}
            <div className={s.header}>
                <img
                    src="/android-chrome-512x512.png"
                    alt="Backyard Estates"
                    className={s.logo}
                    onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                />
                <h1 className={s.headline}>
                    Ready to <em>move forward?</em>
                </h1>
            </div>

            <div className={s.divider} />

            {/* NEXT STEPS — linear row of 4 */}
            <div className={s.steps}>
                {NEXT_STEPS.map((step, i) => (
                    <div key={step.title} className={s.stepCard}>
                        <span className={s.stepNum}>{i + 1}</span>
                        <div className={s.stepTitle}>{step.title}</div>
                        <div className={s.stepDesc}>{step.desc}</div>
                    </div>
                ))}
            </div>

            {/* FOOTER */}
            <div className={s.footer}>
                <div className={s.footerLeft}>
                    <span className={s.footerSmall}>Website</span>
                    <span className={s.footerVal}>{REP_CONFIG.website}</span>
                </div>
                <span className={s.footerCenter}>We build for you.</span>
                <div className={s.footerRight}>
                    <span className={s.footerSmall}>Licensed · Bonded · Insured</span>
                    <span className={s.licenses}>{REP_CONFIG.licenseContractor} · {REP_CONFIG.licenseDealership}</span>
                </div>
            </div>
        </div>
    );
}
