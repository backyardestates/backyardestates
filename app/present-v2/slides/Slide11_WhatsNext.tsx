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

function toRoman(n: number): string {
    const map: [number, string][] = [[10,"X"],[9,"IX"],[5,"V"],[4,"IV"],[1,"I"]];
    let result = "";
    for (const [val, sym] of map) { while (n >= val) { result += sym; n -= val; } }
    return result;
}

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

            {/* HEADER */}
            <div className={s.header}>
                <div className={s.headerLeft}>
                    <span className={s.wordmarkSub}>Backyard Estates</span>
                    <span className={s.wordmark}>est. 2019 · California</span>
                </div>
                <h1 className={s.headline}>
                    Ready to <em>move forward?</em>
                </h1>
                <div className={s.headerRight}>
                    <span className={s.callLabel}>Talk to us</span>
                    <span className={s.phone}>{REP_CONFIG.phone}</span>
                </div>
            </div>

            <div className={s.divider} />

            {/* NEXT STEPS GRID */}
            <div className={s.steps}>
                {NEXT_STEPS.map((step, i) => (
                    <div key={step.title} className={s.stepCard}>
                        <span className={s.stepNum}>{toRoman(i + 1)}</span>
                        <div className={s.stepContent}>
                            <span className={s.stepEyebrow}>Step {toRoman(i + 1)}</span>
                            <div className={s.stepTitle}>{step.title}</div>
                            <div className={s.stepDesc}>{step.desc}</div>
                        </div>
                    </div>
                ))}
            </div>

            {/* TIMELINE */}
            <div className={s.timeline}>
                <span className={s.timelineLabel}>Timeline · {city}</span>
                <div className={s.timelinePhase}>
                    <span className={s.timelinePhaseName}>Pre-construction</span>
                    <span className={s.timelinePhaseDur}>2–4 weeks · Backyard Estates</span>
                </div>
                <span className={s.timelineArrow}>→</span>
                <div className={s.timelinePhase}>
                    <span className={s.timelinePhaseName}>Permitting</span>
                    <span className={s.timelinePhaseDur}>3–5 months · city average</span>
                </div>
                <span className={s.timelineArrow}>→</span>
                <div className={s.timelinePhase}>
                    <span className={s.timelinePhaseName}>Construction</span>
                    <span className={s.timelinePhaseDur}>4–6 months · Backyard Estates</span>
                </div>
            </div>

            {/* FOOTER */}
            <div className={s.footer}>
                <div className={s.footerLeft}>
                    <span className={s.footerSmall}>Email · Website</span>
                    <span className={s.footerVal}>{REP_CONFIG.email}</span>
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
