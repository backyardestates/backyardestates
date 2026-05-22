"use client";

import React, { useEffect, useRef, useState } from "react";
import { usePresentationStore } from "@/lib/store/presentationStore";
import s from "./Slide9.module.css";

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

function lastNameFromFull(full?: string) {
    if (!full) return "";
    const parts = full.trim().split(/\s+/);
    return parts[parts.length - 1] ?? "";
}

function cityFromAddress(addr: string) {
    const parts = addr.split(",");
    return parts.length >= 2 ? parts[parts.length - 2].trim() : addr;
}

export function Slide9_ADUvsHouse() {
    const { scenarios, currentSlide, customerName, propertyAddress, isPrintMode } = usePresentationStore();
    const active = currentSlide === 9 || isPrintMode;

    const aduScenarios = scenarios.filter((sc) => sc.kind === "adu");
    const houseSc = scenarios.find((sc) => sc.kind === "house");

    const aduSc = aduScenarios.reduce<typeof aduScenarios[0] | null>((best, sc) => {
        if (!best) return sc;
        return (sc.cashflowMonthly ?? -Infinity) > (best.cashflowMonthly ?? -Infinity) ? sc : best;
    }, null);

    const acf = aduSc?.cashflowMonthly ?? 0;
    const hcf = houseSc?.cashflowMonthly ?? 0;
    const acfCount = useCountUp(Math.abs(acf), active, 600);
    const hcfCount = useCountUp(Math.abs(hcf), active, 600);

    // 10-year property value increase — the ADU's equity boost over 10 years.
    const propertyBoost = useCountUp(
        Math.max(0, aduSc?.year10EquityBoost ?? 0),
        active, 800, 1700
    );

    const lastName = lastNameFromFull(customerName);
    const city = propertyAddress ? cityFromAddress(propertyAddress) : "—";

    if (!aduSc && !houseSc) {
        return (
            <div className={s.slide}>
                <div className="running-header rh-light">
                    <span className="running-header-left">{lastName} · {city}</span>
                    <span className="running-header-center">ADU vs House</span>
                    <span className="running-header-right">
                        <span className="running-header-num">09</span> / 15
                    </span>
                </div>
                <div className={s.empty}>Waiting for scenario data…</div>
            </div>
        );
    }

    type Row = {
        label: string;
        house: React.ReactNode;
        adu: React.ReactNode;
        summary?: boolean;
    };

    const rows: Row[] = [
        {
            label: "Purchase price",
            house: <AnimDollar n={houseSc?.purchasePrice ?? 0} active={active} delay={0} />,
            adu: <AnimDollar n={aduSc?.finalAduPrice ?? 0} active={active} delay={0} />,
        },
        {
            label: "Down payment",
            house: <AnimDollar n={houseSc?.downPayment ?? 0} active={active} delay={60} />,
            adu: <span className={s.rowPos}>$0</span>,
        },
        {
            label: "Cost out of pocket",
            summary: true,
            house: <span className={s.rowNeg}>−<AnimDollar n={houseSc?.downPayment ?? 0} active={active} delay={120} /></span>,
            adu: <span className={s.rowPos}>$0</span>,
        },
        {
            label: "Monthly payment",
            house: <AnimDollar n={houseSc?.mtgPaymentMonthly ?? 0} active={active} delay={180} />,
            adu: <AnimDollar n={aduSc?.mtgPaymentMonthly ?? 0} active={active} delay={180} />,
        },
        {
            label: "Property tax",
            house: <AnimDollar n={houseSc?.propertyTaxMonthly ?? 0} active={active} delay={240} />,
            adu: <AnimDollar n={aduSc?.propertyTaxMonthly ?? 0} active={active} delay={240} />,
        },
        {
            label: "Insurance · maintenance",
            house: <AnimDollar n={houseSc?.insuranceMonthly ?? 0} active={active} delay={300} />,
            adu: <AnimDollar n={aduSc?.insuranceMonthly ?? 0} active={active} delay={300} />,
        },
        {
            label: "Monthly cost",
            summary: true,
            house: <span className={s.rowNeg}>−<AnimDollar n={houseSc?.monthlyCost ?? 0} active={active} delay={360} /></span>,
            adu: <span className={s.rowNeg}>−<AnimDollar n={aduSc?.monthlyCost ?? 0} active={active} delay={360} /></span>,
        },
        {
            label: "Rent collected",
            house: <AnimDollar n={houseSc?.rentMonthly ?? 0} active={active} delay={420} />,
            adu: <AnimDollar n={aduSc?.rentMonthly ?? 0} active={active} delay={420} />,
        },
    ];

    return (
        <div className={s.slide}>
            {/* Running header */}
            <div className="running-header rh-light">
                <span className="running-header-left">{lastName} · {city}</span>
                <span className="running-header-center">ADU vs House</span>
                <span className="running-header-right">
                    <span className="running-header-num">09</span> / 15
                </span>
            </div>

            {/* Headline */}
            <div className={s.headRow}>
                <div className={s.headLeft}>
                    <h2 className="section-title">
                        ADU vs. <em>buying a house.</em>
                    </h2>
                    <span className={s.headSubhead}>10-year horizon · same starting capital</span>
                </div>
            </div>

            {/* Comparison table + tax-detail bullets */}
            <div className={s.tableRow}>
            <div className={s.tableCard}>
                <div className={s.thead}>
                    <div className={s.thLabel}>Line Item</div>
                    <div className={`${s.thCol} ${s.thHouse}`}>Your House</div>
                    <div className={`${s.thCol} ${s.thAdu}`}>Your ADU</div>
                </div>

                <div className={s.tbody}>
                    {rows.map((row) => (
                        <div
                            key={row.label}
                            className={`${s.row} ${row.summary ? s.rowSummary : ""}`}
                        >
                            <div className={s.rowLabel}>{row.label}</div>
                            <div className={s.rowVal}>{row.house}</div>
                            <div className={`${s.rowVal} ${s.rowAdu}`}>{row.adu}</div>
                        </div>
                    ))}

                    {/* Hero cashflow row */}
                    <div className={s.rowCashflow}>
                        <div className={s.rowLabel}>Monthly cashflow</div>
                        <div className={s.rowCfVal}>
                            <span className={`${s.cfArrow} ${s.down}`}>↓</span>
                            <span className={s.cfValNeg}>−{fmt$(hcfCount)}</span>
                        </div>
                        <div className={s.rowCfVal}>
                            <span className={`${s.cfArrow} ${s.up}`}>↑</span>
                            <span className={s.cfValPos}>+{fmt$(acfCount)}</span>
                        </div>
                    </div>
                </div>
            </div>

                {/* Tax-detail bullets — to the right of the table */}
                <div className={s.bulletsCol}>
                    <span className={s.bulletsEyebrow}>Property Tax Advantage</span>
                    <ul className={s.bullets}>
                        <li className={s.bullet}>
                            <span className={s.bulletIcon}>✓</span>
                            <span className={s.bulletText}>
                                <strong>No reassessment</strong> of your existing home or land. Prop&nbsp;13 keeps your base locked.
                            </span>
                        </li>
                        <li className={s.bullet}>
                            <span className={s.bulletIcon}>✓</span>
                            <span className={s.bulletText}>
                                The county only adds the ADU&apos;s <strong>hard construction cost</strong> — not its market value.
                            </span>
                        </li>
                        <li className={s.bullet}>
                            <span className={s.bulletIcon}>✓</span>
                            <span className={s.bulletText}>
                                When the property appreciates, <strong>your tax bill doesn&apos;t.</strong>
                            </span>
                        </li>
                        <li className={s.bullet}>
                            <span className={s.bulletIcon}>✓</span>
                            <span className={s.bulletText}>
                                Net effect: more equity, more rent — <strong>almost no tax bump.</strong>
                            </span>
                        </li>
                    </ul>
                </div>
            </div>

            {/* 10-Year Advantage — anchored to bottom of slide */}
            <div className={s.anchor}>
                <div className={s.anchorLeft}>
                    <span className={s.anchorEyebrow}>10-Year Advantage</span>
                    <span className={s.anchorBlurb}>
                        In 10 years your property value could go up by
                    </span>
                </div>
                <div className={s.anchorValue}>
                    +{fmt$(propertyBoost)}
                </div>
            </div>

            {/* Footer */}
            <div className={s.footer}>
                <span className={s.disclaimer}>
                    Estimates based on current market rates. Backyard Estates does not guarantee rental income or property values. Illustrative.
                </span>
                <span className={s.tagline}>We build for you.</span>
            </div>
        </div>
    );
}
