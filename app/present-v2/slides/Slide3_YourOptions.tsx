"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { usePresentationStore } from "@/lib/store/presentationStore";
import { getDiscountLines, createEmptyDiscountState, type DiscountState } from "@/lib/investment/discounts";
import s from "./Slide3.module.css";

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

function AnimDollar({ n, active, delay = 0, duration = 1400 }: { n: number; active: boolean; delay?: number; duration?: number }) {
    const v = useCountUp(n, active, delay, duration);
    return <>{fmt$(v)}</>;
}

function cityFromAddress(addr: string) {
    const parts = addr.split(",");
    return parts.length >= 2 ? parts[parts.length - 2].trim() : addr;
}

function lastNameFromFull(full?: string) {
    if (!full) return "";
    const parts = full.trim().split(/\s+/);
    return parts[parts.length - 1] ?? "";
}

const INCLUDED_COLS = [
    {
        label: "Services",
        items: ["Custom plans", "Engineering", "Title 24", "Permit expediting", "Project manager"],
    },
    {
        label: "Construction",
        items: ["Slab-on-grade", "2×4 framing", "R19/R30 insulation", "Heat pump water"],
    },
    {
        label: "Interior",
        items: ["LVP flooring", "Vaulted ceilings", "Mini-split HVAC", "LED lighting"],
    },
    {
        label: "Kitchen & Bath",
        items: ["Shaker cabinets", "Quartz counters", "Samsung appliances", "Undermount sinks"],
    },
    {
        label: "Exterior",
        items: ["Stucco siding", "30-yr shingle roof", "Low-E windows", "Solar PV (2+ bed)"],
    },
];

