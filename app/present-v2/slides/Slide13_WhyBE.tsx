"use client";

import React, { useEffect, useState } from "react";
import { usePresentationStore } from "@/lib/store/presentationStore";
import { IconCheck, IconX, IconPlay } from "./_shared/SvgIcons";
import s from "./Slide13.module.css";

const FIXED_PRICE_ITEMS = [
    { title: "Fixed-price contract", desc: "No change orders, no surprise invoices." },
    { title: "All city fees included", desc: "Plan check, permits, school fees — in your price." },
    { title: "One team, start to finish", desc: "No subcontractor chaos. One PM, one relationship." },
    { title: "Milestone-based payments", desc: "You pay only when work is complete." },
];

const RISK_ITEMS = [
    "Change orders added mid-build when you can't back out",
    "City fees billed separately after permit pulls",
    "Subcontractor delays with no accountability",
];

const CONFIDENCE_STATS = [
    { val: "100+", label: "ADUs completed" },
    { val: "25", label: "days · plans" },
    { val: "130", label: "days · permitting" },
    { val: "40", label: "days · construction" },
    { val: "9–12mo", label: "what others take" },
    { val: "$0", label: "out of pocket" },
];

const WISTIA_ID = "gfcg94xvcy";

function lastNameFromFull(full?: string) {
    if (!full) return "";
    const parts = full.trim().split(/\s+/);
    return parts[parts.length - 1] ?? "";
}

function cityFromAddress(addr: string) {
    const parts = addr.split(",");
    return parts.length >= 2 ? parts[parts.length - 2].trim() : addr;
}

export function Slide13_WhyBE() {
    const { customerName, propertyAddress } = usePresentationStore();
    const [overlayId, setOverlayId] = useState<string | null>(null);

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOverlayId(null); };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, []);

    const lastName = lastNameFromFull(customerName);
    const city = propertyAddress ? cityFromAddress(propertyAddress) : "—";

    return (
        <div className={s.slide}>
            {/* Running header */}
            <div className="running-header rh-dark">
                <span className="running-header-left">{lastName} · {city}</span>
                <span className="running-header-center">Why Backyard Estates</span>
                <span className="running-header-right">
                    <span className="running-header-num">15</span>
                </span>
            </div>

            {/* Headline */}
            <div className={s.headRow}>
                <div className={s.headLeft}>
                    <h2 className="section-title on-dark">
                        Why <em>Backyard Estates.</em>
                    </h2>
                    <span className={s.headSubhead}>One price. No surprises. We've never had a customer not move in.</span>
                </div>
            </div>

            {/* Body — 3 columns */}
            <div className={s.body}>
                {/* LEFT */}
                <div className={s.leftCol}>
                    <span className={s.leftEyebrow}>One Price. No Surprises.</span>
                    <h3 className={s.leftHeadline}>
                        The price you see today<br />
                        is the price you pay <em>at the end.</em>
                    </h3>
                    <div className={s.fixedItems}>
                        {FIXED_PRICE_ITEMS.map((item) => (
                            <div key={item.title} className={s.fixedItem}>
                                <div className={s.fixedCheck}><IconCheck /></div>
                                <div className={s.fixedContent}>
                                    <div className={s.fixedTitle}>{item.title}</div>
                                    <div className={s.fixedDesc}>{item.desc}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* CENTER */}
                <div className={s.centerCol}>
                    <div className={s.riskCard}>
                        <span className={s.riskEyebrow}>Average Delay With Others</span>
                        <div className={s.riskStat}>9–12</div>
                        <span className={s.riskSub}>months longer with other builders</span>
                    </div>

                    <div className={s.riskItems}>
                        {RISK_ITEMS.map((item, i) => (
                            <div key={i} className={s.riskItem}>
                                <span className={s.riskX}><IconX /></span>
                                <span className={s.riskText}>{item}</span>
                            </div>
                        ))}
                    </div>

                    <div className={s.commitCard}>
                        <div className={s.commitTitle}>Our Honest Commitment</div>
                        <div className={s.commitText}>
                            We've never had a customer not move in. We tell you what our process looks like — and we follow it.
                        </div>
                    </div>
                </div>

                {/* RIGHT */}
                <div className={s.rightCol}>
                    <span className={s.rightEyebrow}>From a customer who learned the hard way</span>
                    <div className={s.quoteWrap}>
                        <span className={s.qmark}>&ldquo;</span>
                        <div className={s.quoteText}>
                            We went <strong>nine months</strong> without breaking ground with the first builder. With Backyard Estates it was <strong>five months and $10,000 less</strong>. I haven't doubted their character ever.
                        </div>
                    </div>
                    <div className={s.quoteSource}>
                        <div className={s.portrait}>
                            <span className={s.portraitInitials}>PS</span>
                        </div>
                        <div className={s.sourceContent}>
                            <div className={s.sourceName}>Paul Shouse</div>
                            <div className={s.sourceDetail}>Corona · CA</div>
                        </div>
                    </div>
                    <div
                        className={s.videoCard}
                        onClick={() => setOverlayId(WISTIA_ID)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => { if (e.key === "Enter") setOverlayId(WISTIA_ID); }}
                    >
                        <div className={s.videoIcon}><IconPlay /></div>
                        <span className={s.videoLabel}>Watch his story</span>
                    </div>
                </div>
            </div>

            {/* Stat bar */}
            <div className={s.statBar}>
                {CONFIDENCE_STATS.map((stat) => (
                    <div key={stat.val + stat.label} className={s.statItem}>
                        <div className={s.statVal}>{stat.val}</div>
                        <div className={s.statLabel}>{stat.label}</div>
                    </div>
                ))}
            </div>

            <span className={s.tagline}>We build for you.</span>

            {/* Wistia overlay */}
            {overlayId && (
                <div className={s.overlay} onClick={() => setOverlayId(null)}>
                    <div className={s.overlayInner} onClick={(e) => e.stopPropagation()}>
                        <iframe
                            src={`https://fast.wistia.net/embed/iframe/${overlayId}?autoPlay=1`}
                            allowFullScreen
                            className={s.overlayIframe}
                        />
                        <button className={s.overlayClose} onClick={() => setOverlayId(null)}>✕</button>
                    </div>
                </div>
            )}
        </div>
    );
}
