"use client";

import React, { useEffect, useRef, useState } from "react";
import { usePresentationStore } from "@/lib/store/presentationStore";
import s from "./Slide6.module.css";

function fmt$(n: number) {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
}
function fmtPct(n: number) {
    return (n * 100).toFixed(1) + "%";
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

function CountDollar({ n, active, delay = 0 }: { n: number; active: boolean; delay?: number }) {
    const v = useCountUp(Math.abs(n), active, delay);
    return <>{fmt$(v)}</>;
}
function CountPct({ n, active, delay = 0 }: { n: number; active: boolean; delay?: number }) {
    const v = useCountUp(Math.round(Math.abs(n) * 1000), active, delay);
    return <>{(v / 10).toFixed(1)}%</>;
}

export function Slide6_YourInvestment() {
    const { scenarios, currentSlide, comparedUnitIds, floorplans } = usePresentationStore();
    const active = currentSlide === 6;

    const aduScenarios = scenarios.filter((sc) => sc.kind === "adu");
    const comparedAdus = comparedUnitIds.length > 0
        ? aduScenarios.filter((sc) => comparedUnitIds.includes(sc.key))
        : aduScenarios.slice(0, 3);
    const displayAdus = comparedAdus.length > 0 ? comparedAdus : aduScenarios.slice(0, 3);

    function getFpName(key: string) {
        const fp = floorplans.find((f) => f._id === key);
        return fp?.name ?? key;
    }
    function getFpSqft(key: string) {
        const fp = floorplans.find((f) => f._id === key);
        const sc = displayAdus.find((s) => s.key === key);
        return fp?.sqft ?? sc?.sqft ?? null;
    }

    if (displayAdus.length === 0) {
        return (
            <div className={s.slide} style={{ alignItems: "center", justifyContent: "center" }}>
                <div style={{ color: "rgba(26,58,58,0.3)", fontSize: 15, fontFamily: "var(--p-font)" }}>Waiting for scenario data…</div>
            </div>
        );
    }

    return (
        <div className={s.slide}>
            <div className="slide-header slide-header-dark">
                <span className="slide-header-title">Return on investment</span>
                <span style={{ fontSize: "var(--p-xs)", color: "var(--p-text-white-50)" }}>6.5% · 30yr · 100% financed</span>
            </div>

            <div className={s.body} style={{ gridTemplateColumns: `repeat(${displayAdus.length}, 1fr)` }}>
                {displayAdus.map((sc, idx) => {
                    const cf = sc.cashflowMonthly ?? 0;
                    const isPos = cf >= 0;
                    const roi = sc.roi ?? 0;
                    const sqft = getFpSqft(sc.key);
                    return (
                        <div key={sc.key} className={s.roiCard}>
                            <div className={s.cardHead}>
                                <span className={s.cardName}>{getFpName(sc.key)}</span>
                                {sqft && <span className={s.cardSqft}>{sqft.toLocaleString()} sqft</span>}
                            </div>

                            <div className={s.dataRows}>
                                <div className={s.dataRow}>
                                    <span className={s.rowLabel}>Financed</span>
                                    <span className={s.rowVal}>100%</span>
                                </div>
                                <div className={s.dataRow}>
                                    <span className={s.rowLabel}>Out of Pocket</span>
                                    <span className={`${s.rowVal} ${s.rowValPositive}`}>$0</span>
                                </div>
                                <div className={s.dataRow}>
                                    <span className={s.rowLabel}>Equity Boost</span>
                                    <span className={`${s.rowVal} ${s.rowValPositive}`}>
                                        <CountDollar n={sc.year1EquityBoost} active={active} delay={idx * 80} />
                                    </span>
                                </div>
                                <div className={s.dataRow}>
                                    <span className={s.rowLabel}>Year 5</span>
                                    <span className={s.rowVal}>
                                        <CountDollar n={sc.year5EquityBoost} active={active} delay={80 + idx * 80} />
                                    </span>
                                </div>
                                <div className={s.dataRow}>
                                    <span className={s.rowLabel}>Year 10</span>
                                    <span className={s.rowVal}>
                                        <CountDollar n={sc.year10EquityBoost} active={active} delay={160 + idx * 80} />
                                    </span>
                                </div>
                                <div className={s.dataRow}>
                                    <span className={s.rowLabel}>Est. Rent</span>
                                    <span className={`${s.rowVal} ${s.rowValPositive}`}>
                                        <CountDollar n={sc.rentMonthly ?? 0} active={active} delay={240 + idx * 80} />
                                    </span>
                                </div>
                                <div className={s.dataRow}>
                                    <span className={s.rowLabel}>Payment</span>
                                    <span className={s.rowVal}>
                                        <CountDollar n={sc.monthlyCost} active={active} delay={300 + idx * 80} />
                                    </span>
                                </div>
                            </div>

                            <div className={s.cashflowSection}>
                                <div className={s.cashflowLabel}>Monthly Cashflow</div>
                                <div className={s.cashflowVal} style={{ color: isPos ? "var(--p-positive)" : "var(--p-negative)" }}>
                                    {isPos ? "↑" : "↓"} <CountDollar n={Math.abs(cf)} active={active} delay={360 + idx * 80} />
                                </div>
                            </div>

                            <div className={s.roiSection}>
                                <div className={s.roiVal}>
                                    <CountPct n={roi} active={active} delay={420 + idx * 80} />
                                </div>
                                <div className={s.roiLabel}>Annual Return</div>
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className={s.wbfy}>We build for you.</div>
            <div className={s.disclaimer}>
                Backyard Estates does not make any guarantees regarding rental income or long-term value.
            </div>
        </div>
    );
}
