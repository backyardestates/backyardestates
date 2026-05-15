"use client";

import React from "react";
import { RunningHeader } from "./_shared/RunningHeader";
import { RunningFooter } from "./_shared/RunningFooter";
import s from "./Slide5.module.css";

const CARDS = [
    {
        title: "Services & construction",
        items: ["Custom architectural plans", "Structural + Title 24 engineering", "Full permit expediting (fees included)", "Dedicated project manager", "Weekly photo updates + portal", "Solar PV system (2+ bed detached)", "Slab-on-grade foundation", "2×4 framing + R19/R30 insulation", "40-gal heat pump water heater", "CA Title 24 energy compliant"],
    },
    {
        title: "Interior & exterior",
        items: ["LVP flooring (7 options)", "Vaulted ceilings in living/kitchen", "Mini-split HVAC", "Ceiling fans in bedrooms", "Stucco siding", "30-yr asphalt shingle roof", "Dual-pane Low-E vinyl windows", "Fiberglass insulated entry door"],
    },
    {
        title: "The kitchen",
        items: ["Shaker cabinets (8 color options)", "Quartz countertops (13 options)", "Samsung stainless appliance package", "Undermount sink with disposal", "LED recessed lighting"],
    },
    {
        title: "The bathrooms",
        items: ["Fiberglass tub/shower with tile option", "Quartz vanity countertops", "30\" wood vanity, soft-close doors", "Mirror, towel bar, accessories", "Quiet-series exhaust fan"],
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
            <RunningHeader slideNumber={5} topic="What's included" theme="light" />

            <div className={s.titleRow}>
                <h2 className={s.titleText}>One price. <em>Fully turnkey.</em></h2>
                <span className={s.titleSub}>Attached · Detached · Conversion</span>
            </div>

            <div className={s.grid}>
                {CARDS.map((card) => (
                    <div key={card.title} className={s.card}>
                        <div className={s.catTitle}>{card.title}</div>
                        {card.items.map((item) => (
                            <div key={item} className={s.catItem}>{item}</div>
                        ))}
                    </div>
                ))}
            </div>

            <div className={s.extrasStrip}>
                <div className={s.extrasHeader}>
                    <span className={s.extrasLabel}>Potential added costs</span>
                    <span className={s.extrasNote}>Fully assessed before signing.</span>
                </div>
                <div className={s.extrasTags}>
                    {EXTRA_COSTS.map((item) => (
                        <span key={item} className="p-tag p-tag-light">{item}</span>
                    ))}
                </div>
            </div>

            <RunningFooter theme="light" />
        </div>
    );
}
