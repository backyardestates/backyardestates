"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { usePresentationStore } from "@/lib/store/presentationStore";
import s from "./Slide8.module.css";

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

function AnimDollar({ n, active, delay = 0 }: { n: number; active: boolean; delay?: number }) {
    const v = useCountUp(Math.abs(n), active, delay);
    return <>{fmt$(v)}</>;
}

function AnimPct({ n, active, delay = 0 }: { n: number; active: boolean; delay?: number }) {
    const v = useCountUp(Math.round(Math.abs(n) * 1000), active, delay);
    return <>{(v / 10).toFixed(1)}%</>;
}

function AnimShort({ n, active, delay = 0 }: { n: number; active: boolean; delay?: number }) {
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

function lastNameFromFull(full?: string) {
    if (!full) return "";
    const parts = full.trim().split(/\s+/);
    return parts[parts.length - 1] ?? "";
}

function cityFromAddress(addr: string) {
    const parts = addr.split(",");
    return parts.length >= 2 ? parts[parts.length - 2].trim() : addr;
}

export function Slide8_ROIComparison() {
    const { scenarios, currentSlide, comparedUnitIds, floorplans, customerName, propertyAddress } = usePresentationStore();
    const active = currentSlide === 8;

    const aduScenarios = scenarios.filter((sc) => sc.kind === "adu");
    const comparedAdus = comparedUnitIds.length > 0
        ? aduScenarios.filter((sc) => comparedUnitIds.includes(sc.key.replace(/^adu_/, "")))
        : aduScenarios.slice(0, 3);
    const displayAdus = comparedAdus.length > 0 ? comparedAdus : aduScenarios.slice(0, 3);

    function fpId(key: string) { return key.replace(/^adu_/, ""); }
    function getFpName(key: string) {
        const fp = floorplans.find((f) => f._id === fpId(key));
        return fp?.name ?? fpId(key);
    }
    function getFpSqft(key: string) {
        const fp = floorplans.find((f) => f._id === fpId(key));
        const sc = displayAdus.find((sc2) => sc2.key === key);
        return fp?.sqft ?? sc?.sqft ?? null;
    }

    const maxEquity = Math.max(...displayAdus.map((sc) => sc.year10EquityBoost ?? 0), 1);

    // Featured = middle by sqft when 3 plans
    const featuredKey = useMemo(() => {
        if (displayAdus.length < 3) return null;
        const sorted = [...displayAdus].sort((a, b) => (getFpSqft(a.key) ?? 0) - (getFpSqft(b.key) ?? 0));
        return sorted[Math.floor(sorted.length / 2)]?.key ?? null;
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [displayAdus.length, comparedUnitIds.join(",")]);

    const lastName = lastNameFromFull(customerName);
    const city = propertyAddress ? cityFromAddress(propertyAddress) : "—";

    if (displayAdus.length === 0) {
        return (
            <div className={s.slide}>
                <div className="running-header rh-dark">
                    <span className="running-header-left">{lastName} · {city}</span>
                    <span className="running-header-center">Your Return</span>
                    <span className="running-header-right">
                        <span className="running-header-num">08</span> / 10
                    </span>
                </div>
                <div style={{
                    display: "flex", alignItems: "center", justifyContent: "center",
                    flex: 1, color: "rgba(212,176,116,0.32)",
                    fontFamily: "var(--p-font-display)", fontStyle: "italic",
                    fontSize: "var(--p-text-lg)",
                }}>
                    Waiting for scenario data…
                </div>
            </div>
        );
    }

    return (
        <div className={s.slide}>
            {/* Running header */}
            <div className="running-header rh-dark">
                <span className="running-header-left">{lastName} · {city}</span>
                <span className="running-header-center">Your Return</span>
                <span className="running-header-right">
                    <span className="running-header-num">08</span> / 10
                </span>
            </div>

            {/* Headline */}
            <div className={s.headRow}>
                <div className={s.headLeft}>
                    <h2 className="section-title on-dark">
                        The <em>return.</em>
                    </h2>
                    <span className={s.headSubhead}>Cashflow · ROI · equity ladder by plan</span>
                </div>
                <span className={s.termsChip}>6.5% · 30 yr · 100% financed · $0 OOP</span>
            </div>

            {/* Cards grid */}
            <div
                className={s.body}
                style={{ gridTemplateColumns: `repeat(${displayAdus.length}, 1fr)` }}
            >
                {displayAdus.map((sc, idx) => {
                    const cf = sc.cashflowMonthly ?? 0;
                    const isPos = cf >= 0;
                    const roi = sc.roi ?? 0;
                    const sqft = getFpSqft(sc.key);
                    const isFeatured = sc.key === featuredKey;

                    const y1Pct = ((sc.year1EquityBoost ?? 0) / maxEquity) * 100;
                    const y5Pct = ((sc.year5EquityBoost ?? 0) / maxEquity) * 100;
                    const y10Pct = ((sc.year10EquityBoost ?? 0) / maxEquity) * 100;

                    return (
                        <div key={sc.key} className={`${s.card} ${isFeatured ? s.cardFeatured : ""}`}>
                            {isFeatured && <div className="rec-badge">Best Return</div>}

                            <div className={s.cardHead}>
                                <span className={s.cardEyebrow}>The Plan</span>
                                <span className={s.cardName}>{getFpName(sc.key)}</span>
                                {sqft && <span className={s.cardSqft}>{sqft.toLocaleString()} sqft</span>}
                            </div>

                            {/* HERO band */}
                            <div className={s.heroBand}>
                                <div className={s.heroBlock}>
                                    <span className={s.heroEyebrow}>Monthly Cashflow</span>
                                    <div className={`${s.cashflowVal} ${isPos ? s.cashflowPos : s.cashflowNeg}`}>
                                        {isPos ? "+" : "−"}<AnimDollar n={Math.abs(cf)} active={active} delay={idx * 80} />
                                    </div>
                                    <span className={s.cashflowSub}>at $0 out of pocket</span>
                                </div>
                                <div className={s.heroDivider} />
                                <div className={s.heroBlock}>
                                    <span className={s.heroEyebrow}>Annual ROI</span>
                                    <div className={s.roiVal}>
                                        <AnimPct n={roi} active={active} delay={120 + idx * 80} />
                                    </div>
                                    <span className={s.roiSub}>year 1 · before equity</span>
                                </div>
                            </div>

                            {/* Supporting numbers */}
                            <div className={s.support}>
                                <div className={s.kv}>
                                    <span className={s.kvLabel}>Est. Rent</span>
                                    <span className={s.kvVal}>
                                        <AnimDollar n={sc.rentMonthly ?? 0} active={active} delay={200 + idx * 80} />/mo
                                    </span>
                                </div>
                                <div className={s.kv}>
                                    <span className={s.kvLabel}>Payment</span>
                                    <span className={s.kvVal}>
                                        <AnimDollar n={sc.monthlyCost} active={active} delay={240 + idx * 80} />/mo
                                    </span>
                                </div>
                                <div className={s.kv}>
                                    <span className={s.kvLabel}>Out of Pocket</span>
                                    <span className={`${s.kvVal} ${s.pos}`}>$0</span>
                                </div>
                                <div className={s.kv}>
                                    <span className={s.kvLabel}>Financed</span>
                                    <span className={s.kvVal}>100%</span>
                                </div>
                            </div>

                            {/* Equity ladder */}
                            <div className={s.equityLadder}>
                                <div className={s.equityHead}>Equity Ladder</div>
                                {([
                                    { label: "Yr 1",  val: sc.year1EquityBoost ?? 0,  pct: y1Pct,  delay: 320 },
                                    { label: "Yr 5",  val: sc.year5EquityBoost ?? 0,  pct: y5Pct,  delay: 390 },
                                    { label: "Yr 10", val: sc.year10EquityBoost ?? 0, pct: y10Pct, delay: 460 },
                                ] as const).map((row) => (
                                    <div key={row.label} className={s.equityRow}>
                                        <span className={s.equityLabel}>{row.label}</span>
                                        <EquityBar pct={row.pct} active={active} delay={row.delay + idx * 80} />
                                        <span className={s.equityVal}>
                                            <AnimShort n={row.val} active={active} delay={row.delay + idx * 80} />
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Footer */}
            <div className={s.footer}>
                <span className={s.disclaimer}>Backyard Estates does not guarantee rental income or long-term value. Illustrative.</span>
                <span className={s.tagline}>We build for you.</span>
            </div>
        </div>
    );
}
