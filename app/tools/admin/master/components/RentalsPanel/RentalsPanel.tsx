// app/admin/_components/admin/RentalsPanel.tsx
"use client";

import React, { useMemo, useState } from "react";
import type { RentalListing } from "@/lib/rentcast/types";
import type { FeaturedRental } from "@/lib/store/presentationStore";
import { rentalKey } from "@/lib/rentals/featured";
import s from "./RentalsPanel.module.css";

type Mode = "selected" | "adu_range";

function money(n?: number) {
    if (typeof n !== "number") return "—";
    return n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}
function num(n?: number) {
    return typeof n === "number" ? n.toLocaleString() : "—";
}

function clamp(n: number, a: number, b: number) {
    return Math.max(a, Math.min(b, n));
}

function dayDiffFromNow(iso?: string) {
    if (!iso) return undefined;
    const t = Date.parse(iso);
    if (!Number.isFinite(t)) return undefined;
    const ms = Date.now() - t;
    return ms > 0 ? Math.floor(ms / (1000 * 60 * 60 * 24)) : 0;
}

/**
 * Optional: scoring that makes “Best signal” actually useful.
 * - If mode === "selected": prefers closest sqft to target, more recent, and stable rent.
 * - If mode === "adu_range": defaults to recency + “middle-of-pack” rent (unless you change sort).
 */
function scoreListing(input: {
    price: number;
    sqft?: number;
    targetSqft?: number;
    medianPrice?: number;
    recencyDays?: number;
    lastSeenDate?: string;
    listedDate?: string;
}) {
    const { price, sqft, targetSqft, medianPrice, recencyDays, lastSeenDate, listedDate } = input;

    // recency component (lower is better)
    const days = dayDiffFromNow(lastSeenDate) ?? dayDiffFromNow(listedDate) ?? undefined;
    const recencyScore =
        recencyDays != null && days != null ? clamp(days / Math.max(1, recencyDays), 0, 2) : 1;

    // price stability component (lower is better)
    const priceScore = medianPrice != null ? Math.abs(price - medianPrice) / Math.max(1, medianPrice) : 1;

    // sqft proximity component (lower is better)
    const sqftScore =
        targetSqft != null && sqft != null ? Math.abs(sqft - targetSqft) / Math.max(1, targetSqft) : 1;

    // weights
    // If targetSqft exists, heavily prefer sqft proximity.
    if (targetSqft != null) return sqftScore * 2.2 + recencyScore * 0.9 + priceScore * 0.7;

    // Otherwise: prefer recent + “not crazy price”
    return recencyScore * 1.2 + priceScore * 1.0;
}

