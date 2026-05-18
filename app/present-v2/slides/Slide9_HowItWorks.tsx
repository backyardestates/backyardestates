"use client";

import React, { useEffect, useRef, useState } from "react";
import { usePresentationStore } from "@/lib/store/presentationStore";
import { RunningHeader } from "./_shared/RunningHeader";
import { RunningFooter } from "./_shared/RunningFooter";
import s from "./Slide9.module.css";

function fmt$(n: number) {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
}

function useCountUp(target: number, active: boolean, delay = 0, duration = 900) {
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
    { title: "Build & Keys", desc: "Weekly updates in BuilderTrend" },
];

const SHORT_LABELS: Record<string, string> = {
    signing: "Signing", sub1: "Submittal 1", sub2: "Submittal 2",
    demo: "Demo", rebar: "Rebar", framing: "Framing",
    rough_mep: "Rough MEP", fin_start: "Finishes", fin_done: "Finishes Done", final: "Final",
};

const PHASE_BORDER: Record<string, string> = {
    "pre-construction": "rgba(45,95,95,0.8)",
    permitting: "rgba(184,149,74,0.5)",
    construction: "#B8954A",
    final: "rgba(45,95,95,0.8)",
};

export function Slide9_HowItWorks() {
    const { scenarios, paymentSchedules, comparedUnitIds, floorplans, currentSlide } = usePresentationStore();
    const active = currentSlide === 9;

    const aduScenarios = scenarios.filter((sc) => sc.kind === "adu");
    const comparedAdus = comparedUnitIds.length > 0
        ? aduScenarios.filter((sc) => comparedUnitIds.includes(sc.key))
        : aduScenarios;
    const displayAdus = comparedAdus.length > 0 ? comparedAdus : aduScenarios.slice(0, 1);

    const [activeIdx, setActiveIdx] = useState(0);
    const activeUnit = displayAdus[activeIdx] ?? displayAdus[0];
    const schedule = activeUnit ? (paymentSchedules[activeUnit.key] ?? []) : [];

    function getFpName(key: string) {
        const fp = floorplans.find((f) => f._id === key);
        return fp?.name ?? key;
    }

    const row1 = schedule.slice(0, 6);
    const row2 = schedule.slice(6);

    return (
        <div className={s.slide}>
            <RunningHeader slideNumber={9} topic="After you say yes" theme="dark" />

            <div className={s.titleRow}>
                <h2 className={s.titleText}>What happens after you say yes.</h2>
            </div>

            {/* Process steps */}
            <div className={s.steps}>
                {STEPS.map((step, i) => (
                    <div key={step.title} className={s.stepCard}>
                        <div className={s.stepNum}>{toRoman(i + 1)}</div>
                        <div className={s.stepTitle}>{step.title}</div>
                        <div className={s.stepDesc}>{step.desc}</div>
                    </div>
                ))}
            </div>

            {/* Callout */}
            <div className={s.callout}>
                <div className={s.calloutText}>You talk to us. We talk to everyone else.</div>
            </div>

            {/* Payment schedule */}
            <div className={s.scheduleSection}>
                <div className={s.scheduleHeader}>
                    <div className={s.scheduleLabel}>Payment schedule</div>
                    {displayAdus.length > 1 && (
                        <div className={s.tabs}>
                            {displayAdus.map((sc, i) => (
                                <button
                                    key={sc.key}
                                    onClick={() => setActiveIdx(i)}
                                    className={`${s.tab} ${i === activeIdx ? s.tabActive : s.tabInactive}`}
                                >
                                    {getFpName(sc.key)}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {schedule.length > 0 ? (
                    <>
                        <div className={s.milestoneRow1}>
                            {row1.map((m, i) => (
                                <div key={m.id} className={s.milestoneCard} style={{ borderLeftColor: PHASE_BORDER[m.phase] ?? "var(--p-gold)" }}>
                                    <div className={s.milestoneNum}>{toRoman(i + 1)}</div>
                                    <div className={s.milestoneLabel}>{SHORT_LABELS[m.id] ?? m.label}</div>
                                    <div className={s.milestoneAmt}><AnimDollar n={m.amount} active={active} delay={i * 60} /></div>
                                </div>
                            ))}
                        </div>
                        <div className={s.milestoneRow2}>
                            {row2.map((m, i) => (
                                <div key={m.id} className={s.milestoneCard} style={{ borderLeftColor: PHASE_BORDER[m.phase] ?? "var(--p-gold)" }}>
                                    <div className={s.milestoneNum}>{toRoman(row1.length + i + 1)}</div>
                                    <div className={s.milestoneLabel}>{SHORT_LABELS[m.id] ?? m.label}</div>
                                    <div className={s.milestoneAmt}><AnimDollar n={m.amount} active={active} delay={(row1.length + i) * 60} /></div>
                                </div>
                            ))}
                            {activeUnit && (
                                <div className={s.totalCard}>
                                    <div className={s.totalLabel}>Total contract</div>
                                    <div className={s.totalAmt}>{fmt$(activeUnit.finalAduPrice ?? activeUnit.purchasePrice ?? 0)}</div>
                                </div>
                            )}
                        </div>
                    </>
                ) : (
                    <div style={{ color: "rgba(212,176,116,0.30)", fontSize: 13, fontFamily: "var(--p-font)", padding: "12px 0" }}>
                        Payment schedule loading…
                    </div>
                )}
            </div>

            <RunningFooter
                theme="dark"
                left={<span className={s.footerNote}>Nothing due until each milestone is completed.</span>}
            />
        </div>
    );
}
