"use client";

import React, { useEffect, useRef } from "react";
import { usePresentationStore } from "@/lib/store/presentationStore";
import { REP_CONFIG } from "@/lib/config/repConfig";
import { RunningHeader } from "./_shared/RunningHeader";
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
    return parts.length >= 2 ? parts[parts.length - 2].trim() : "Your City";
}

function QRCanvas({ url, size }: { url: string; size: number }) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    useEffect(() => {
        let cancelled = false;
        import("qrcode").then((QRCode) => {
            if (cancelled || !canvasRef.current) return;
            QRCode.toCanvas(canvasRef.current, url, {
                width: size, margin: 1,
                color: { dark: "#14302F", light: "#00000000" },
            });
        });
        return () => { cancelled = true; };
    }, [url, size]);
    return <canvas ref={canvasRef} width={size} height={size} style={{ display: "block", borderRadius: 3 }} aria-label="QR code linking to backyardestates.com" />;
}

function toRoman(n: number): string {
    const map: [number, string][] = [[1000,"M"],[900,"CM"],[500,"D"],[400,"CD"],[100,"C"],[90,"XC"],[50,"L"],[40,"XL"],[10,"X"],[9,"IX"],[5,"V"],[4,"IV"],[1,"I"]];
    let result = "";
    for (const [val, sym] of map) { while (n >= val) { result += sym; n -= val; } }
    return result;
}

const NEXT_STEPS = [
    { title: "Review the agreement", desc: "We send via DocuSign by tomorrow. Sign when you're ready." },
    { title: "Quick call with our financing partner", desc: "Usually 20 minutes. Most families do $0 out of pocket." },
    { title: "Site survey scheduled", desc: "Our team on-site within the first week." },
    { title: "We take it from here", desc: "Permits, plans, build, inspections. Weekly BuilderTrend updates." },
];

const PHASES = [
    { phase: "Plans", duration: "4–6 weeks", sub: "Backyard Estates" },
    { phase: "Permitting", duration: null, sub: null },
    { phase: "ADU Build", duration: "6–12 weeks", sub: "Backyard Estates" },
];

export function Slide10_WhatsNext() {
    const { propertyAddress } = usePresentationStore();
    const timeline = getCityTimeline(propertyAddress);
    const city = propertyAddress ? getCityName(propertyAddress) : "Your City";

    return (
        <div className={s.slide}>
            <RunningHeader slideNumber={10} topic="What's next" theme="dark" />

            {/* CTA header */}
            <div className={s.ctaHeader}>
                <div className={s.ctaLogoWrap}>
                    <img
                        src="/assets/be-logo-white.png"
                        alt="Backyard Estates"
                        className={s.ctaLogo}
                        onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                    />
                    <span className={s.ctaWordmark}>Backyard Estates</span>
                </div>
                <div className={s.ctaHeadline}>
                    Ready to <em>move forward?</em>
                </div>
                <div className={s.ctaPhoneWrap}>
                    <span className={s.ctaPhoneLabel}>Talk to us</span>
                    <div className={s.ctaPhone}>{REP_CONFIG.phone}</div>
                </div>
            </div>

            {/* 2×2 next steps */}
            <div className={s.stepsGrid}>
                {NEXT_STEPS.map((step, i) => (
                    <div key={step.title} className={s.stepCard}>
                        <div className={s.stepNum}>{toRoman(i + 1)}</div>
                        <div className={s.stepBody}>
                            <div className={s.stepTitle}>{step.title}</div>
                            <div className={s.stepDesc}>{step.desc}</div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Timeline */}
            <div className={s.timelineSection}>
                <div className={s.timelineTitle}>Timeline · {city}, CA</div>
                <div className={s.timelineGrid}>
                    {PHASES.map((item, i) => (
                        <React.Fragment key={item.phase}>
                            {i > 0 && <div className={s.phaseArrow}>→</div>}
                            <div className={s.phaseBox}>
                                <div className={s.phaseName}>{item.phase}</div>
                                <div className={s.phaseDur}>
                                    {item.phase === "Permitting" ? timeline.avg : item.duration}
                                </div>
                                {item.phase === "Permitting" && (
                                    <div className={s.phaseSub}>Ours avg: {timeline.ourAvg} · {city}</div>
                                )}
                                {item.sub && item.phase !== "Permitting" && (
                                    <div className={s.phaseSub}>{item.sub}</div>
                                )}
                            </div>
                        </React.Fragment>
                    ))}
                </div>
            </div>

            {/* Footer */}
            <div className={s.footer}>
                <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                    <span className={s.footerContact}>{REP_CONFIG.email}</span>
                    <span className={s.footerContact}>{REP_CONFIG.website}</span>
                </div>
                <div className={s.footerQr}>
                    <QRCanvas url="https://backyardestates.com" size={40} />
                    <span className={s.footerQrLabel}>backyardestates.com</span>
                </div>
                <div className={s.footerRight}>
                    <span className={s.footerTagline}>We build for you.</span>
                    <span className={s.footerLicense}>{REP_CONFIG.licenseContractor} | {REP_CONFIG.licenseDealership}</span>
                </div>
            </div>
        </div>
    );
}
