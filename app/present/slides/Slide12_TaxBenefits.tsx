"use client";

import React from "react";
import { usePresentationStore } from "@/lib/store/presentationStore";
import { IconCoin, IconBank, IconTrendUp } from "./_shared/SvgIcons";
import s from "./Slide12.module.css";

const WRITE_OFFS = [
    "Mortgage interest",
    "Property taxes",
    "Depreciation",
    "Repairs & maintenance",
    "Insurance premiums",
    "Management fees",
    "Advertising",
    "Utilities (rental %)",
    "HOA fees (rental %)",
    "Professional services",
    "Travel for property",
];

const BENEFITS = [
    {
        Icon: IconCoin,
        title: "Depreciation deduction",
        desc: "Deduct the ADU's structure value over 27.5 years — straight-line, automatic.",
        stat: "$5K–$15K",
        statSub: "per year",
    },
    {
        Icon: IconBank,
        title: "Expense deductions",
        desc: "Mortgage interest, property taxes, repairs, insurance — all potentially deductible.",
        stat: "100%",
        statSub: "deductible",
    },
    {
        Icon: IconTrendUp,
        title: "Long-term equity",
        desc: "An ADU can add $50K–$200K to your home's appraised value over time.",
        stat: "$50K–$200K",
        statSub: "appraisal lift",
    },
];

function lastNameFromFull(full?: string) {
    if (!full) return "";
    const parts = full.trim().split(/\s+/);
    return parts[parts.length - 1] ?? "";
}

function cityFromAddress(addr: string) {
    const parts = addr.split(",");
    return parts.length >= 2 ? parts[parts.length - 2].trim() : addr;
}

export function Slide12_TaxBenefits() {
    const { customerName, propertyAddress } = usePresentationStore();
    const lastName = lastNameFromFull(customerName);
    const city = propertyAddress ? cityFromAddress(propertyAddress) : "—";

    return (
        <div className={s.slide}>
            {/* Running header */}
            <div className="running-header rh-dark">
                <span className="running-header-left">{lastName} · {city}</span>
                <span className="running-header-center">Income Benefits</span>
                <span className="running-header-right">
                    <span className="running-header-num">12</span> / 11
                </span>
            </div>

            {/* Headline */}
            <div className={s.headRow}>
                <div className={s.headLeft}>
                    <h2 className="section-title on-dark">
                        Other <em>income benefits.</em>
                    </h2>
                    <span className={s.headSubhead}>Beyond cashflow — what the IRS lets you keep</span>
                </div>
                <span className={s.headChip}>Consult your CPA</span>
            </div>

            {/* Body */}
            <div className={s.body}>
                {/* LEFT */}
                <div className={s.leftCol}>
                    <span className={s.leftEyebrow}>Common Write-Offs</span>
                    <h3 className={s.leftTitle}>
                        What rental owners <em>deduct</em>
                    </h3>
                    <div className={s.pillCloud}>
                        {WRITE_OFFS.map((label) => (
                            <span key={label} className={s.writeOff}>{label}</span>
                        ))}
                    </div>
                </div>

                {/* RIGHT */}
                <div className={s.rightCol}>
                    {BENEFITS.map((b) => (
                        <div key={b.title} className={s.benefitBlock}>
                            <div className={s.benefitIcon}>
                                <b.Icon />
                            </div>
                            <div className={s.benefitContent}>
                                <span className={s.benefitEyebrow}>The Benefit</span>
                                <div className={s.benefitTitle}>{b.title}</div>
                                <div className={s.benefitDesc}>{b.desc}</div>
                            </div>
                            <div className={s.benefitNumeric}>
                                <span className={s.benefitStat}>{b.stat}</span>
                                <span className={s.benefitStatSub}>{b.statSub}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Footer */}
            <div className={s.footer}>
                <span className={s.disclaimer}>
                    Tax treatment varies by individual situation. Always consult a licensed CPA or tax attorney.
                </span>
                <span className={s.tagline}>We build for you.</span>
            </div>
        </div>
    );
}
