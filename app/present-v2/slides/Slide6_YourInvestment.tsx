"use client";

import React, { useEffect, useRef, useState } from "react";
import { usePresentationStore } from "@/lib/store/presentationStore";
import { RunningHeader } from "./_shared/RunningHeader";
import { RunningFooter } from "./_shared/RunningFooter";
import { PlanName } from "./_shared/PlanName";
import s from "./Slide6.module.css";

function fmt$(n: number) {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
}

function fmtShort(n: number) {
    const k = Math.round(Math.abs(n) / 1000);
    return `$${k}K`;
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

function CountDollar({ n, active, delay = 0 }: { n: number; active: boolean; delay?: number }) {
    const v = useCountUp(Math.abs(n), active, delay);
    return <>{fmt$(v)}</>;
}

function CountPct({ n, active, delay = 0 }: { n: number; active: boolean; delay?: number }) {
    const v = useCountUp(Math.round(Math.abs(n) * 1000), active, delay);
    return <>{(v / 10).toFixed(1)}%</>;
}

function CountShort({ n, active, delay = 0 }: { n: number; active: boolean; delay?: number }) {
    const v = useCountUp(Math.abs(n), active, delay);
    return <>{fmtShort(v)}</>;
}

function EquityBar({ pct, active, delay = 0 }: { pct: number; active: boolean; delay?: number }) {
    const [width, setWidth] = useState(0);
    useEffect(() => {
        if (!active) { setWidth(0); return; }
        const t = setTimeout(() => setWidth(pct), delay);
        return () => clearTimeout(t);
    }, [pct, active, delay]);
    return (
        <div className={s.equityBarTrack}>
            <div className={s.equityBarFill} style={{ width: `${width}%` }} />
        </div>
    );
}

export function Slide6_YourInvestment() {
    const { scenarios, currentSlide, comparedUnitIds, floorplans } = usePresentationStore();
    const active = currentSlide === 6;

    const aduScenarios = scenarios.filter((sc) => sc.kind === "adu");
    const comparedAdus = comparedUnitIds.length > 0
        ? aduScenarios.filter((sc) => comparedUnitIds.includes(sc.key.replace(/^adu_/, "")))
        : aduScenarios.slice(0, 3);
    const displayAdus = comparedAdus.length > 0 ? comparedAdus : aduScenarios.slice(0, 3);

    function fpId(key: string) {
        return key.replace(/^adu_/, "");
    }
    function getFpName(key: string) {
        const fp = floorplans.find((f) => f._id === fpId(key));
        return fp?.name ?? fpId(key);
    }
    function getFpSqft(key: string) {
        const fp = floorplans.find((f) => f._id === fpId(key));
        const sc = displayAdus.find((s) => s.key === key);
        return fp?.sqft ?? sc?.sqft ?? null;
    }

    // Compute global max equity (year 10) across all displayed plans for proportional bars
    const maxEquity = Math.max(...displayAdus.map((sc) => sc.year10EquityBoost ?? 0), 1);

    if (displayAdus.length === 0) {
        return (
            <div className={s.slide} style={{ alignItems: "center", justifyContent: "center" }}>
                <div style={{ color: "rgba(212,176,116,0.3)", fontSize: 15, fontFamily: "var(--p-font)" }}>Waiting for scenario data…</div>
            </div>
        );
    }

    return (
        <div className={s.slide}>
            <RunningHeader slideNumber={6} topic="Your investment" theme="dark" />

            <div className={s.titleRow}>
                <h2 className={s.titleText}>The <em>return</em></h2>
                <span className={s.titleSub}>6.5% · 30 yr · 100% financed · $0 out of pocket</span>
            </div>

            <div className={s.body} style={{ gridTemplateColumns: `repeat(${displayAdus.length}, 1fr)` }}>
                {displayAdus.map((sc, idx) => {
                    const cf = sc.cashflowMonthly ?? 0;
                    const isPos = cf >= 0;
                    const roi = sc.roi ?? 0;
                    const sqft = getFpSqft(sc.key);

                    const y1Pct = ((sc.year1EquityBoost ?? 0) / maxEquity) * 100;
                    const y5Pct = ((sc.year5EquityBoost ?? 0) / maxEquity) * 100;
                    const y10Pct = ((sc.year10EquityBoost ?? 0) / maxEquity) * 100;

                    return (
                        <div key={sc.key} className={s.roiCard}>
                            {/* Card header */}
                            <div className={s.cardHead}>
                                <span className={s.cardSqft}>{sqft ? `${sqft.toLocaleString()} sqft` : ""}</span>
                                <div className={s.cardNameText}>
                                    <PlanName name={getFpName(sc.key)} theme="dark" />
                                </div>
                            </div>

                            {/* Hero band: cashflow + ROI */}
                            <div className={s.heroBand}>
                                <div className={s.heroBlock}>
                                    <span className={s.heroLabel}>Monthly cashflow</span>
                                    <span className={`${s.heroVal} ${isPos ? s.heroValPositive : s.heroValNegative}`}>
                                        {isPos ? "+" : "−"}
                                        <CountDollar n={Math.abs(cf)} active={active} delay={idx * 80} />
                                    </span>
                                </div>
                                <div className={s.heroBlock}>
                                    <span className={s.heroLabel}>Annual ROI</span>
                                    <span className={`${s.heroVal} ${s.heroValGold}`}>
                                        <CountPct n={roi} active={active} delay={60 + idx * 80} />
                                    </span>
                                </div>
                            </div>

                            {/* Supporting KV grid */}
                            <div className={s.kvGrid}>
                                <div className={s.kvItem}>
                                    <div className={s.kvLabel}>Est. Rent</div>
                                    <div className={s.kvVal}>
                                        <CountDollar n={sc.rentMonthly ?? 0} active={active} delay={120 + idx * 80} />
                                    </div>
                                </div>
                                <div className={s.kvItem}>
                                    <div className={s.kvLabel}>Payment</div>
                                    <div className={`${s.kvVal} ${s.kvValMuted}`}>
                                        <CountDollar n={sc.monthlyCost} active={active} delay={160 + idx * 80} />
                                    </div>
                                </div>
                                <div className={s.kvItem}>
                                    <div className={s.kvLabel}>Out of pocket</div>
                                    <div className={`${s.kvVal}`} style={{ color: "var(--p-positive-bright)" }}>$0</div>
                                </div>
                                <div className={s.kvItem}>
                                    <div className={s.kvLabel}>Financed</div>
                                    <div className={s.kvVal}>100%</div>
                                </div>
                            </div>

                            {/* Equity ladder */}
                            <div className={s.equityLadder}>
                                {([
                                    { label: "Yr 1", val: sc.year1EquityBoost ?? 0, pct: y1Pct, delay: 200 },
                                    { label: "Yr 5", val: sc.year5EquityBoost ?? 0, pct: y5Pct, delay: 270 },
                                    { label: "Yr 10", val: sc.year10EquityBoost ?? 0, pct: y10Pct, delay: 340 },
                                ] as const).map((row) => (
                                    <div key={row.label} className={s.equityRow}>
                                        <span className={s.equityRowLabel}>{row.label}</span>
                                        <EquityBar pct={row.pct} active={active} delay={row.delay + idx * 80} />
                                        <span className={s.equityRowVal}>
                                            <CountShort n={row.val} active={active} delay={row.delay + idx * 80} />
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>

            <RunningFooter
                theme="dark"
                left={<span className={s.disclaimer}>Backyard Estates does not guarantee rental income or long-term value. Illustrative.</span>}
            />
        </div>
    );
}
