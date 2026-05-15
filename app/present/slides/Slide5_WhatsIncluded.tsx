"use client";

import React from "react";
import s from "./Slide5.module.css";

const CARD_CONTENT = [
    {
        categories: [
            { title: "SERVICES", items: ["Custom architectural plans", "Structural + Title 24 engineering", "Full permit expediting (fees included)", "Dedicated project manager", "Weekly photo updates + portal", "Solar PV system (2+ bed detached)"] },
            { title: "CONSTRUCTION", items: ["Slab-on-grade foundation", "2×4 framing + R19/R30 insulation", "40-gal heat pump water heater", "CA Title 24 energy compliant"] },
        ],
    },
    {
        categories: [
            { title: "INTERIOR", items: ["LVP flooring (7 options)", "Vaulted ceilings in living/kitchen", "Mini-split HVAC", "Ceiling fans in bedrooms"] },
            { title: "EXTERIOR", items: ["Stucco siding", "30-yr asphalt shingle roof", "Dual-pane Low-E vinyl windows", "Fiberglass insulated entry door"] },
        ],
    },
    {
        categories: [
            { title: "KITCHEN", items: ["Shaker cabinets (8 color options)", "Quartz countertops (13 options)", "Samsung stainless appliance package", "Undermount sink with disposal", "LED recessed lighting"] },
        ],
    },
    {
        categories: [
            { title: "BATHROOMS", items: ["Fiberglass tub/shower with tile option", "Quartz vanity countertops", "30\" wood vanity, soft-close doors", "Mirror, towel bar, accessories", "Quiet-series exhaust fan"] },
        ],
    },
];

const EXTRA_COSTS = [
    "Additional Utility Trenching", "Tile Roof", "Concrete Cut/Repour",
    "Tree Removal", "Demolition", "Water Meter Upgrade", "Septic System",
    "Siding/Trim", "Roof Slope", "Fire Sprinklers", "Sewer Scope",
    "Impact Fees", "Water Drainage", "Retaining Walls",
    "Grading", "Relocate Electrical", "Ejector Pump",
];

export function Slide5_WhatsIncluded() {
    return (
        <div className={s.slide}>
            <div className={s.header}>
                <div className={s.headerLine1}>One Price. Fully Turnkey.</div>
                <div className={s.headerLine2}>Attached, Detached &amp; Garage Conversions</div>
            </div>

            <div className={s.grid}>
                {CARD_CONTENT.map((card, i) => (
                    <div key={i} className={s.card}>
                        {card.categories.map((cat) => (
                            <div key={cat.title}>
                                <div className={s.catTitle}>{cat.title}</div>
                                {cat.items.map((item) => (
                                    <div key={item} className={s.catItem}>{item}</div>
                                ))}
                            </div>
                        ))}
                    </div>
                ))}
            </div>

            <div className={s.bottomStrip}>
                <div className={s.stripHeader}>
                    <div style={{ flex: 1 }}>
                        <div className={s.stripLabel}>Potential Added Costs</div>
                        <div className={s.stripTags}>
                            {EXTRA_COSTS.map((item) => (
                                <span key={item} className="p-tag">{item}</span>
                            ))}
                        </div>
                    </div>
                    <div className={s.stripNote}>Fully assessed before signing</div>
                </div>
            </div>
            <div className={s.wbfy}>We build for you.</div>
        </div>
    );
}