export function Slide3_YourOptions() {
    const {
        comparedUnitIds,
        floorplans,
        scenarios,
        aduType,
        propertyAddress,
        customerName,
        siteWorkTagsByUnitId,
        discountLinesByUnitId,
        currentSlide,
    } = usePresentationStore();
    const active = currentSlide === 3;

    const units = floorplans.filter((fp) => comparedUnitIds.includes(fp._id));
    const displayUnits = units.length > 0 ? units : floorplans.slice(0, 3);

    const aduLabel = aduType
        ? ({ detached: "Detached ADU", attached: "Attached ADU", garage: "Garage Conversion" }[aduType] ?? aduType)
        : "";
    const city = propertyAddress ? cityFromAddress(propertyAddress) : "";
    const lastName = lastNameFromFull(customerName);
    const subheadParts = [aduLabel, city].filter(Boolean);
    const subhead = subheadParts.join(" · ");

    function getScenario(unitId: string) {
        return scenarios.find((sc) => sc.kind === "adu" && sc.key === `adu_${unitId}`);
    }

    // Featured plan = middle plan by sqft (when 3 plans). When ≤2 plans, no featured.
    const featuredId = useMemo(() => {
        if (displayUnits.length < 3) return null;
        const bySqft = [...displayUnits].sort((a, b) => (a.sqft ?? 0) - (b.sqft ?? 0));
        return bySqft[Math.floor(bySqft.length / 2)]?._id ?? null;
    }, [displayUnits]);

    const [lsDiscountLines, setLsDiscountLines] = useState<Record<string, { label: string; amount: number }[]>>({});
    const comparedKey = comparedUnitIds.join(",");
    useEffect(() => {
        try {
            const dpMaster: DiscountState = JSON.parse(localStorage.getItem("dp_master") ?? "null") ?? createEmptyDiscountState();
            const dpCustom: Record<string, DiscountState | null> = JSON.parse(localStorage.getItem("dp_custom") ?? "null") ?? {};
            const next: Record<string, { label: string; amount: number }[]> = {};
            for (const id of comparedUnitIds) {
                const effective = dpCustom[id] ?? dpMaster;
                next[id] = getDiscountLines(effective);
            }
            setLsDiscountLines(next);
        } catch { /* malformed */ }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [comparedKey]);

    const discountLines = Object.keys(lsDiscountLines).length > 0 ? lsDiscountLines : discountLinesByUnitId;
    const allDiscountLabels = Array.from(new Set(
        displayUnits.flatMap((fp) => (discountLines[fp._id] ?? []).map((d) => d.label))
    ));
    const anyDiscount = displayUnits.some((fp) => (getScenario(fp._id)?.discountApplied ?? 0) > 0);
    const useNamedRows = allDiscountLabels.length > 0;
    const showFallbackDiscount = !useNamedRows && anyDiscount;

    const colsClass = displayUnits.length === 1 ? s.cols1
                    : displayUnits.length === 2 ? s.cols2
                    : "";

    return (
        <div className={s.slide}>
            {/* Running header */}
            <div className="running-header rh-light">
                <span className="running-header-left">
                    {lastName ? `${lastName} · ` : ""}{city || "—"}
                </span>
                <span className="running-header-center">Your Options</span>
                <span className="running-header-right">
                    <span className="running-header-num">03</span> / 13
                </span>
            </div>

            {/* Headline row */}
            <div className={s.headRow}>
                <div className={s.headLeft}>
                    <h2 className="section-title">
                        Your <em>options</em>
                    </h2>
                    {subhead && <span className={s.headSubhead}>{subhead}</span>}
                </div>
            </div>

            {/* Inclusions strip */}
            <div className={s.inclusionsStrip}>
                <div className={s.inclusionsLabel}>
                    <span className={s.inclusionsLabelTitle}>Every plan includes</span>
                    <span className={s.inclusionsLabelSub}>Five departments · one price</span>
                </div>
                {INCLUDED_COLS.map((col) => (
                    <div key={col.label} className={s.inclusionCol}>
                        <div className={s.inclusionColTitle}>{col.label}</div>
                        {col.items.map((item) => (
                            <div key={item} className={s.inclusionItem}>{item}</div>
                        ))}
                    </div>
                ))}
            </div>

            {/* Plan columns */}
            <div className={`${s.planColumns} ${colsClass}`}>
                {displayUnits.map((fp, i) => {
                    const sc = getScenario(fp._id);
                    const base = sc?.baseAduPrice ?? fp.price ?? 0;
                    const sw = sc?.siteWorkApplied ?? 0;
                    const total = sc?.finalAduPrice ?? sc?.purchasePrice ?? 0;
                    const perUnitTags = siteWorkTagsByUnitId[fp._id] ?? [];
                    const isFeatured = fp._id === featuredId;

                    const unitDiscounts: { label: string; amount: number }[] = useNamedRows
                        ? allDiscountLabels.map((label) => {
                            const line = (discountLines[fp._id] ?? []).find((d) => d.label === label);
                            return line ? { label, amount: line.amount } : { label, amount: 0 };
                        }).filter((d) => d.amount > 0)
                        : showFallbackDiscount
                            ? (() => { const disc = sc?.discountApplied ?? 0; return disc > 0 ? [{ label: "Discount", amount: disc }] : []; })()
                            : [];

                    return (
                        <div key={fp._id} className={`${s.planCol} ${isFeatured ? s.featured : ""}`}>
                            {isFeatured && <div className="rec-badge">Recommended</div>}

                            {/* Plan header */}
                            <div className={s.planColHeader}>
                                <div className={s.planEyebrow}>The Plan</div>
                                <div className={s.planName}>{fp.name}</div>
                                <div className={s.planSqft}>
                                    {fp.sqft ? fp.sqft.toLocaleString() : "—"}
                                    <span className={s.planSqftLabel}>sqft</span>
                                </div>
                            </div>

                            {/* Hero total — THE biggest thing on the slide */}
                            <div className={s.heroTotal}>
                                <div className={s.heroTotalEyebrow}>Total · After Discounts</div>
                                <div className={s.heroTotalVal}>
                                    {total ? <AnimDollar n={total} active={active} delay={i * 80} /> : "—"}
                                </div>
                                <div className={s.heroTotalSub}>Turnkey · nothing due until each milestone is completed</div>
                            </div>

                            {/* Breakdown */}
                            <div className={s.planBreakdown}>
                                <div className={s.breakdownRow}>
                                    <span className={s.breakdownLabel}>Base unit</span>
                                    <span className={s.breakdownVal}>
                                        {base ? <AnimDollar n={base} active={active} delay={400 + i * 60} /> : "—"}
                                    </span>
                                </div>
                                <div className={s.breakdownRow}>
                                    <span className={s.breakdownLabel}>Pre-permit &amp; build</span>
                                    <span className={`${s.breakdownVal} ${s.valIncluded}`}>Included</span>
                                </div>
                                {sw > 0 && (
                                    <div className={s.breakdownRow}>
                                        <span className={s.breakdownLabel}>Site work</span>
                                        <span className={s.breakdownVal}>
                                            <AnimDollar n={sw} active={active} delay={460 + i * 60} />
                                        </span>
                                    </div>
                                )}

                                {perUnitTags.length > 0 && (
                                    <div className={s.tagRow}>
                                        {perUnitTags.map((label, j) => (
                                            <span key={j} className={s.siteTag}>{label}</span>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Discount callouts */}
                            {unitDiscounts.length > 0 && (
                                <div className={s.discounts}>
                                    {unitDiscounts.map((d, j) => (
                                        <div key={j} className={s.discountCallout}>
                                            <span className={s.discountLabel}>{d.label}</span>
                                            <span className={s.discountAmt}>
                                                −<AnimDollar n={d.amount} active={active} delay={600 + i * 60 + j * 40} />
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Footer */}
            <div className={s.footer}>
                <span className={s.footerDisclaimer}>
                    Offer valid 15 days · $10,000 water meter allowance if required · Nothing due until each milestone is completed.
                </span>
                <span className={s.footerTagline}>We build for you.</span>
            </div>
        </div>
    );
}
