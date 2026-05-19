"use client";

import React from "react";
import { usePresentationStore } from "@/lib/store/presentationStore";
import s from "./Slide8.module.css";

function fmt$(n: number) {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
}

function fmtSignedDollar(n: number) {
    if (n === 0) return "$0";
    const sign = n > 0 ? "+" : "−";
    return `${sign}${fmt$(Math.abs(n))}`;
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

function Section({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div className={s.section}>
            <div className={s.sectionTitle}>{title}</div>
            <div className={s.sectionRows}>{children}</div>
        </div>
    );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
    return (
        <div className={s.row}>
            <span className={s.rowLabel}>{label}</span>
            <span className={s.rowValue}>{value}</span>
        </div>
    );
}

export function Slide8_ROIComparison() {
    const { scenarios, comparedUnitIds, floorplans, customerName, propertyAddress } = usePresentationStore();

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
    const lastName = lastNameFromFull(customerName);
    const city = propertyAddress ? cityFromAddress(propertyAddress) : "—";

    if (displayAdus.length === 0) {
        return (
            <div className={s.slide}>
                <div className="running-header rh-light">
                    <span className="running-header-left">{lastName} · {city}</span>
                    <span className="running-header-center">Your Return</span>
                    <span className="running-header-right">
                        <span className="running-header-num">08</span> / 14
                    </span>
                </div>
                <div className={s.placeholder}>Waiting for scenario data…</div>
            </div>
        );
    }

    return (
        <div className={s.slide}>
            {/* Running header */}
            <div className="running-header rh-light">
                <span className="running-header-left">{lastName} · {city}</span>
                <span className="running-header-center">Your Return</span>
                <span className="running-header-right">
                    <span className="running-header-num">08</span> / 14
                </span>
            </div>

            {/* Headline */}
            <div className={s.headRow}>
                <div className={s.headLeft}>
                    <h2 className="section-title">
                        Your <em>return.</em>
                    </h2>
                    <span className={s.headSubhead}>Every number, plainly on the table.</span>
                </div>
            </div>

            {/* Cards grid */}
            <div
                className={s.body}
                style={{ gridTemplateColumns: `repeat(${displayAdus.length}, 1fr)` }}
            >
                {displayAdus.map((sc) => {
                    const cf = sc.cashflowMonthly ?? 0;
                    const roiPct = (sc.roi ?? 0) * 100;
                    const fpName = getFpName(sc.key);
                    const lastSpace = fpName.lastIndexOf(" ");
                    const titlePrefix = lastSpace > 0 ? fpName.slice(0, lastSpace) : "";
                    const titleAccent = lastSpace > 0 ? fpName.slice(lastSpace + 1) : fpName;

                    return (
                        <div key={sc.key} className={s.card}>
                            <div className={s.cardTitle}>
                                The {titlePrefix && <>{titlePrefix} </>}
                                <span className={s.cardTitleNum}>{titleAccent}</span>
                            </div>

                            <Section title="Investment">
                                <Row label="Out of Pocket" value="$0" />
                                <Row label="Financed" value="100%" />
                                <Row label="Interest Rate" value="6.5%" />
                                <Row label="Term" value="30 years" />
                            </Section>

                            <Section title="Monthly">
                                <Row label="Estimated Rent" value={`${fmt$(sc.rentMonthly ?? 0)} / mo`} />
                                <Row label="Loan Payment" value={`${fmt$(sc.monthlyCost)} / mo`} />
                                <Row label="Net Cashflow" value={`${fmtSignedDollar(cf)} / mo`} />
                            </Section>

                            <Section title="Annual Return">
                                <Row label="ROI" value={`${roiPct.toFixed(1)}%`} />
                            </Section>

                            <Section title="Equity Built">
                                <Row label="After Year 1"  value={fmt$(sc.year1EquityBoost ?? 0)} />
                                <Row label="After Year 5"  value={fmt$(sc.year5EquityBoost ?? 0)} />
                                <Row label="After Year 10" value={fmt$(sc.year10EquityBoost ?? 0)} />
                            </Section>
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
