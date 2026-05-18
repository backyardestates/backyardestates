"use client";

import React, { useEffect, useRef, useState } from "react";
import { usePresentationStore } from "@/lib/store/presentationStore";
import s from "./Slide7.module.css";

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

function AnimDollar({ n, active, delay = 0 }: { n: number; active: boolean; delay?: number }) {
    const v = useCountUp(Math.abs(n), active, delay);
    return <>{fmt$(v)}</>;
}

function toRoman(n: number): string {
    const map: [number, string][] = [[1000,"M"],[900,"CM"],[500,"D"],[400,"CD"],[100,"C"],[90,"XC"],[50,"L"],[40,"XL"],[10,"X"],[9,"IX"],[5,"V"],[4,"IV"],[1,"I"]];
    let result = "";
    for (const [val, sym] of map) { while (n >= val) { result += sym; n -= val; } }
    return result;
}

const STEPS = [
    { title: "Sign & Deposit", desc: "DocuSign sent by tomorrow" },
    { title: "Site Visit", desc: "On-site within one week" },
    { title: "Floor Plan Review", desc: "Custom design, your input" },
    { title: "Permits & Plans", desc: "We handle everything" },
    { title: "Build & Keys", desc: "Weekly updates · BuilderTrend" },
];

const SHORT_LABELS: Record<string, string> = {
    signing: "Signing", sub1: "Submittal 1", sub2: "Submittal 2",
    demo: "Demo", rebar: "Rebar", framing: "Framing",
    rough_mep: "Rough MEP", fin_start: "Finishes", fin_done: "Fin · Done", final: "Final",
};

const PHASE_COLORS: Record<string, string> = {
    signing: "#B8954A",
    sub1: "#4A90A4",
    sub2: "#4A90A4",
    demo: "#7B5EA7",
    rebar: "#E07060",
    framing: "#7B5EA7",
    rough_mep: "#4A7B5E",
    fin_start: "#9FD9B8",
    fin_done: "#9FD9B8",
    final: "#E8C57E",
    drywall: "#4A7B5E",
    other: "#666",
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

export function Slide7_HowItWorks() {
    const { paymentSchedules, comparedUnitIds, floorplans, customerName, propertyAddress, currentSlide } = usePresentationStore();
    const active = currentSlide === 7;

    const comparedUnits = floorplans.filter((fp) => comparedUnitIds.includes(fp._id));
    const displayUnits = comparedUnits.length > 0 ? comparedUnits : floorplans.slice(0, 1);

    const [activeUnitTab, setActiveUnitTab] = useState(0);
    const activeUnitId = comparedUnitIds[activeUnitTab] ?? comparedUnitIds[0] ?? displayUnits[0]?._id ?? "";

    const schedule = paymentSchedules[`adu_${activeUnitId}`] ?? paymentSchedules[activeUnitId] ?? [];
    const milestones = schedule.slice(0, 10);
    const totalAmt = schedule.reduce((sum, m) => sum + m.amount, 0);

    const activeUnit = displayUnits[activeUnitTab] ?? displayUnits[0];
    const lastName = lastNameFromFull(customerName);
    const city = propertyAddress ? cityFromAddress(propertyAddress) : "—";

    return (
        <div className={s.slide}>
            {/* Running header */}
            <div className="running-header rh-dark">
                <span className="running-header-left">{lastName} · {city}</span>
                <span className="running-header-center">How It Works</span>
                <span className="running-header-right">
                    <span className="running-header-num">07</span> / 13
                </span>
            </div>

            {/* Headline */}
            <div className={s.headRow}>
                <div className={s.headLeft}>
                    <h2 className="section-title on-dark">
                        What happens <em>after you say yes.</em>
                    </h2>
                    <span className={s.headSubhead}>Sign · plan · permit · build — we handle every department</span>
                </div>
            </div>

            {/* Process steps */}
            <div className={s.steps}>
                {STEPS.map((step, i) => (
                    <div key={step.title} className={s.stepCard}>
                        <div className={s.stepHead}>
                            <span className={s.stepNum}>{toRoman(i + 1)}</span>
                            <span className={s.stepBadge}>Step</span>
                        </div>
                        <div className={s.stepTitle}>{step.title}</div>
                        <div className={s.stepDesc}>{step.desc}</div>
                    </div>
                ))}
            </div>

            {/* Body: callout + schedule */}
            <div className={s.body}>
                <div className={s.callout}>
                    <div className={s.calloutText}>You talk to us. We talk to <em>everyone else.</em></div>
                </div>

                <div className={s.scheduleSection}>
                    <div className={s.scheduleTopRow}>
                        <div className={s.scheduleHead}>
                            <span className={s.scheduleSub}>Payment Schedule</span>
                            <h3 className={s.scheduleTitle}>Nothing due until <em>each milestone is complete.</em></h3>
                        </div>
                        {displayUnits.length > 1 && (
                            <div className={s.tabs}>
                                {displayUnits.map((fp, idx) => (
                                    <button
                                        key={fp._id}
                                        onClick={() => setActiveUnitTab(idx)}
                                        className={`${s.tab} ${idx === activeUnitTab ? s.tabActive : s.tabInactive}`}
                                    >
                                        {fp.name}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {schedule.length > 0 ? (
                        <div className={s.milestoneGrid}>
                            {milestones.map((m, i) => (
                                <div
                                    key={m.label + i}
                                    className={s.milestoneCard}
                                    style={{ ["--phase-color" as string]: PHASE_COLORS[m.phase] ?? PHASE_COLORS.other }}
                                >
                                    <div className={s.milestoneNum}>{toRoman(i + 1)}</div>
                                    <div className={s.milestoneLabel}>{SHORT_LABELS[m.phase] ?? m.label}</div>
                                    <div className={s.milestoneAmt}>
                                        <AnimDollar n={m.amount} active={active} delay={i * 60} />
                                    </div>
                                </div>
                            ))}
                            {activeUnit && (
                                <div className={s.totalCard}>
                                    <div className={s.totalLabel}>Total Contract</div>
                                    <div className={s.totalAmt}>
                                        {totalAmt > 0 ? fmt$(totalAmt) : "—"}
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className={s.emptySchedule}>Payment schedule will appear after the admin configures this plan.</div>
                    )}

                    <div className={s.footerNote}>
                        <span>Financing arranged before build starts · Nothing due until each milestone is complete</span>
                        <span className={s.footerTagline}>We build for you.</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
