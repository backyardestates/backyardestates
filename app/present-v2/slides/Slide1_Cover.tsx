"use client";

import React, { useEffect, useRef, useState } from "react";
import { usePresentationStore } from "@/lib/store/presentationStore";
import { REP_CONFIG } from "@/lib/config/repConfig";
import s from "./Slide1.module.css";

function fmt$(n: number) {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
}

function useCountUp(target: number, active: boolean, delay = 0, duration = 1400) {
    const [value, setValue] = useState(0);
    const rafRef = useRef<number | null>(null);
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    useEffect(() => {
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
        if (timerRef.current) clearTimeout(timerRef.current);
        if (!active) { setValue(0); return; }
        timerRef.current = setTimeout(() => {
            const start = performance.now();
            const tick = (now: number) => {
                const t = Math.min((now - start) / duration, 1);
                setValue(Math.round((1 - Math.pow(1 - t, 3)) * target));
                if (t < 1) rafRef.current = requestAnimationFrame(tick);
            };
            rafRef.current = requestAnimationFrame(tick);
        }, delay);
        return () => {
            if (rafRef.current) cancelAnimationFrame(rafRef.current);
            if (timerRef.current) clearTimeout(timerRef.current);
        };
    }, [target, active, delay, duration]);
    return value;
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

export function Slide1_Cover() {
    const { customerName, propertyAddress, scenarios, aduType, currentSlide, isPrintMode } = usePresentationStore();
    const active = currentSlide === 1 || isPrintMode;

    const today = new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
    const year = new Date().getFullYear();

    const aduLabel = aduType
        ? ({ detached: "Detached ADU", attached: "Attached ADU", garage: "Garage Conversion" }[aduType] ?? aduType)
        : "ADU";

    const aduScenarios = scenarios.filter((sc) => sc.kind === "adu");
    const bestAdu = aduScenarios.reduce<typeof aduScenarios[0] | null>((best, sc) => {
        if (!best) return sc;
        return (sc.cashflowMonthly ?? -Infinity) > (best.cashflowMonthly ?? -Infinity) ? sc : best;
    }, null);
    const teaserCashflow = bestAdu && (bestAdu.cashflowMonthly ?? 0) > 0 ? (bestAdu.cashflowMonthly ?? 0) : null;

    const countVal = useCountUp(teaserCashflow ?? 0, active && teaserCashflow !== null, 300);

    const displayName = customerName || "Your Name";
    const lastName = lastNameFromFull(displayName);
    const city = propertyAddress ? cityFromAddress(propertyAddress) : "—";

    return (
        <div className={s.slide}>
            {/* Photo — right 55%. Always uses the office photo on the cover slide. */}
            <div
                className={s.photo}
                style={{ backgroundImage: "url(/images/office.png)" }}
            />
            <div className={s.photoFade} />
            <div className={s.photoFrame} />



            {/* Content */}
            <div className={s.content}>
                {/* Top */}
                <div className={s.topRow}>
                    <img
                        src="/android-chrome-512x512.png"
                        alt="Backyard Estates"
                        className={s.logo}
                        onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                    />
                </div>

                {/* Middle */}
                <div className={s.middle}>
                    <div className={s.proposalHeading}>ADU Proposal</div>
                    <div className={s.eyebrowTop}>Prepared for</div>
                    <div className={s.customerName}>{displayName}</div>


                    <div className={s.goldRule} />
                    <div className={s.address}>{propertyAddress || "Your Address"}</div>
                </div>

                {/* Bottom */}
                <div className={s.bottom}>
                    <div className={s.metaCluster}>
                        <div className={s.metaItem}>
                            <span className={s.metaLabel}>Issued</span>
                            <span className={s.metaVal}>{today}</span>
                        </div>
                        <div className={s.metaItem}>
                            <span className={s.metaLabel}>ADU Type</span>
                            <span className={s.metaVal}>{aduLabel}</span>
                        </div>
                        <div className={s.metaItem}>
                            <span className={s.metaLabel}>License</span>
                            <span className={s.metaVal}>{REP_CONFIG.licenseContractor}</span>
                        </div>
                    </div>
                    <span className={s.tagline}>We build for you.</span>
                </div>
            </div>
        </div>
    );
}