export function RentalsPanel({
    rentals,
    // pass selectedFloorplan?.sqft in from parent
    targetSqft,
    // optional defaults
    defaultMode = "selected",
    defaultBandPct = 0.15,
    onRentPick,
    // ── Feature-on-slide selection (merged from the old Feature Rentals step) ──
    selectedFeatured,
    onToggleFeature,
    maxFeatured = 4,
}: {
    rentals: RentalListing[];
    targetSqft?: number;
    defaultMode?: Mode;
    defaultBandPct?: number; // 0.15 = 15%
    onRentPick?: (rent: number) => void;
    /** Currently-featured rentals — used to show which comps are on the slide. */
    selectedFeatured?: FeaturedRental[];
    /** Toggle a comp's featured state. When set, each row shows a ★ Feature button. */
    onToggleFeature?: (r: RentalListing) => void;
    /** Max number of featured rentals (default 4). */
    maxFeatured?: number;
}) {

    // ✅ Mode toggle
    const [mode, setMode] = useState<Mode>(defaultMode);

    // ✅ "show all ADU-range" knobs
    const [aduMinSqft, setAduMinSqft] = useState(350);
    const [aduMaxSqft, setAduMaxSqft] = useState(1200);

    // ✅ Your “band” (15%–35%)
    const [sqftBandPct, setSqftBandPct] = useState(clamp(defaultBandPct, 0.15, 0.35));

    // ✅ Make filters actually valuable
    const [showAll, setShowAll] = useState(false);
    const [requireSqft, setRequireSqft] = useState(true);

    // ✅ recency filter (super useful to remove stale junk)
    const [recencyDays, setRecencyDays] = useState(180);

    // ✅ sorting
    const [sort, setSort] = useState<"best" | "price_desc" | "price_asc" | "sqft_closest" | "recent">("best");

    // Normalize and keep only valid price rows (sqft optional)
    const valid = useMemo(() => {
        return (rentals ?? [])
            .filter((r) => typeof r.price === "number" && (r.price as number) > 0)
            .map((r) => ({
                ...r,
                price: r.price as number,
                squareFootage: typeof r.squareFootage === "number" && r.squareFootage > 0 ? r.squareFootage : undefined,
            }));
    }, [rentals]);

    // Median price for scoring + KPI
    const pricesSorted = useMemo(() => valid.map((x) => x.price).sort((a, b) => a - b), [valid]);

    const medianPrice = useMemo(() => {
        const n = pricesSorted.length;
        if (!n) return undefined;
        const mid = Math.floor(n / 2);
        return n % 2 ? pricesSorted[mid] : (pricesSorted[mid - 1] + pricesSorted[mid]) / 2;
    }, [pricesSorted]);

    // 25/75 KPI
    const p25p75 = useMemo(() => {
        if (!pricesSorted.length) return { p25: undefined, p75: undefined };
        const pick = (p: number) =>
            pricesSorted[Math.min(pricesSorted.length - 1, Math.max(0, Math.round((pricesSorted.length - 1) * p)))];
        return { p25: pick(0.25), p75: pick(0.75) };
    }, [pricesSorted]);

    // ✅ Active sqft filter window (depends on mode)
    const sqftWindow = useMemo(() => {
        if (mode === "selected" && typeof targetSqft === "number" && targetSqft > 0) {
            const low = targetSqft * (1 - sqftBandPct);
            const high = targetSqft * (1 + sqftBandPct);
            return { kind: "target" as const, low, high, label: `±${Math.round(sqftBandPct * 100)}% of ${Math.round(targetSqft)} sf` };
        }
        const min = Math.min(aduMinSqft, aduMaxSqft);
        const max = Math.max(aduMinSqft, aduMaxSqft);
        const low = min * (1 - sqftBandPct);
        const high = max * (1 + sqftBandPct);
        return { kind: "range" as const, low, high, label: `${min}–${max} sf (ADU range)` };
    }, [mode, targetSqft, sqftBandPct, aduMinSqft, aduMaxSqft]);

    const filtered = useMemo(() => {
        let items = [...valid];

        // ✅ Sqft requirement
        if (requireSqft) items = items.filter((x) => typeof x.squareFootage === "number");

        // ✅ Sqft window
        items = items.filter((x) => {
            const sf = x.squareFootage;
            if (typeof sf !== "number") return !requireSqft;
            return sf >= sqftWindow.low && sf <= sqftWindow.high;
        });

        // ✅ Recency filter (uses lastSeenDate OR listedDate)
        if (recencyDays != null && recencyDays > 0) {
            items = items.filter((x) => {
                const d = dayDiffFromNow(x.lastSeenDate) ?? dayDiffFromNow(x.listedDate);
                if (d == null) return false; // no date -> drop (better signal)
                return d <= recencyDays;
            });
        }

        // Sorting
        const effectiveSort =
            mode === "adu_range" && sort === "sqft_closest" ? "best" : sort; // sqft_closest not super meaningful in range mode

        if (effectiveSort === "price_desc") items.sort((a, b) => b.price - a.price);
        if (effectiveSort === "price_asc") items.sort((a, b) => a.price - b.price);

        if (effectiveSort === "recent") {
            items.sort((a, b) => {
                const da = dayDiffFromNow(a.lastSeenDate) ?? dayDiffFromNow(a.listedDate) ?? 999999;
                const db = dayDiffFromNow(b.lastSeenDate) ?? dayDiffFromNow(b.listedDate) ?? 999999;
                return da - db;
            });
        }

        if (effectiveSort === "sqft_closest" && typeof targetSqft === "number") {
            items.sort((a, b) => Math.abs((a.squareFootage ?? 0) - targetSqft) - Math.abs((b.squareFootage ?? 0) - targetSqft));
        }

        if (effectiveSort === "best") {
            const scoringTarget = mode === "selected" ? targetSqft : undefined;
            items.sort(
                (a, b) =>
                    scoreListing({
                        price: a.price,
                        sqft: a.squareFootage,
                        targetSqft: scoringTarget,
                        medianPrice,
                        recencyDays,
                        lastSeenDate: a.lastSeenDate,
                        listedDate: a.listedDate,
                    }) -
                    scoreListing({
                        price: b.price,
                        sqft: b.squareFootage,
                        targetSqft: scoringTarget,
                        medianPrice,
                        recencyDays,
                        lastSeenDate: b.lastSeenDate,
                        listedDate: b.listedDate,
                    })
            );
        }

        return items;
    }, [valid, requireSqft, sqftWindow.low, sqftWindow.high, recencyDays, sort, mode, targetSqft, medianPrice, sqftWindow.kind]);
    // ── Featured-on-slide lookup (for the per-row ★ Feature toggle) ──
    const featuredKeys = useMemo(
        () => new Set((selectedFeatured ?? []).map(rentalKey)),
        [selectedFeatured],
    );
    const featuredCount = selectedFeatured?.length ?? 0;

    const initialCount = 6;
    const visible = showAll ? filtered : filtered.slice(0, initialCount);
    const hiddenCount = Math.max(0, filtered.length - visible.length);

    return (
        <div className={s.rentalsPanel}>
            {/* KPIs */}
            <div className={s.rentalsKpis}>
                <div className={s.kpi} title="How many comparable rentals match your current filters.">
                    <div className={s.kpiLabel}>Comps found</div>
                    <div className={s.kpiValue}>{filtered.length}</div>
                </div>
                <div className={s.kpi} title="The middle rent of the comps — half rent for more, half for less.">
                    <div className={s.kpiLabel}>Median rent</div>
                    <div className={s.kpiValue}>{medianPrice != null ? money(medianPrice) : "—"}</div>
                </div>
                <div className={s.kpi} title="Where the middle 50% of rents fall — most comps rent somewhere in this range.">
                    <div className={s.kpiLabel}>Typical range</div>
                    <div className={s.kpiValue}>
                        {p25p75.p25 != null && p25p75.p75 != null ? `${money(p25p75.p25)} – ${money(p25p75.p75)}` : "—"}
                    </div>
                </div>
                <div className={s.kpi} title="The square-footage range of the rentals being shown.">
                    <div className={s.kpiLabel}>Sizes shown</div>
                    <div className={s.kpiValue}>
                        {`${num(Math.round(sqftWindow.low))}–${num(Math.round(sqftWindow.high))} sf`}
                    </div>
                </div>
                {onToggleFeature && (
                    <div className={s.kpi} title="Rentals you've added to the presentation slide (max 4).">
                        <div className={s.kpiLabel}>Featured</div>
                        <div className={s.kpiValue}>{featuredCount} / {maxFeatured}</div>
                    </div>
                )}
            </div>

            {/* Controls */}
            <div className={s.rentalsControls}>
                {/* Primary: which rentals to compare against */}
                <div className={s.field}>
                    <span className={s.fieldLabel}>Compare against</span>
                    <div className={s.seg} role="group" aria-label="Compare against">
                        <button
                            type="button"
                            className={`${s.segBtn} ${mode === "selected" ? s.segBtnOn : ""}`}
                            aria-pressed={mode === "selected"}
                            onClick={() => setMode("selected")}
                            title="Only show rentals close in size to the ADU you selected."
                        >
                            Similar to my ADU
                        </button>
                        <button
                            type="button"
                            className={`${s.segBtn} ${mode === "adu_range" ? s.segBtnOn : ""}`}
                            aria-pressed={mode === "adu_range"}
                            onClick={() => setMode("adu_range")}
                            title="Show rentals across the full ADU size range, not just your unit's size."
                        >
                            All ADU sizes
                        </button>
                    </div>
                </div>

                {/* Listed within */}
                <div className={s.field}>
                    <span className={s.fieldLabel}>Listed within</span>
                    <select
                        className={s.sortSelect}
                        value={String(recencyDays)}
                        onChange={(e) => setRecencyDays(Number(e.target.value))}
                        title="Only include rentals seen on the market within this many days."
                    >
                        <option value="30">30 days</option>
                        <option value="60">60 days</option>
                        <option value="90">90 days</option>
                        <option value="180">180 days</option>
                        <option value="365">365 days</option>
                    </select>
                </div>

                {/* Size match (band) */}
                <div className={s.field}>
                    <span className={s.fieldLabel}>Size match</span>
                    <select
                        className={s.sortSelect}
                        value={String(sqftBandPct)}
                        onChange={(e) => setSqftBandPct(clamp(Number(e.target.value), 0.15, 0.35))}
                        title="How close in size a rental must be to count as comparable. ±15% is strict; ±35% is loose."
                    >
                        <option value="0.15">Within ±15%</option>
                        <option value="0.2">Within ±20%</option>
                        <option value="0.25">Within ±25%</option>
                        <option value="0.3">Within ±30%</option>
                        <option value="0.35">Within ±35%</option>
                    </select>
                </div>

                {/* Size range — only when comparing across all ADU sizes */}
                {mode === "adu_range" && (
                    <div className={`${s.field} ${s.fieldReveal}`}>
                        <span className={s.fieldLabel}>Size range (sq ft)</span>
                        <div className={s.rangeRow} title="The smallest and largest square footage to include.">
                            <input
                                className={s.rangeInput}
                                type="number"
                                value={aduMinSqft}
                                onChange={(e) => setAduMinSqft(Number(e.target.value))}
                            />
                            <span className={s.rangeDash}>–</span>
                            <input
                                className={s.rangeInput}
                                type="number"
                                value={aduMaxSqft}
                                onChange={(e) => setAduMaxSqft(Number(e.target.value))}
                            />
                        </div>
                    </div>
                )}

                {/* Has size listed — toggle switch */}
                <label className={s.toggle} title="Hide rentals that don't report a square footage.">
                    <input
                        className={s.toggleInput}
                        type="checkbox"
                        checked={requireSqft}
                        onChange={(e) => setRequireSqft(e.target.checked)}
                    />
                    <span className={s.toggleTrack}>
                        <span className={s.toggleKnob} />
                    </span>
                    <span className={s.toggleText}>Has size listed</span>
                </label>

                {/* Sort — pushed to the right */}
                <div className={`${s.field} ${s.fieldEnd}`}>
                    <span className={s.fieldLabel}>Sort by</span>
                    <select
                        className={s.sortSelect}
                        value={sort}
                        onChange={(e) => setSort(e.target.value as any)}
                        title="How the list below is ordered. “Best match” balances closest size, most recent, and typical price."
                    >
                        <option value="best">Best match</option>
                        <option value="recent">Most recent</option>
                        <option value="price_desc">Rent: high to low</option>
                        <option value="price_asc">Rent: low to high</option>
                        <option value="sqft_closest" disabled={mode !== "selected" || typeof targetSqft !== "number"}>
                            Closest in size
                        </option>
                    </select>
                </div>
            </div>

            {/* List */}
            <div className={s.compList}>
                {visible.map((r, i) => (
                    <details key={`${r.formattedAddress ?? "r"}-${i}`} className={s.compDetails}>
                        <summary className={s.compRow}>
                            <div className={s.compLeft}>
                                <div className={s.compPrice}>{money(r.price)}</div>
                                <div className={s.compSub}>
                                    {typeof r.squareFootage === "number" ? `${num(r.squareFootage)} sf - ${r.bedrooms} Bed/${r.bathrooms} Bath` : "— sf"}
                                </div>
                            </div>

                            <div className={s.compMid}>
                                <div className={s.compAddr}>{r.formattedAddress ?? "Listing"}</div>
                            </div>

                            <div className={s.compRight}>
                                {onRentPick && (
                                    <button
                                        type="button"
                                        className={s.useBtn}
                                        onClick={(e) => {
                                            e.preventDefault();
                                            onRentPick(r.price);
                                        }}
                                    >
                                        Use
                                    </button>
                                )}
                                {onToggleFeature && (() => {
                                    const isFeat = featuredKeys.has(rentalKey(r));
                                    const atFeatLimit = !isFeat && featuredCount >= maxFeatured;
                                    return (
                                        <button
                                            type="button"
                                            className={`${s.featBtn} ${isFeat ? s.featBtnOn : ""}`}
                                            disabled={atFeatLimit}
                                            aria-pressed={isFeat}
                                            title={
                                                isFeat
                                                    ? "Featured on the slide — click to remove"
                                                    : atFeatLimit
                                                        ? `Max ${maxFeatured} featured`
                                                        : "Feature on the slide"
                                            }
                                            onClick={(e) => {
                                                e.preventDefault();
                                                onToggleFeature(r as RentalListing);
                                            }}
                                        >
                                            {isFeat ? "★ Featured" : "☆ Feature"}
                                        </button>
                                    );
                                })()}
                                <span className={s.chev} aria-hidden>
                                    ▾
                                </span>
                            </div>
                        </summary>

                        <div className={s.compExpanded}>
                            <div className={s.expGrid}>
                                <div className={s.expItem}>
                                    <div className={s.expLabel}>Size filter</div>
                                    <div className={s.expVal}>{sqftWindow.label}</div>
                                </div>
                                <div className={s.expItem}>
                                    <div className={s.expLabel}>Listed</div>
                                    <div className={s.expVal}>{r.listedDate ? new Date(r.listedDate).toLocaleDateString() : "—"}</div>
                                </div>
                                <div className={s.expItem}>
                                    <div className={s.expLabel}>Last seen</div>
                                    <div className={s.expVal}>{r.lastSeenDate ? new Date(r.lastSeenDate).toLocaleDateString() : "—"}</div>
                                </div>
                            </div>
                        </div>
                    </details>
                ))}

                {!filtered.length ? <div className={s.empty}>No rentals returned for the current filters.</div> : null}
            </div>

            {/* Show more */}
            {filtered.length > initialCount ? (
                <button type="button" className={s.showMore} onClick={() => setShowAll((v) => !v)}>
                    {showAll ? "Show less" : `Show ${hiddenCount} more`}
                </button>
            ) : null}
        </div>
    );
}
