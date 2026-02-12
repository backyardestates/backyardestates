// app/admin/_components/admin/RentalsPanel.tsx
"use client";

import React, { useMemo, useState } from "react";
import type { RentalListing } from "@/lib/rentcast/types";

function money(n?: number) {
    if (typeof n !== "number") return "—";
    return n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}
function num(n?: number) {
    return typeof n === "number" ? n.toLocaleString() : "—";
}

function medianSqft(items: Array<{ squareFootage?: number }>) {
    const sq = items
        .map((x) => x.squareFootage)
        .filter((n): n is number => typeof n === "number" && n > 0)
        .sort((a, b) => a - b);

    if (!sq.length) return undefined;
    const mid = Math.floor(sq.length / 2);
    return sq.length % 2 ? sq[mid] : (sq[mid - 1] + sq[mid]) / 2;
}

export function RentalsPanel({ styles, rentals }: { styles: any; rentals: RentalListing[] }) {
    const [showAll, setShowAll] = useState(false);
    const [onlyWithSqft, setOnlyWithSqft] = useState(true);
    const [hideOutliers, setHideOutliers] = useState(true);
    const [sort, setSort] = useState<"best" | "price_desc" | "price_asc" | "sqft_closest">("best");

    const valid = useMemo(() => {
        const items = rentals
            .filter((r) => typeof r.price === "number" && (r.price as number) > 0)
            .map((r) => ({
                ...r,
                price: r.price as number,
                squareFootage: typeof r.squareFootage === "number" ? r.squareFootage : undefined,
            }));

        return items;
    }, [rentals]);

    const prices = useMemo(() => valid.map((x) => x.price).sort((a, b) => a - b), [valid]);

    const median = useMemo(() => {
        const n = prices.length;
        if (!n) return undefined;
        const mid = Math.floor(n / 2);
        return n % 2 ? prices[mid] : (prices[mid - 1] + prices[mid]) / 2;
    }, [prices]);

    const p25p75 = useMemo(() => {
        if (!prices.length) return { p25: undefined, p75: undefined };
        const pick = (p: number) => prices[Math.min(prices.length - 1, Math.max(0, Math.round((prices.length - 1) * p)))];
        return { p25: pick(0.25), p75: pick(0.75) };
    }, [prices]);

    const filtered = useMemo(() => {
        let items = [...valid];

        if (onlyWithSqft) items = items.filter((x) => typeof x.squareFootage === "number" && (x.squareFootage as number) > 0);

        if (hideOutliers && p25p75.p25 != null && p25p75.p75 != null) {
            const iqr = (p25p75.p75 as number) - (p25p75.p25 as number);
            const low = (p25p75.p25 as number) - 1.5 * iqr;
            const high = (p25p75.p75 as number) + 1.5 * iqr;
            items = items.filter((x) => x.price >= low && x.price <= high);
        }

        if (sort === "price_desc") items.sort((a, b) => b.price - a.price);
        if (sort === "price_asc") items.sort((a, b) => a.price - b.price);

        if (sort === "best" && median != null) items.sort((a, b) => Math.abs(a.price - (median as number)) - Math.abs(b.price - (median as number)));

        if (sort === "sqft_closest") {
            const target = medianSqft(items);
            if (target != null) items.sort((a, b) => Math.abs((a.squareFootage ?? 0) - target) - Math.abs((b.squareFootage ?? 0) - target));
            else if (median != null) items.sort((a, b) => Math.abs(a.price - (median as number)) - Math.abs(b.price - (median as number)));
        }

        return items;
    }, [valid, onlyWithSqft, hideOutliers, sort, median, p25p75.p25, p25p75.p75]);

    const initialCount = 6;
    const visible = showAll ? filtered : filtered.slice(0, initialCount);
    const hiddenCount = Math.max(0, filtered.length - visible.length);

    return (
        <div className={styles.rentalsPanel}>
            <div className={styles.rentalsKpis}>
                <div className={styles.kpi}>
                    <div className={styles.kpiLabel}>Listings</div>
                    <div className={styles.kpiValue}>{filtered.length}</div>
                </div>
                <div className={styles.kpi}>
                    <div className={styles.kpiLabel}>Median rent</div>
                    <div className={styles.kpiValue}>{median != null ? money(median) : "—"}</div>
                </div>
                <div className={styles.kpi}>
                    <div className={styles.kpiLabel}>25–75%</div>
                    <div className={styles.kpiValue}>
                        {p25p75.p25 != null && p25p75.p75 != null ? `${money(p25p75.p25)} – ${money(p25p75.p75)}` : "—"}
                    </div>
                </div>
                <div className={styles.kpi}>
                    <div className={styles.kpiLabel}>Data quality</div>
                    <div className={styles.kpiValue}>
                        {valid.length ? `${Math.round((filtered.length / valid.length) * 100)}% kept` : "—"}
                    </div>
                </div>
            </div>

            <div className={styles.rentalsControls}>
                <label className={styles.chip}>
                    <input className={styles.chipInput} type="checkbox" checked={onlyWithSqft} onChange={(e) => setOnlyWithSqft(e.target.checked)} />
                    <span>Has sqft</span>
                </label>

                <label className={styles.chip}>
                    <input className={styles.chipInput} type="checkbox" checked={hideOutliers} onChange={(e) => setHideOutliers(e.target.checked)} />
                    <span>Hide outliers</span>
                </label>

                <div className={styles.sortWrap}>
                    <span className={styles.sortLabel}>Sort</span>
                    <select className={styles.sortSelect} value={sort} onChange={(e) => setSort(e.target.value as any)}>
                        <option value="best">Best signal</option>
                        <option value="price_desc">Rent high → low</option>
                        <option value="price_asc">Rent low → high</option>
                        <option value="sqft_closest">Closest sqft</option>
                    </select>
                </div>
            </div>

            <div className={styles.compList}>
                {visible.map((r, i) => (
                    <details key={`${r.formattedAddress ?? "r"}-${i}`} className={styles.compDetails}>
                        <summary className={styles.compRow}>
                            <div className={styles.compLeft}>
                                <div className={styles.compPrice}>{money(r.price)}</div>
                                <div className={styles.compSub}>
                                    {typeof r.squareFootage === "number" ? `${num(r.squareFootage)} sf` : "— sf"} • {r.bedrooms ?? "—"} bd / {r.bathrooms ?? "—"} ba
                                </div>
                            </div>

                            <div className={styles.compMid}>
                                <div className={styles.compAddr}>{r.formattedAddress ?? "Listing"}</div>
                                <div className={styles.compMeta}>
                                    {r.status ?? "—"} • DOM {r.daysOnMarket ?? "—"}
                                </div>
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
                                    <div className={styles.expLabel}>Listed</div>
                                    <div className={styles.expVal}>{r.listedDate ? new Date(r.listedDate).toLocaleDateString() : "—"}</div>
                                </div>
                                <div className={styles.expItem}>
                                    <div className={styles.expLabel}>Last seen</div>
                                    <div className={styles.expVal}>{r.lastSeenDate ? new Date(r.lastSeenDate).toLocaleDateString() : "—"}</div>
                                </div>
                                <div className={styles.expItem}>
                                    <div className={styles.expLabel}>Type</div>
                                    <div className={styles.expVal}>{r.propertyType ?? "—"}</div>
                                </div>
                            </div>
                        </div>
                    </details>
                ))}

                {!filtered.length ? <div className={styles.empty}>No rentals returned (or no valid rent values).</div> : null}
            </div>

            {filtered.length > initialCount ? (
                <button type="button" className={styles.showMore} onClick={() => setShowAll((v) => !v)}>
                    {showAll ? "Show less" : `Show ${hiddenCount} more`}
                </button>
            ) : null}
        </div>
    );
}
