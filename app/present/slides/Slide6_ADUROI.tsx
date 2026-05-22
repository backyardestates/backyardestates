"use client";

import React from "react";
import { usePresentationStore } from "@/lib/store/presentationStore";
import s from "./Slide6.module.css";
import { ProposalFooter } from "./_shared/ProposalFooter";

function fmt$(n: number) {
    return n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}

function fmtPct(n: number) {
    return `${(n * 100).toFixed(1)}%`;
}

function fmtSignedMoney(n: number) {
    if (!n) return "$0";
    return n > 0 ? `+${fmt$(n)}` : `−${fmt$(Math.abs(n))}`;
}

export function Slide6_ADUROI() {
    const { scenarios, comparedUnitIds, floorplans } = usePresentationStore();

    const aduScenarios = scenarios.filter((sc) => sc.kind === "adu");
    const compared = comparedUnitIds.length > 0
        ? aduScenarios.filter((sc) => comparedUnitIds.includes(sc.key.replace(/^adu_/, "")))
        : aduScenarios;
    const displayScenarios = compared.length > 0 ? compared : aduScenarios;

    function getFpName(key: string) {
        const id = key.replace(/^adu_/, "");
        const fp = floorplans.find((f) => f._id === id);
        return fp?.name ?? id;
    }

    return (
        <div className={s.slide}>
            <div className={s.banner}>
                <h1 className={s.bannerTitle}>ADU ROI</h1>
                <span className={s.bannerSubtitle}>ADU Agreement</span>
            </div>

            <div className={s.body}>
                <div className={s.roiGrid} style={{ gridTemplateColumns: `repeat(${Math.max(1, displayScenarios.length)}, 1fr)` }}>
                    {displayScenarios.length > 0 ? displayScenarios.map((sc) => (
                        <div key={sc.key} className={s.roiCol}>
                            <div className={s.planHeader}>
                                <span className={s.planEyebrow}>The Plan</span>
                                <span className={s.planName}>{getFpName(sc.key)}</span>
                            </div>

                            <div className={s.section}>
                                <div className={s.kvRow}>
                                    <span className={s.k}>Financed Amount:</span>
                                    <span className={s.v}>100%</span>
                                </div>
                                <div className={s.kvRow}>
                                    <span className={s.k}>Cash out-of-pocket:</span>
                                    <span className={s.v}>$0</span>
                                </div>
                            </div>

                            <div className={s.section}>
                                <div className={s.kvRow}>
                                    <span className={s.k}>Equity Boost:</span>
                                </div>
                                <div className={s.kvRow}>
                                    <span className={s.kIndent}>Year 1:</span>
                                    <span className={s.v}>{sc.year1EquityBoost ? fmt$(sc.year1EquityBoost) : "—"}</span>
                                </div>
                                <div className={s.kvRow}>
                                    <span className={s.kIndent}>Year 5:</span>
                                    <span className={s.v}>{sc.year5EquityBoost ? fmt$(sc.year5EquityBoost) : "—"}</span>
                                </div>
                                <div className={s.kvRow}>
                                    <span className={s.kIndent}>Year 10:</span>
                                    <span className={s.v}>{sc.year10EquityBoost ? fmt$(sc.year10EquityBoost) : "—"}</span>
                                </div>
                                <span className={s.sectionNote}>(Income and square footage approach)</span>
                            </div>

                            <div className={s.section}>
                                <div className={s.kvRow}>
                                    <span className={s.k}>Estimated Rent:</span>
                                    <span className={s.v}>{sc.rentMonthly ? `${fmt$(sc.rentMonthly)}/mo` : "—"}</span>
                                </div>
                                <div className={s.kvRow}>
                                    <span className={s.k}>Estimated Payment:</span>
                                    <span className={s.v}>{sc.mtgPaymentMonthly ? `${fmt$(sc.mtgPaymentMonthly)}/mo` : "—"}</span>
                                </div>
                                <span className={s.sectionNote}>(6.5% 30 Yr Term)</span>
                                <div className={s.kvRow}>
                                    <span className={s.k}>Cash flow:</span>
                                    <span className={`${s.v} ${(sc.cashflowMonthly ?? 0) >= 0 ? s.posVal : s.negVal}`}>
                                        {sc.cashflowMonthly != null ? `${fmtSignedMoney(sc.cashflowMonthly)}/mo` : "—"}
                                    </span>
                                </div>
                            </div>

                            <div className={`${s.section} ${s.sectionFinal}`}>
                                <div className={s.kvRow}>
                                    <span className={s.k}>Return on investment:</span>
                                    <span className={s.v}>{sc.roi != null ? fmtPct(sc.roi) : "—"}</span>
                                </div>
                                <div className={s.kvRow}>
                                    <span className={s.k}>Return on Cash:</span>
                                    <span className={`${s.v} ${s.infinite}`}>Infinite</span>
                                </div>
                            </div>
                        </div>
                    )) : (
                        <div className={s.empty}>Scenario data will appear once admin runs the model.</div>
                    )}
                </div>
            </div>

            <ProposalFooter
                pageNum={6}
                pageTotal={9}
                disclaimer="Backyard Estates does not guarantee rental income or long-term property value. The homeowner is responsible for their own analysis."
            />
        </div>
    );
}
