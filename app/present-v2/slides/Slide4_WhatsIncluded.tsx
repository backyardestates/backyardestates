"use client";

import React from "react";
import s from "./Slide4.module.css";

/* ── Inclusions: 6 categories mirroring the proposal PDF ── */
type IncRow = { label: string; text: string };
type IncCategory = { name: string; rows: IncRow[] };

const INCLUSIONS: IncCategory[] = [
    {
        name: "Kitchen",
        rows: [
            { label: "Cabinets", text: "Wood shaker, soft-close · pantry · lazy susan · spice + trash roll-outs" },
            { label: "Countertops", text: "Quartz · 4\" backsplash · mitered edge" },
            { label: "Appliances", text: "30\" fridge · range · dishwasher · over-range microwave (stainless)" },
            { label: "Sink + Faucet", text: "Undermount stainless · garbage disposal · Delta® Antony pulldown" },
            { label: "Lighting", text: "4\" LED recessed (4–8 per plan)" },
        ],
    },
    {
        name: "Bathroom",
        rows: [
            { label: "Shower", text: "60\" fiberglass pan or tub · subway-tile walls · Delta® Portwood" },
            { label: "Vanity", text: "30\" wood, soft-close · undermount sink · quartz top" },
            { label: "Toilet", text: "Elongated low-flow, water-saving" },
            { label: "Accessories", text: "Mirror · towel bar · ring · paper holder · widespread faucet" },
            { label: "Lighting", text: "3-light vanity · 2 recessed · Nutone® quiet exhaust" },
        ],
    },
    {
        name: "Interior",
        rows: [
            { label: "Ceilings", text: "Vaulted 8'–10' in great room · 8' in bedrooms" },
            { label: "Floors + Doors", text: "LVP throughout · shaker 6'8\" passage doors w/ lever sets" },
            { label: "Paint + Trim", text: "Dunn Edwards SuperPaint® · 1×2.5\" casing · 1×4\" base" },
            { label: "Electrical", text: "Decora® dimmers · outlets every 12' · prewired data hub" },
            { label: "Closets", text: "Mirrored wardrobe doors · shelf + pole" },
        ],
    },
    {
        name: "Exterior",
        rows: [
            { label: "Siding + Roof", text: "Stucco 16/20 · 30-yr asphalt shingles · 8\" Windsor fascia" },
            { label: "Windows", text: "White vinyl, dual-pane, Low-E · Title 24 · 2\" faux blinds" },
            { label: "Door", text: "36\" Masonite® fiberglass, prehung + primed" },
            { label: "Electrical", text: "Dawn-to-dusk light · 2 GFCI outlets · EV charger prep" },
            { label: "Plumbing", text: "1 exterior hose bib" },
        ],
    },
    {
        name: "Construction",
        rows: [
            { label: "Structure", text: "Wood-framed · slab-on-grade · 2×4 walls · 5/8\" fire-rated drywall" },
            { label: "Insulation", text: "R15 walls + R30 roof · interior + exterior walls insulated" },
            { label: "Energy", text: "CA Title 24 compliant · PV solar on 2+ bed plans" },
            { label: "Roof", text: "Gabled · 20\" front/rear overhang · 3'×3' concrete patio stoop" },
        ],
    },
    {
        name: "Systems & Utilities",
        rows: [
            { label: "Water Heater", text: "High-efficiency 50-gal heat pump · 3.24 EF · enclosure" },
            { label: "HVAC", text: "Mini-split · flush cassettes · 1 head per bedroom · heat + cool" },
            { label: "Plumbing", text: "PEX water lines · shutoffs at every fixture · external exhaust venting" },
            { label: "Electrical", text: "200A panel + 225 busbar · 100A ADU sub-panel · CAT 6 + coax" },
        ],
    },
];

/* ── Departments + city fees data ── */
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

export function Slide4_WhatsIncluded() {
    return (
        <div className={s.slide}>
            {/* Title */}
            <div className={s.titleBar}>
                <h2 className={s.title}>What's <em>Included</em></h2>
                <span className={s.titleRule} />
            </div>

            {/* 6-category inclusions grid */}
            <div className={s.grid}>
                {INCLUSIONS.map((cat) => (
                    <div key={cat.name} className={s.card}>
                        <div className={s.cardHead}>
                            <span className={s.cardName}>{cat.name}</span>
                            <span className={s.cardRule} />
                        </div>
                        <div className={s.cardBody}>
                            {cat.rows.map((row) => (
                                <div key={row.label} className={s.row}>
                                    <span className={s.rowLabel}>{row.label}</span>
                                    <span className={s.rowText}>{row.text}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            {/* Departments + city fees band */}
            <div className={s.deptBand}>
                <div className={s.deptHead}>
                    <span className={s.deptEyebrow}>The part almost no one talks about</span>
                    <h3 className={s.deptTitle}>
                        We coordinate <em>11 departments</em> + all city fees
                    </h3>
                </div>

                <div className={s.deptBody}>
                    <div className={s.deptCol}>
                        <span className={s.deptColLabel}>City departments we manage</span>
                        <div className={s.pillWrap}>
                            {DEPT_PILLS.map((p) => (
                                <span key={p} className={s.deptPill}>{p}</span>
                            ))}
                        </div>

                    </div>
                    <div className={s.deptCol}>
                        <span className={s.deptColLabel}>City fees — all included</span>
                        {FEE_BULLETS.map((b, i) => (
                            <div key={i} className={s.feeBullet}>
                                <span className={s.feeDot} />
                                <span className={s.feeText}>{b}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
