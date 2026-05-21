"use client";

import React from "react";
import { usePresentationStore } from "@/lib/store/presentationStore";
import { CITY_TIMELINES } from "@/lib/config/cityTimelines";
import s from "./Slide7.module.css";

/* ── helpers ── */

// Parse "25 days" / "6 months" / "6-12 months" / "1,202 days" / "Varies" → days, or null
function parseDays(raw: string): number | null {
    if (!raw) return null;
    const v = raw.replace(/,/g, "").toLowerCase().trim();
    if (v.includes("varies") || v.includes("not tracked")) return null;
    const dayMatch = v.match(/(\d+(?:\.\d+)?)\s*days?/);
    if (dayMatch) return Math.round(parseFloat(dayMatch[1]));
    const monthRange = v.match(/(\d+)\s*-\s*(\d+)\s*months?/);
    if (monthRange) return Math.round((parseInt(monthRange[1]) + parseInt(monthRange[2])) / 2 * 30);
    const monthMatch = v.match(/(\d+)\s*months?/);
    if (monthMatch) return parseInt(monthMatch[1]) * 30;
    return null;
}

function daysToMonths(d: number): string {
    const m = d / 30;
    const rounded = Math.round(m * 2) / 2;
    return rounded.toString();
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

// Placeholder city values when our database has no real number for this address yet.
const INDUSTRY_AVG = {
    plans:      "3–6 months",
    permitting: "6–12 months",
    build:      "6–12 months",
};

function cityCellValue(cityVal: string, fallback: string): string {
    const v = cityVal.toLowerCase();
    if (v.includes("varies") || v.includes("not tracked")) return fallback;
    return cityVal;
}

function formatDays(d: number): string {
    return `${d.toLocaleString()} day${d === 1 ? "" : "s"}`;
}

export function Slide7_HowItWorks() {
    const { customerName, propertyAddress, projectTimeline, citiesCatalog } = usePresentationStore();
    const lastName = lastNameFromFull(customerName);
    const cityLabel = propertyAddress ? cityFromAddress(propertyAddress) : "—";

    // Match address against the DB catalog first (preferred), then fall back to
    // the legacy CITY_TIMELINES constants.
    const dbMatch = propertyAddress && citiesCatalog && citiesCatalog.length > 0
        ? citiesCatalog.find(
            (c) => c.active && propertyAddress.toLowerCase().includes(c.name.toLowerCase())
        )
        : undefined;

    const legacyMatchKey = propertyAddress
        ? Object.keys(CITY_TIMELINES).find(
            (c) => c !== "default" && propertyAddress.toLowerCase().includes(c.toLowerCase())
        )
        : undefined;

    const timeline = CITY_TIMELINES[legacyMatchKey ?? "default"];

    // BE days: admin Step 11 override → DB catalog → legacy constants → hard default.
    const beDesignDays =
        projectTimeline?.be.plans   ?? dbMatch?.bePlansDays   ?? parseDays(timeline.plans.be)      ?? 25;
    const bePermitDays =
        projectTimeline?.be.permits ?? dbMatch?.bePermitsDays ?? parseDays(timeline.permitting.be) ?? 130;
    const beBuildDays  =
        projectTimeline?.be.build   ?? dbMatch?.beBuildDays   ?? parseDays(timeline.build.be)      ?? 40;
    const totalDays    = beDesignDays + bePermitDays + beBuildDays;
    const totalMonths  = daysToMonths(totalDays);

    // Resolve city-side cell text: prefer DB label/days when matched, else
    // legacy constants, else industry placeholder.
    function resolvedCityText(
        dbDays: number | null | undefined,
        dbLabel: string | null | undefined,
        legacyText: string,
        fallback: string
    ): string {
        if (dbMatch) {
            if (dbLabel && dbLabel.trim().length > 0) return dbLabel;
            if (typeof dbDays === "number") return formatDays(dbDays);
        }
        return cityCellValue(legacyText, fallback);
    }

    // 6 rich stations — replaces both the slim timeline + the standalone "what we handle" steps.
    const STATIONS = [
        {
            num: "1",
            title: "Sign & Deposit",
            day: "Day 1",
            desc: "You sign — we lock your build slot. DocuSign sent by tomorrow.",
        },
        {
            num: "2",
            title: "Site Visit",
            day: "Within 1 week",
            desc: "Our team measures, scans, and verifies feasibility on-site.",
        },
        {
            num: "3",
            title: "Floor Plan Sign-Off",
            day: "Within 2 weeks",
            desc: "Custom layouts — we iterate until you approve every detail.",
        },
        {
            num: "4",
            title: "Schematic Design",
            day: "Within 3 weeks",
            desc: "Approved floor plan turned into elevations, sections, and structural drawings.",
        },
        {
            num: "5",
            title: "Interior Design Selections",
            day: "Within 5 weeks",
            desc: "Finishes, fixtures, paint, and tile — your interior, your call.",
        },
        {
            num: "6",
            title: "Permit Submittal",
            day: "Within 6 weeks",
            desc: "Complete plan set submitted to the city for review and approval.",
        },
    ];

    // Display values: admin-entered (Step 11) wins; otherwise CITY_TIMELINES text.
    const beDisplay = (phaseDays: number, fallback: string) =>
        projectTimeline ? formatDays(phaseDays) : fallback;
    const cityDisplay = (phaseDays: number | undefined, fallback: string) =>
        projectTimeline && phaseDays != null ? formatDays(phaseDays) : fallback;

    const COMPARISON_COLS = [
        {
            label: "Plans & Design",
            be:   beDisplay(beDesignDays, timeline.plans.be),
            city: cityDisplay(
                projectTimeline?.city.plans,
                resolvedCityText(dbMatch?.cityPlansDays, dbMatch?.cityPlansLabel, timeline.plans.city, INDUSTRY_AVG.plans)
            ),
        },
        {
            label: "Permits",
            be:   beDisplay(bePermitDays, timeline.permitting.be),
            city: cityDisplay(
                projectTimeline?.city.permits,
                resolvedCityText(dbMatch?.cityPermitsDays, dbMatch?.cityPermitsLabel, timeline.permitting.city, INDUSTRY_AVG.permitting)
            ),
        },
        {
            label: "Construction",
            be:   beDisplay(beBuildDays, timeline.build.be),
            city: cityDisplay(
                projectTimeline?.city.build,
                resolvedCityText(dbMatch?.cityBuildDays, dbMatch?.cityBuildLabel, timeline.build.city, INDUSTRY_AVG.build)
            ),
        },
    ];

    return (
        <div className={s.slide}>
            {/* Running header */}
            <div className="running-header rh-light">
                <span className="running-header-left">{lastName} · {cityLabel}</span>
                <span className="running-header-center">How It Works</span>
                <span className="running-header-right">
                    <span className="running-header-num">07</span> / 15
                </span>
            </div>

            {/* Headline */}
            <div className={s.headRow}>
                <div className={s.headLeft}>
                    <span className={s.headEyebrow}>What happens after you say yes</span>
                    <h2 className={s.headTitle}>
                        From here, it's <em>our job.</em>
                    </h2>
                </div>
            </div>

            {/* Rich timeline strip — 6 stations carrying the full process narrative */}
            <div className={s.timeline}>
                {STATIONS.map((st, i) => (
                    <React.Fragment key={st.title}>
                        <div className={s.station}>
                            <div className={s.stationDot}>
                                <span className={s.stationNum}>{st.num}</span>
                            </div>
                            <div className={s.stationTitle}>{st.title}</div>
                            <div className={s.stationDayChip}>{st.day}</div>
                            <div className={s.stationDesc}>{st.desc}</div>
                        </div>
                        {i < STATIONS.length - 1 && (
                            <div className={s.stationConnector} aria-hidden="true">
                                <div className={s.stationConnectorLine} />
                                <div className={s.stationConnectorArrow}>›</div>
                            </div>
                        )}
                    </React.Fragment>
                ))}
            </div>

            {/* Comparison panel — header now carries the hero BE total alongside the phase title */}
            <div className={s.compPanel}>
                <div className={s.compHead}>
                    <div className={s.compHeadTotal}>
                        <span className={s.compHeadTotalLabel}>Signature → Move-in</span>
                        <div className={s.compHeadTotalValueRow}>
                            <span className={s.compHeadTotalValue}>~{totalMonths}</span>
                            <span className={s.compHeadTotalUnit}>months</span>
                        </div>
                        <span className={s.compHeadTotalNote}>Total project, start to keys</span>
                    </div>
                    <div className={s.compHeadLeft}>
                        <span className={s.compEyebrow}>Phase by phase</span>
                        <h3 className={s.compTitle}>
                            Faster <em>at every step.</em>
                        </h3>
                    </div>
                </div>

                <div className={s.compCols}>
                    {COMPARISON_COLS.map((col) => (
                        <div key={col.label} className={s.compCol}>
                            <span className={s.compColLabel}>{col.label}</span>
                            <div className={s.compChipsStack}>
                                <div className={s.compCity}>
                                    <span className={s.compChipKicker}>City average</span>
                                    <span className={s.compChipValue}>{col.city}</span>
                                </div>
                                <div className={s.compBE}>
                                    <span className={s.compChipKicker}>Backyard Estates</span>
                                    <span className={s.compChipValue}>{col.be}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Closing footer */}
            <div className={s.footer}>
                <span className={s.footerLeft}>
                    Sign this week · On-site within 7 days · Move-in ready in ~{totalMonths} months
                </span>
                <span className={s.footerRight}>We build for you.</span>
            </div>
        </div>
    );
}
