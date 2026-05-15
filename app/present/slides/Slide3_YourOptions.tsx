"use client";

import React, { useEffect, useRef, useState } from "react";
import { usePresentationStore } from "@/lib/store/presentationStore";
import { getDiscountLines, createEmptyDiscountState, type DiscountState } from "@/lib/investment/discounts";
import s from "./Slide3.module.css";

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
    const v = useCountUp(n, active, delay);
    return <>{fmt$(v)}</>;
}

function cityFromAddress(addr: string) {
    const parts = addr.split(",");
    return parts.length >= 2 ? parts[parts.length - 2].trim() : addr;
}

const LEFT_CATEGORIES = [
    { label: "SERVICES", items: ["Custom architectural plans", "Structural + Title 24 engineering", "Full permit expediting (fees included)", "Dedicated project manager", "Weekly photo updates + portal", "Solar PV system (2+ bed detached)"] },
    { label: "CONSTRUCTION", items: ["Slab-on-grade foundation", "2x4 framing + R19/R30 insulation", "40-gal heat pump water heater", "CA Title 24 energy compliant"] },
    { label: "INTERIOR", items: ["LVP flooring (7 options)", "Vaulted ceilings in living/kitchen", "Mini-split HVAC", "Ceiling fans in bedrooms"] },
    { label: "KITCHEN + BATHROOMS", items: ["Shaker cabinets (8 color options)", "Quartz counters (13 options)", "Samsung stainless appliance package", "Quartz vanity countertops"] },
    { label: "EXTERIOR", items: ["Stucco siding", "30-yr asphalt shingle roof", "Dual-pane Low-E vinyl windows"] },
];

