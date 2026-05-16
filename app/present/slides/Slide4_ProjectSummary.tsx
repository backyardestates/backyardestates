"use client";

import React from "react";
import { usePresentationStore } from "@/lib/store/presentationStore";
import s from "./Slide4.module.css";
import { ProposalFooter } from "./_shared/ProposalFooter";

function fmt$(n: number) {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
}

const BASE_UNIT_DESC =
    "Modern open layout, clerestory windows, shaker-style cabinets, quartz countertops, LVP flooring, stainless appliances, mini-split HVAC.";

const PERMIT_DESC =
    "Architectural design, structural & Title 24, permits, rough grading, MEPs, framing, insulation, drywall, stucco, finish carpentry, debris removal.";

const SITE_WORK_DESC_FALLBACK =
    "ADU attach, sewer scope, concrete cut and exposure, additional trenching, fire-rated walls, demolition, drainage, and exterior trim.";

export function Slide4_ProjectSummary() {
    const {
        scenarios,
        comparedUnitIds,
        floorplans,
        discountLinesByUnitId,
        siteWorkByUnitId,
    } = usePresentationStore();

    const units = floorplans.filter((fp) => comparedUnitIds.includes(fp._id));
    const displayUnits = units.length > 0 ? units : floorplans.slice(0, 2);

    function getScenario(unitId: string) {
        return scenarios.find((sc) => sc.kind === "adu" && sc.key === `adu_${unitId}`);
    }

    const planCount = Math.max(1, displayUnits.length);
    const allDiscountLabels = Array.from(new Set(
        displayUnits.flatMap((fp) => (discountLinesByUnitId[fp._id] ?? []).map((d) => d.label))
    ));

    const firstSiteWork = displayUnits[0] ? siteWorkByUnitId[displayUnits[0]._id] ?? [] : [];
    const siteWorkDesc = firstSiteWork.length > 0
        ? firstSiteWork.map((l) => l.label).join(", ")
        : SITE_WORK_DESC_FALLBACK;

    return (
        <div className={s.slide}>
            <div className={s.banner}>
                <h1 className={s.bannerTitle}>Project Summary</h1>
            </div>

            <div className={s.body}>
                <table className={s.table}>
                    <thead>
                        <tr>
                            <th className={s.thBreak} colSpan={planCount + 1}>Break Down</th>
                        </tr>
                        <tr>
                            <th className={s.thItem}>Item</th>
                            {displayUnits.map((fp) => (
                                <th key={fp._id} className={s.thPlan}>
                                    <span className={s.thPlanName}>{fp.name}</span>
                                    {fp.sqft && <span className={s.thPlanSqft}>{fp.sqft.toLocaleString()} sqft</span>}
                                </th>
                            ))}
                            {displayUnits.length === 0 && <th className={s.thPlan}>Plan</th>}
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td className={s.tdItem}>
                                <span className={s.itemName}>Base Unit Inclusions</span>
                                <span className={s.itemDesc}>{BASE_UNIT_DESC}</span>
                            </td>
                            {displayUnits.map((fp) => {
                                const sc = getScenario(fp._id);
                                const base = sc?.baseAduPrice ?? fp.price ?? 0;
                                return <td key={fp._id} className={s.tdValue}>{base ? fmt$(base) : "—"}</td>;
                            })}
                        </tr>

                        <tr>
                            <td className={s.tdItem}>
                                <span className={s.itemName}>Pre-Permitting and Construction</span>
                                <span className={s.itemDesc}>{PERMIT_DESC}</span>
                            </td>
                            {displayUnits.map((fp) => (
                                <td key={fp._id} className={`${s.tdValue} ${s.included}`}>Included</td>
                            ))}
                        </tr>

                        <tr>
                            <td className={s.tdItem}>
                                <span className={s.itemName}>*Additional Site Work</span>
                                <span className={s.itemDesc}>{siteWorkDesc}</span>
                            </td>
                            {displayUnits.map((fp) => {
                                const sc = getScenario(fp._id);
                                const sw = sc?.siteWorkApplied ?? 0;
                                return <td key={fp._id} className={s.tdValue}>{sw ? fmt$(sw) : "—"}</td>;
                            })}
                        </tr>

                        <tr className={s.rowSubtotal}>
                            <td className={s.tdItem}>
                                <span className={s.itemName}>Subtotal</span>
                            </td>
                            {displayUnits.map((fp) => {
                                const sc = getScenario(fp._id);
                                const subtotal = (sc?.baseAduPrice ?? 0) + (sc?.siteWorkApplied ?? 0);
                                return <td key={fp._id} className={s.tdValue}>{subtotal ? fmt$(subtotal) : "—"}</td>;
                            })}
                        </tr>

                        {allDiscountLabels.map((label) => (
                            <tr key={label}>
                                <td className={s.tdItem}>
                                    <span className={s.itemName}>{label}</span>
                                </td>
                                {displayUnits.map((fp) => {
                                    const line = (discountLinesByUnitId[fp._id] ?? []).find((d) => d.label === label);
                                    return (
                                        <td key={fp._id} className={`${s.tdValue} ${s.discount}`}>
                                            {line ? `(${fmt$(line.amount)})` : "—"}
                                        </td>
                                    );
                                })}
                            </tr>
                        ))}

                        <tr className={s.rowTotal}>
                            <td className={s.tdItem}>
                                <span className={s.itemName}>Total</span>
                            </td>
                            {displayUnits.map((fp) => {
                                const sc = getScenario(fp._id);
                                const total = sc?.finalAduPrice ?? sc?.purchasePrice ?? 0;
                                return <td key={fp._id} className={s.tdValue}>{total ? fmt$(total) : "—"}</td>;
                            })}
                        </tr>
                    </tbody>
                </table>

                <p className={s.disclaimer}>*This offer is good for 15 days</p>
            </div>

            <ProposalFooter pageNum={4} pageTotal={9} />
        </div>
    );
}
