"use client";

import React from "react";
import { usePresentationStore } from "@/lib/store/presentationStore";
import {
    IconBolt, IconSnowflake, IconDroplet, IconFrame, IconClipboard, IconUsers,
} from "./_shared/SvgIcons";
import s from "./Slide4.module.css";

/* ── Zone 1 data ── */
const FINISHES = [
    {
        cat: "Kitchen",
        items: [
            { text: "Wood shaker cabinets — soft-close · pantry · lazy susan" },
            { text: "Quartz countertops — 4\" backsplash · mitered edge" },
            { text: "30\" fridge, range, dishwasher, microwave — stainless" },
            { text: "Pulldown faucet · LED recessed lighting", brand: "Delta® Antony" },
        ],
    },
    {
        cat: "Bathrooms",
        items: [
            { text: "Quartz vanity — undermount sink · soft-close doors" },
            { text: "Faucet · mirror · towel bar · accessories", brand: "Delta® Portwood" },
            { text: "Quiet-series exhaust · subway tiled shower", brand: "Nutone®" },
        ],
    },
    {
        cat: "Interior",
        items: [
            { text: "LVP flooring throughout · vaulted ceilings 8'–10'" },
            { text: "Mirrored wardrobe doors · shaker passage doors" },
            { text: "Two-tone interior", brand: "Dunn Edwards SuperPaint®" },
        ],
    },
    {
        cat: "Exterior",
        items: [
            { text: "Stucco 16/20 · 30-yr asphalt shingles · Low-E windows" },
            { text: "Fiberglass entry door", brand: "Masonite®" },
            { text: "Dawn-to-dusk light · GFCI outlets · EV charger prep" },
        ],
    },
];

/* ── Zone 2 data ── */
const SPECS: {
    Icon: typeof IconBolt;
    title: string;
    sub: string;
    desc: React.ReactNode;
}[] = [
    {
        Icon: IconBolt,
        title: "Electrical",
        sub: "fully upgraded",
        desc: <>200A panel + 225 busbar · 100A ADU sub panel · <span className={s.hi}>Decora® dimmers</span> · CAT 6 + coax · EV prep</>,
    },
    {
        Icon: IconSnowflake,
        title: "HVAC",
        sub: "mini-split system",
        desc: <>Flush-mounted cassettes · <span className={s.hi}>one head per bedroom</span> · single condenser · heat + cool</>,
    },
    {
        Icon: IconDroplet,
        title: "Water heater",
        sub: "heat pump",
        desc: <><span className={s.hi}>50-gal high-efficiency</span> (3.24 EF) · PEX lines · shutoff at every fixture</>,
    },
    {
        Icon: IconFrame,
        title: "Structure + insulation",
        sub: "",
        desc: <>2×4 stick-frame · slab-on-grade · 5/8" fire-rated · <span className={s.br}>R15 walls + R30 roof</span> · Title 24</>,
    },
    {
        Icon: IconClipboard,
        title: "Online project portal",
        sub: "24/7",
        desc: <>Plan set · city approvals · jobsite photos · payments · <span className={s.hi}>weekly updates</span></>,
    },
    {
        Icon: IconUsers,
        title: "Dedicated team",
        sub: "start to finish",
        desc: <>Design · engineer · PM · superintendent · <span className={s.hi}>one relationship</span></>,
    },
];

/* ── Zone 3 data ── */
const PLANS_PILLS = [
    "Custom floor plan", "Site plan + elevations",
    "T24 + structural", "Design selections", "Door + window schedules",
];
const DEPT_PILLS = [
    "Planning", "Building", "Engineering",
    "Public Works", "Waste", "City / County Fire",
    "Recorder", "Water", "Electric Provider",
    "School Districts", "CA ADU Law",
];
const FEE_BULLETS = [
    "Address + plan check + building fees — admin, inspection, sub panel, fire",
    "School fees · notarization · permit pull · plan checker follow-up",
    "Corrections review · state compliance · dedicated PM + superintendent",
];

