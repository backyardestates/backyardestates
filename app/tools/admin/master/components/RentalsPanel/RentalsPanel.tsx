// app/admin/_components/admin/RentalsPanel.tsx
"use client";

import React, { useMemo, useState } from "react";
import type { RentalListing } from "@/lib/rentcast/types";

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
    styles,
    rentals,
    // pass selectedFloorplan?.sqft in from parent
    targetSqft,
    // optional defaults
    defaultMode = "selected",
    defaultBandPct = 0.15,
}: {
    styles: any;
    rentals: RentalListing[];
    targetSqft?: number;
    defaultMode?: Mode;
    defaultBandPct?: number; // 0.15 = 15%
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
    const initialCount = 6;
    const visible = showAll ? filtered : filtered.slice(0, initialCount);
    const hiddenCount = Math.max(0, filtered.length - visible.length);

    return (
        <div className={styles.rentalsPanel}>
            {/* KPIs */}
            <div className={styles.rentalsKpis}>
                <div className={styles.kpi}>
                    <div className={styles.kpiLabel}>Listings</div>
                    <div className={styles.kpiValue}>{filtered.length}</div>
                </div>
                <div className={styles.kpi}>
                    <div className={styles.kpiLabel}>Median rent</div>
                    <div className={styles.kpiValue}>{medianPrice != null ? money(medianPrice) : "—"}</div>
                </div>
                <div className={styles.kpi}>
                    <div className={styles.kpiLabel}>25–75%</div>
                    <div className={styles.kpiValue}>
                        {p25p75.p25 != null && p25p75.p75 != null ? `${money(p25p75.p25)} – ${money(p25p75.p75)}` : "—"}
                    </div>
                </div>
                <div className={styles.kpi}>
                    <div className={styles.kpiLabel}>Window</div>
                    <div className={styles.kpiValue}>
                        {`${num(Math.round(sqftWindow.low))}–${num(Math.round(sqftWindow.high))} sf`}
                    </div>
                </div>
            </div>

            {/* Controls */}
            <div className={styles.rentalsControls}>
                {/* Mode */}
                <label className={styles.chip}>
                    <input
                        className={styles.chipInput}
                        type="radio"
                        name="rentalsMode"
                        checked={mode === "selected"}
                        onChange={() => setMode("selected")}
                    />
                    <span>Selected unit comps</span>
                </label>

                <label className={styles.chip}>
                    <input
                        className={styles.chipInput}
                        type="radio"
                        name="rentalsMode"
                        checked={mode === "adu_range"}
                        onChange={() => setMode("adu_range")}
                    />
                    <span>All ADU-range listings</span>
                </label>

                {/* Require sqft */}
                <label className={styles.chip}>
                    <input className={styles.chipInput} type="checkbox" checked={requireSqft} onChange={(e) => setRequireSqft(e.target.checked)} />
                    <span>Has sqft</span>
                </label>

                {/* Recency */}
                <div className={styles.sortWrap}>
                    <span className={styles.sortLabel}>Recency</span>
                    <select className={styles.sortSelect} value={String(recencyDays)} onChange={(e) => setRecencyDays(Number(e.target.value))}>
                        <option value="30">30 days</option>
                        <option value="60">60 days</option>
                        <option value="90">90 days</option>
                        <option value="180">180 days</option>
                        <option value="365">365 days</option>
                    </select>
                </div>

                {/* Band */}
                <div className={styles.sortWrap}>
                    <span className={styles.sortLabel}>Sqft band</span>
                    <select className={styles.sortSelect} value={String(sqftBandPct)} onChange={(e) => setSqftBandPct(clamp(Number(e.target.value), 0.15, 0.35))}>
                        <option value="0.15">±15%</option>
                        <option value="0.2">±20%</option>
                        <option value="0.25">±25%</option>
                        <option value="0.3">±30%</option>
                        <option value="0.35">±35%</option>
                    </select>
                </div>

                {/* ADU range inputs */}
                {mode === "adu_range" ? (
                    <div className={styles.sortWrap}>
                        <span className={styles.sortLabel}>ADU range</span>
                        <input
                            className={styles.sortSelect}
                            type="number"
                            value={aduMinSqft}
                            onChange={(e) => setAduMinSqft(Number(e.target.value))}
                            style={{ width: 90 }}
                        />
                        <span className={styles.sortLabel}>to</span>
                        <input
                            className={styles.sortSelect}
                            type="number"
                            value={aduMaxSqft}
                            onChange={(e) => setAduMaxSqft(Number(e.target.value))}
                            style={{ width: 90 }}
                        />
                    </div>
                ) : null}

                {/* Sort */}
                <div className={styles.sortWrap} style={{ marginLeft: "auto" }}>
                    <span className={styles.sortLabel}>Sort</span>
                    <select className={styles.sortSelect} value={sort} onChange={(e) => setSort(e.target.value as any)}>
                        <option value="best">Best signal</option>
                        <option value="recent">Most recent</option>
                        <option value="price_desc">Rent high → low</option>
                        <option value="price_asc">Rent low → high</option>
                        <option value="sqft_closest" disabled={mode !== "selected" || typeof targetSqft !== "number"}>
                            Closest sqft (selected mode)
                        </option>
                    </select>
                </div>
            </div>

            {/* List */}
            <div className={styles.compList}>
                {visible.map((r, i) => (
                    <details key={`${r.formattedAddress ?? "r"}-${i}`} className={styles.compDetails}>
                        <summary className={styles.compRow}>
                            <div className={styles.compLeft}>
                                <div className={styles.compPrice}>{money(r.price)}</div>
                                <div className={styles.compSub}>
                                    {typeof r.squareFootage === "number" ? `${num(r.squareFootage)} sf - ${r.bedrooms} Bed/${r.bathrooms} Bath` : "— sf"}
                                </div>
                            </div>

                            <div className={styles.compMid}>
                                <div className={styles.compAddr}>{r.formattedAddress ?? "Listing"}</div>
                            </div>

                            <div className={styles.compRight}>
                                <span className={styles.chev} aria-hidden>
                                    ▾
                                </span>
                            </div>
                        </summary>

                        <div className={styles.compExpanded}>
                            <div className={styles.expGrid}>
                                <div className={styles.expItem}>
                                    <div className={styles.expLabel}>Sqft window</div>
                                    <div className={styles.expVal}>{sqftWindow.kind === "target" ? sqftWindow.label : sqftWindow.label}</div>
                                </div>
                                <div className={styles.expItem}>
                                    <div className={styles.expLabel}>Listed</div>
                                    <div className={styles.expVal}>{r.listedDate ? new Date(r.listedDate).toLocaleDateString() : "—"}</div>
                                </div>
                                <div className={styles.expItem}>
                                    <div className={styles.expLabel}>Last seen</div>
                                    <div className={styles.expVal}>{r.lastSeenDate ? new Date(r.lastSeenDate).toLocaleDateString() : "—"}</div>
                                </div>
                            </div>
                        </div>
                    </details>
                ))}

                {!filtered.length ? <div className={styles.empty}>No rentals returned for the current filters.</div> : null}
            </div>

            {/* Show more */}
            {filtered.length > initialCount ? (
                <button type="button" className={styles.showMore} onClick={() => setShowAll((v) => !v)}>
                    {showAll ? "Show less" : `Show ${hiddenCount} more`}
                </button>
            ) : null}
        </div>
    );
}
