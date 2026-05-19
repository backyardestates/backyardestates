"use client";

import React from "react";
import { usePresentationStore } from "@/lib/store/presentationStore";
import s from "./Slide12.module.css";

const WRITE_OFFS = [
    { name: "Mortgage Interest",     note: "Interest on financing tied to the ADU." },
    { name: "Property Taxes",        note: "Annual tax on the new construction's assessed value." },
    { name: "Depreciation",          note: "Spread the building's cost across its useful life." },
    { name: "Repairs & Maintenance", note: "Ongoing fixes to keep the rental in shape." },
    { name: "Insurance Premiums",    note: "Hazard, liability, and rental coverage." },
    { name: "Management Fees",       note: "Property manager and leasing service costs." },
    { name: "Advertising",           note: "Listing fees and marketing the rental." },
    { name: "Utilities (rental %)",  note: "The tenant-attributable share of shared utilities." },
    { name: "HOA Fees (rental %)",   note: "The rental-attributable share of HOA dues." },
    { name: "Professional Services", note: "CPA, attorney, and bookkeeping fees." },
    { name: "Travel for Property",   note: "Mileage and trips for rental management." },
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
                <span className="running-header-center">Tax Topics</span>
                <span className="running-header-right">
                    <span className="running-header-num">12</span> / 13
                </span>
            </div>

            {/* Headline */}
            <div className={s.headRow}>
                <div className={s.headLeft}>
                    <span className={s.headEyebrow}>Worth raising</span>
                    <h2 className={s.headTitle}>
                        Bring these to <em>your CPA.</em>
                    </h2>
                    <span className={s.headSubhead}>
                        Items worth verifying with your tax advisor — not tax advice from us.
                    </span>
                </div>
                <span className={s.headChip}>Recommendations · not tax advice</span>
            </div>

            {/* Write-off grid */}
            <div className={s.grid}>
                {WRITE_OFFS.map((item) => (
                    <div key={item.name} className={s.card}>
                        <p className={s.cardName}>{item.name}</p>
                        <p className={s.cardNote}>{item.note}</p>
                    </div>
                ))}

                {/* 12th slot — closing CPA reminder, visually distinct */}
                <div className={`${s.card} ${s.cardClose}`}>
                    <p className={s.cardName}>Bring this list to your CPA.</p>
                    <p className={s.cardNote}>Tax treatment varies — confirm what applies to your situation.</p>
                </div>
            </div>

            {/* Footer */}
            <div className={s.footer}>
                <span className={s.disclaimer}>
                    Tax treatment varies by individual situation. Always consult a licensed CPA or tax attorney
                    before relying on any of the items above.
                </span>
                <span className={s.tagline}>We build for you.</span>
            </div>
        </div>
    );
}