/* ── Stat bar ── */
const STATS = [
    { val: "Delta®", label: "fixtures" },
    { val: "200A", label: "panel upgrade" },
    { val: "R15/R30", label: "insulation" },
    { val: "50-gal", label: "heat pump" },
    { val: "11", label: "city depts" },
    { val: "Solar", label: "2+ bed detached" },
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

export function Slide4_WhatsIncluded() {
    const { customerName, propertyAddress } = usePresentationStore();
    const lastName = lastNameFromFull(customerName);
    const city = propertyAddress ? cityFromAddress(propertyAddress) : "—";

    return (
        <div className={s.slide}>
            {/* Running header */}
            <div className="running-header rh-light">
                <span className="running-header-left">{lastName} · {city}</span>
                <span className="running-header-center">What's Included</span>
                <span className="running-header-right">
                    <span className="running-header-num">04</span> / 10
                </span>
            </div>

            {/* Headline */}
            <div className={s.headRow}>
                <div className={s.headLeft}>
                    <h2 className="section-title">
                        One price. <em>Fully turnkey.</em>
                    </h2>
                    <span className={s.headSubhead}>Premium finishes · engineered specs · complete city coordination</span>
                </div>
                <span className={s.headBadge}>Standard, not Extra</span>
            </div>

            {/* Body: 3 zones */}
            <div className={s.body}>
                {/* ── ZONE 1: Finishes ── */}
                <div className={s.zone}>
                    <div className={s.zoneHead}>
                        <div className={s.zoneEyebrow}>What you'll see every day</div>
                        <div className={s.zoneTitle}>Premium <em>finishes</em></div>
                        <div className={s.zoneTagline}>Brand-name fixtures, not builder-grade</div>
                    </div>
                    <div className={s.zoneBody}>
                        {FINISHES.map((cat) => (
                            <div key={cat.cat} className={s.finCat}>
                                <div className={s.catNameRow}>
                                    <span className={s.catName}>{cat.cat}</span>
                                </div>
                                {cat.items.map((item, i) => (
                                    <div key={i} className={s.finItem}>
                                        {item.brand && (
                                            <span className={s.brandTag}>{item.brand}</span>
                                        )}
                                        <span className={s.finItemText}>{item.text}</span>
                                    </div>
                                ))}
                            </div>
                        ))}
                    </div>
                </div>

                {/* ── ZONE 2: Engineered specs ── */}
                <div className={s.zone}>
                    <div className={s.zoneHead}>
                        <div className={s.zoneEyebrow}>What's behind the walls</div>
                        <div className={s.zoneTitle}>Engineered <em>specs</em></div>
                        <div className={s.zoneTagline}>Where quality separates from cheaper bids</div>
                    </div>
                    <div className={s.zoneBody}>
                        {SPECS.map(({ Icon, title, sub, desc }) => (
                            <div key={title} className={s.specRow}>
                                <div className={s.specIcon}><Icon /></div>
                                <div className={s.specContent}>
                                    <div className={s.specTitle}>
                                        {title}{sub ? <span className={s.specSub}>— {sub}</span> : null}
                                    </div>
                                    <div className={s.specDesc}>{desc}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* ── ZONE 3: Departments ── */}
                <div className={`${s.zone} ${s.zoneDark}`}>
                    <div className={s.zoneHead}>
                        <div className={s.zoneEyebrow}>The part no one else talks about</div>
                        <div className={s.zoneTitle}>11 <em>departments</em></div>
                        <div className={s.zoneTagline}>We coordinate every entity your permit requires</div>
                    </div>
                    <div className={s.zoneBody}>
                        <div className={s.deptSection}>
                            <span className={s.deptLabel}>Plans · 4–6 weeks</span>
                            <div className={s.pillWrap}>
                                {PLANS_PILLS.map((p) => (
                                    <span key={p} className={s.deptPill}>{p}</span>
                                ))}
                            </div>
                        </div>
                        <div className={s.zoneSeparator} />
                        <div className={s.deptSection}>
                            <span className={s.deptLabel}>City departments</span>
                            <div className={s.pillWrap}>
                                {DEPT_PILLS.map((p) => (
                                    <span key={p} className={s.deptPill}>{p}</span>
                                ))}
                            </div>
                        </div>
                        <div className={s.zoneSeparator} />
                        <div className={s.deptSection}>
                            <span className={s.deptLabel}>City fees · all included</span>
                            {FEE_BULLETS.map((bullet, i) => (
                                <div key={i} className={s.feeBullet}>
                                    <span className={s.feeDot} />
                                    <span className={s.feeText}>{bullet}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className={s.zone3Footer}>
                        <span className={s.zone3FooterLeft}>You talk to us. We talk to everyone else.</span>
                        <span className={s.zone3Stat}>
                            <strong>11</strong> depts · <strong>1</strong> team · <strong>0</strong> calls
                        </span>
                    </div>
                </div>
            </div>

            {/* Stat bar */}
            <div className={s.statBar}>
                {STATS.map((item) => (
                    <div key={item.val} className={s.statItem}>
                        <span className={s.statVal}>{item.val}</span>
                        <span className={s.statLabel}>{item.label}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}