export function Slide3_YourOptions() {
    const { comparedUnitIds, floorplans, scenarios, aduType, propertyAddress, siteWorkTagsByUnitId, discountLinesByUnitId, currentSlide } = usePresentationStore();
    const active = currentSlide === 3;

    const units = floorplans.filter((fp) => comparedUnitIds.includes(fp._id));
    const displayUnits = units.length > 0 ? units : floorplans.slice(0, 3);
    const unitCount = displayUnits.length;

    const aduLabel = aduType
        ? ({ detached: "Detached ADU", attached: "Attached ADU", garage: "Garage Conversion" }[aduType] ?? aduType)
        : "";
    const city = propertyAddress ? cityFromAddress(propertyAddress) : "";
    const headerRight = [aduLabel, city].filter(Boolean).join(" · ");

    function getScenario(unitId: string) {
        return scenarios.find((sc) => sc.kind === "adu" && sc.key === `adu_${unitId}`);
    }

    // Dynamic grid: left label col + one value col per unit
    const gridCols = `190px ${displayUnits.map(() => "1fr").join(" ")}`;

    // Site work tags
    const siteWorkTagsPerUnit = displayUnits.map((fp) => siteWorkTagsByUnitId[fp._id] ?? []);
    const firstLabels = siteWorkTagsPerUnit[0]?.join("|") ?? "";
    const siteWorkIsSame = siteWorkTagsPerUnit.every((tags) => tags.join("|") === firstLabels);
    const sharedSiteWorkTags = siteWorkIsSame ? (siteWorkTagsPerUnit[0] ?? []) : [];

    // Discount lines from localStorage (most reliable)
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

    return (
        <div className={s.slide}>
            {/* Header */}
            <div className="slide-header">
                <span className="slide-header-title">Your options — project breakdown</span>
                {headerRight && <span className="slide-header-pill">{headerRight}</span>}
            </div>

            <div className={s.body}>
                {/* LEFT: inclusions list */}
                <div className={s.leftPanel}>
                    <div className={s.leftHead}>
                        <div className={s.leftHeadTitle}>Base Price Includes</div>
                    </div>
                    <div className={s.leftCategories}>
                        {LEFT_CATEGORIES.map((cat) => (
                            <div key={cat.label}>
                                <div className={s.catLabel}>{cat.label}</div>
                                {cat.items.map((item) => (
                                    <div key={item} className={s.catItem}>{item}</div>
                                ))}
                            </div>
                        ))}
                    </div>
                    <div className={s.leftFooter}>
                        <span className={s.leftFooterText}>We build for you.</span>
                    </div>
                </div>

                {/* RIGHT: price table */}
                <div className={s.rightPanel}>
                    {/* Column headers */}
                    <div className={s.colHeaders} style={{ gridTemplateColumns: gridCols }}>
                        <div className={s.colHeaderLabel}>Line Item</div>
                        {displayUnits.map((fp) => (
                            <div key={fp._id} className={s.colHeaderVal}>{fp.name}</div>
                        ))}
                    </div>

                    {/* ROW 1 — Base unit inclusions */}
                    <div className={s.rowSection} style={{ gridTemplateColumns: gridCols }}>
                        <div className={s.rowLabelCell}>
                            <div className={s.rowLabelPrimary}>Base unit inclusions</div>
                            <div className={s.rowLabelSub}>Modern open layout · Clerestory windows · Shaker cabinets · Quartz countertops · LVP flooring · Appliances · Mini-split HVAC</div>
                        </div>
                        {displayUnits.map((fp, i) => {
                            const sc = getScenario(fp._id);
                            const base = sc?.baseAduPrice ?? fp.price ?? 0;
                            return (
                                <div key={fp._id} className={`${s.rowValCenter} ${s.valBase}`}>
                                    {base ? <AnimDollar n={base} active={active} delay={i * 60} /> : "—"}
                                </div>
                            );
                        })}
                    </div>

                    {/* ROW 2 — Pre-permitting */}
                    <div className={s.rowFlat} style={{ gridTemplateColumns: gridCols }}>
                        <div className={s.rowLabelCell}>
                            <span className={s.rowLabelNormal}>Pre-permitting & construction</span>
                        </div>
                        {displayUnits.map((fp) => (
                            <div key={fp._id} className={`${s.rowValCenter} ${s.valIncluded}`}>Included</div>
                        ))}
                    </div>

                    {/* ROW 3 — Site work */}
                    <div className={s.rowSection} style={{ gridTemplateColumns: gridCols }}>
                        <div className={s.rowLabelCell}>
                            <div className={s.rowLabelPrimary}>* Additional site work</div>
                            {siteWorkIsSame && sharedSiteWorkTags.length > 0 && (
                                <div className={s.tagRow}>
                                    {sharedSiteWorkTags.map((label, i) => (
                                        <span key={i} className="p-tag">{label}</span>
                                    ))}
                                </div>
                            )}
                        </div>
                        {displayUnits.map((fp, i) => {
                            const sc = getScenario(fp._id);
                            const sw = sc?.siteWorkApplied ?? 0;
                            const perUnitTags = !siteWorkIsSame ? (siteWorkTagsByUnitId[fp._id] ?? []) : [];
                            return (
                                <div key={fp._id} className={s.rowValCenter}>
                                    {!siteWorkIsSame && perUnitTags.length > 0 && (
                                        <div className={s.tagRow} style={{ justifyContent: "center", marginBottom: 4 }}>
                                            {perUnitTags.map((label, j) => <span key={j} className="p-tag">{label}</span>)}
                                        </div>
                                    )}
                                    <span className={s.valSiteWork} style={{ color: sw > 0 ? "var(--p-text-primary)" : "var(--p-text-muted)" }}>
                                        {sw > 0 ? <AnimDollar n={sw} active={active} delay={100 + i * 60} /> : <em>None</em>}
                                    </span>
                                </div>
                            );
                        })}
                    </div>

                    {/* ROW 4 — Subtotal */}
                    <div className={s.rowSubtotal} style={{ gridTemplateColumns: gridCols }}>
                        <div className={s.rowLabelCell}>
                            <span className={s.rowLabelSubtotal}>Subtotal</span>
                        </div>
                        {displayUnits.map((fp, i) => {
                            const sc = getScenario(fp._id);
                            const base = sc?.baseAduPrice ?? fp.price ?? 0;
                            const sw = sc?.siteWorkApplied ?? 0;
                            return (
                                <div key={fp._id} className={`${s.rowValCenter} ${s.valSubtotal}`}>
                                    <AnimDollar n={base + sw} active={active} delay={160 + i * 60} />
                                </div>
                            );
                        })}
                    </div>

                    {/* ROW 5+ — Named discount rows */}
                    {useNamedRows && allDiscountLabels.map((label) => (
                        <div key={label} className={s.rowDiscount} style={{ gridTemplateColumns: gridCols }}>
                            <div className={s.rowLabelCell}>
                                <span className={s.rowLabelDiscount}>{label} Discount</span>
                            </div>
                            {displayUnits.map((fp, i) => {
                                const line = (discountLines[fp._id] ?? []).find((d) => d.label === label);
                                return (
                                    <div key={fp._id} className={`${s.rowValCenter} ${s.valDiscount}`}>
                                        {line ? <>−<AnimDollar n={line.amount} active={active} delay={220 + i * 60} /></> : "—"}
                                    </div>
                                );
                            })}
                        </div>
                    ))}

                    {showFallbackDiscount && (
                        <div className={s.rowDiscount} style={{ gridTemplateColumns: gridCols }}>
                            <div className={s.rowLabelCell}><span className={s.rowLabelDiscount}>Discounts applied</span></div>
                            {displayUnits.map((fp, i) => {
                                const sc = getScenario(fp._id);
                                const disc = sc?.discountApplied ?? 0;
                                return (
                                    <div key={fp._id} className={`${s.rowValCenter} ${s.valDiscount}`}>
                                        {disc > 0 ? <>−<AnimDollar n={disc} active={active} delay={220 + i * 60} /></> : "—"}
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* FINAL ROW — Total */}
                    <div className={s.rowTotal} style={{ gridTemplateColumns: gridCols }}>
                        <div className={s.rowLabelCell}>
                            <span className={s.rowLabelTotal}>Total</span>
                        </div>
                        {displayUnits.map((fp, i) => {
                            const sc = getScenario(fp._id);
                            const total = sc?.finalAduPrice ?? sc?.purchasePrice ?? 0;
                            return (
                                <div key={fp._id} className={`${s.rowValCenter} ${s.valTotal}`}>
                                    {total ? <AnimDollar n={total} active={active} delay={280 + i * 60} /> : "—"}
                                </div>
                            );
                        })}
                    </div>

                    {/* Footer */}
                    <div className={s.tableFooter}>
                        <span className={s.tableFooterText}>
                            *Offer valid 15 days · $10,000 water meter allowance if required · We build for you.
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}
