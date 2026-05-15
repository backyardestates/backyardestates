"use client";

import React, { useEffect, useRef } from "react";
import { usePresentationStore } from "@/lib/store/presentationStore";
import { REP_CONFIG } from "@/lib/config/repConfig";
import s from "./Slide10.module.css";

const CITY_TIMELINE: Record<string, { avg: string; ourAvg: string }> = {
    corona:        { avg: "120–180 days", ourAvg: "~90 days" },
    riverside:     { avg: "90–150 days",  ourAvg: "~75 days" },
    anaheim:       { avg: "120–180 days", ourAvg: "~90 days" },
    irvine:        { avg: "60–90 days",   ourAvg: "~55 days" },
    "los angeles": { avg: "180–360 days", ourAvg: "~150 days" },
    la:            { avg: "180–360 days", ourAvg: "~150 days" },
    torrance:      { avg: "90–150 days",  ourAvg: "~80 days" },
    pasadena:      { avg: "90–150 days",  ourAvg: "~75 days" },
    default:       { avg: "90–180 days",  ourAvg: "~90 days" },
};

function getCityTimeline(address: string) {
    const lower = address.toLowerCase();
    for (const [city, data] of Object.entries(CITY_TIMELINE)) {
        if (city !== "default" && lower.includes(city)) return data;
    }
    return CITY_TIMELINE.default;
}

function getCityName(address: string) {
    const parts = address.split(",");
    return parts.length >= 2 ? parts[parts.length - 2].trim().toUpperCase() : "YOUR CITY";
}

function QRCanvas({ url, size }: { url: string; size: number }) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    useEffect(() => {
        let cancelled = false;
        import("qrcode").then((QRCode) => {
            if (cancelled || !canvasRef.current) return;
            QRCode.toCanvas(canvasRef.current, url, {
                width: size, margin: 1,
                color: { dark: "#1a3a3a", light: "#ffffff" },
            });
        });
        return () => { cancelled = true; };
    }, [url, size]);
    return <canvas ref={canvasRef} width={size} height={size} style={{ display: "block" }} />;
}

const NEXT_STEPS = [
    { n: "1", title: "Review the agreement", desc: "We send via DocuSign by tomorrow. Sign when you're ready." },
    { n: "2", title: "Quick call with our financing partner", desc: "Usually 20 minutes. Most families do $0 out of pocket." },
    { n: "3", title: "Site survey scheduled", desc: "Our team on-site within the first week." },
    { n: "4", title: "We take it from here", desc: "Permits, plans, build, inspections. Weekly BuilderTrend updates." },
];

const PHASES = [
    { phase: "Plans", duration: "4–6 weeks" },
    { phase: "Permitting", duration: "As fast as 6 weeks" },
    { phase: "ADU Build", duration: "6–12 weeks" },
];

export function Slide10_WhatsNext() {
    const { propertyAddress } = usePresentationStore();
    const timeline = getCityTimeline(propertyAddress);
    const city = propertyAddress ? getCityName(propertyAddress) : "YOUR CITY";

    return (
        <div className={s.slide}>
            {/* Header */}
            <div className={s.header}>
                <div className={s.headerLeft}>
                    <img
                        src="/assets/be-logo-white.png"
                        alt="Backyard Estates"
                        className={s.logo}
                        style={{ filter: "brightness(0) invert(1)" }}
                        onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                    />
                    <span className={s.headerBrand}>Backyard Estates</span>
                </div>
                <span className={s.headerCenter}>Ready to move forward?</span>
                <span className={s.headerRight}>{REP_CONFIG.phone}</span>
            </div>

            {/* 2×2 Steps Grid */}
            <div className={s.stepsGrid}>
                {NEXT_STEPS.map((step) => (
                    <div key={step.n} className={s.stepCard}>
                        <div className={s.stepNum}>{step.n}</div>
                        <div>
                            <div className={s.stepTitle}>{step.title}</div>
                            <div className={s.stepDesc}>{step.desc}</div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Timeline */}
            <div className={s.timelineSection}>
                <div className={s.timelineLabel}>Timeline Estimate — {city}, CA</div>
                <div className={s.timelineBox}>
                    <div className={s.timelineGrid}>
                        {PHASES.map((item, i) => (
                            <React.Fragment key={item.phase}>
                                {i > 0 && <div className={s.phaseArrow}>→</div>}
                                <div>
                                    <div className={s.phaseBox}>
                                        <div className={s.phaseName}>{item.phase}</div>
                                        <div className={s.phaseDur}>{item.duration}</div>
                                    </div>
                                    {item.phase === "Permitting" && (
                                        <>
                                            <div className={s.phaseCity}>City avg: {timeline.avg}</div>
                                            <div className={s.phaseBe}>Our avg: {timeline.ourAvg}</div>
                                        </>
                                    )}
                                </div>
                            </React.Fragment>
                        ))}
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div className={s.footer}>
                <div className={s.footerLeft}>
                    <span className={s.footerContact}>{REP_CONFIG.email}</span>
                    <span className={s.footerContact}>{REP_CONFIG.website}</span>
                </div>
                <div className={s.footerCenter}>
                    <div className={s.qrWrap}>
                        <QRCanvas url="https://backyardestates.com" size={52} />
                    </div>
                    <span className={s.qrLabel}>backyardestates.com</span>
                </div>
                <div className={s.footerRight}>
                    <span className={s.footerTagline}>We build for you.</span>
                    <span className={s.footerLicense}>{REP_CONFIG.licenseContractor} | {REP_CONFIG.licenseDealership}</span>
                </div>
            </div>
        </div>
    );
}
