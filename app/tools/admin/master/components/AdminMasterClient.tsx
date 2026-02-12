"use client";

import React, { useEffect, useMemo, useState } from "react";
import styles from "./AdminMasterClient.module.css";
import { AddressAutocomplete } from "./address/AddressAutocomplete";
import { InvestmentModelTable } from "./investmentModel/InvestementModelTable";

type Floorplan = {
    _id: string;
    name: string;
    sqft: number;
    price: number;
};

type PropertyRecord = {
    formattedAddress?: string;
    addressLine1?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    county?: string;
    propertyType?: string;
    bedrooms?: number;
    bathrooms?: number;
    squareFootage?: number;
    lotSize?: number;
    yearBuilt?: number;
    lastSaleDate?: string;
    lastSalePrice?: number;
    zoning?: string;
    assessorID?: string;
};

type AvmValue = {
    price?: number;
    priceRangeLow?: number;
    priceRangeHigh?: number;
    subjectProperty?: {
        city?: string;
        state?: string;
        squareFootage?: number;
        propertyType?: string;
        yearBuilt?: number;
        lotSize?: number;
        bedrooms?: number;
        bathrooms?: number;
        lastSaleDate?: string;
        lastSalePrice?: number;
    };
    comparables?: Array<{
        formattedAddress?: string;
        price?: number;
        squareFootage?: number;
        distance?: number;
        correlation?: number;
        lastSeenDate?: string;
    }>;
};

type RentalListing = {
    formattedAddress?: string;
    price?: number;
    bedrooms?: number;
    bathrooms?: number;
    squareFootage?: number;
    propertyType?: string;
    listedDate?: string;
    lastSeenDate?: string;
    daysOnMarket?: number;
    status?: string;
};

function money(n?: number) {
    if (typeof n !== "number") return "—";
    return n.toLocaleString("en-US", {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 0,
    });
}

function num(n?: number) {
    return typeof n === "number" ? n.toLocaleString() : "—";
}


// ...types + money/num helpers unchanged...

export default function AdminMasterClient({
    initialFloorplans,
}: {
    initialFloorplans: Floorplan[];
}) {
    const [address, setAddress] = useState("");
    const [owed, setOwed] = useState("");

    const [floorplans, setFloorplans] = useState<Floorplan[]>(initialFloorplans);
    const [floorplanId, setFloorplanId] = useState<string>(
        initialFloorplans?.[0]?._id ?? ""
    );

    useEffect(() => {
        setFloorplans(initialFloorplans);
        setFloorplanId((prev) => prev || initialFloorplans?.[0]?._id || "");
    }, [initialFloorplans]);

    const selectedFloorplan = useMemo(
        () => floorplans.find((fp) => fp._id === floorplanId) ?? null,
        [floorplans, floorplanId]
    );

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [property, setProperty] = useState<PropertyRecord | null>(null);
    const [avm, setAvm] = useState<AvmValue | null>(null);
    const [rentals, setRentals] = useState<RentalListing[]>([]);

    const [lat, setLat] = useState<number | null>(null);
    const [lng, setLng] = useState<number | null>(null);

    async function getApiData() {
        setLoading(true);
        setError(null);
        setProperty(null);
        setAvm(null);
        setRentals([]);

        try {
            if (!address.trim()) throw new Error("Please enter an address.");
            if (!selectedFloorplan?.sqft)
                throw new Error("Please select a floorplan.");

            const a = address.trim();

            const propRes = await fetch(
                `/api/rentcast/properties?address=${encodeURIComponent(a)}`,
                { cache: "no-store" }
            );
            const propJson = await propRes.json();
            if (!propRes.ok)
                throw new Error(propJson?.error ?? "Failed to fetch property record.");
            setProperty(propJson.record ?? null);

            const avmRes = await fetch(
                `/api/rentcast/avm?address=${encodeURIComponent(a)}`,
                { cache: "no-store" }
            );
            const avmJson = await avmRes.json();
            if (!avmRes.ok) throw new Error(avmJson?.error ?? "Failed to fetch AVM.");
            setAvm(avmJson);

            const city = avmJson?.subjectProperty?.city ?? propJson?.record?.city;
            const state = avmJson?.subjectProperty?.state ?? propJson?.record?.state;

            if (!city || !state) {
                throw new Error("Could not determine city/state from the property data.");
            }

            const rentalsRes = await fetch(
                `/api/rentcast/rentals?city=${encodeURIComponent(city)}&state=${encodeURIComponent(state)}`,
                { cache: "no-store" }
            );

            const rentalsJson = await rentalsRes.json();
            if (!rentalsRes.ok)
                throw new Error(rentalsJson?.error ?? "Failed to fetch rentals.");
            setRentals(rentalsJson.listings ?? []);
        } catch (e: any) {
            setError(e?.message ?? "Something went wrong.");
        } finally {
            setLoading(false);
        }
    }

    const cityState = useMemo(() => {
        const city = avm?.subjectProperty?.city ?? property?.city;
        const state = avm?.subjectProperty?.state ?? property?.state;
        return city && state ? `${city}, ${state}` : "—";
    }, [avm, property]);

    console.log(initialFloorplans);

    return (
        <div className={styles.page}>
            <header className={styles.header}>
                <h1 className={styles.h1}>Admin Master</h1>
                <p className={styles.subhead}>
                    Enter address + owed amount, select floorplan (sqft only), then pull RentCast data.
                </p>
            </header>
            <div>
                <form
                    className={styles.form}
                    onSubmit={(e) => {
                        e.preventDefault();
                        void getApiData();
                    }}
                >
                    <div className={styles.formGrid}>
                        <div className={styles.field}>
                            <AddressAutocomplete
                                value={address}
                                onChange={(v) => setAddress(v)}
                                onResolved={(d) => {
                                    setAddress(d.formattedAddress);
                                    setLat(d.lat);
                                    setLng(d.lng);
                                }}
                            />
                        </div>

                        <div className={styles.field}>
                            <label className={styles.label}>How much is owed</label>
                            <input
                                className={styles.input}
                                value={owed}
                                onChange={(e) => setOwed(e.target.value)}
                                placeholder="$250,000"
                            />
                        </div>

                        <div className={styles.field} style={{ gridColumn: "1 / -1" }}>
                            <label className={styles.label}>Floorplan (sqft only)</label>
                            <select
                                className={styles.select}
                                value={floorplanId}
                                onChange={(e) => setFloorplanId(e.target.value)}
                            >
                                {floorplans.map((fp) => (
                                    <option key={fp._id} value={fp._id}>
                                        {fp.name} — {fp.sqft} sqft
                                    </option>
                                ))}
                            </select>

                            <p className={styles.note}>
                                Selected sqft:{" "}
                                <span className={styles.noteStrong}>
                                    {selectedFloorplan?.sqft ?? "—"}
                                </span>
                            </p>
                        </div>
                    </div>

                    <div className={styles.actions}>
                        <button className={styles.button} type="submit" disabled={loading}>
                            {loading ? "Loading…" : "Submit"}
                        </button>

                        {error ? <div className={styles.error}>{error}</div> : null}
                    </div>
                </form>
            </div>



            <InvestmentModelTable
                property={property}
                avm={avm}
                rentals={rentals}
                owed={owed}
                selectedFloorplan={selectedFloorplan}
                allFloorplans={floorplans}
            />

            <section className={styles.results}>
                <div style={{ display: "grid", gap: 14 }}>
                    <Card title="Deal Inputs">
                        <div className={styles.cardBody}>
                            <Row label="Address" value={(property?.formattedAddress ?? address) || "—"} />
                            <Row label="Owed" value={owed || "—"} />
                            <Row
                                label="Floorplan sqft"
                                value={selectedFloorplan ? `${selectedFloorplan.sqft} sqft` : "—"}
                            />
                            <Row label="City/State" value={cityState} />
                        </div>
                    </Card>

                    <Card title="Property Record">
                        <div className={styles.cardBody}>
                            <Row label="Type" value={property?.propertyType ?? "—"} />
                            <Row
                                label="Beds/Baths"
                                value={
                                    property?.bedrooms != null || property?.bathrooms != null
                                        ? `${property?.bedrooms ?? "—"} / ${property?.bathrooms ?? "—"}`
                                        : "—"
                                }
                            />
                            <Row
                                label="Main sqft"
                                value={property?.squareFootage ? `${num(property.squareFootage)} sqft` : "—"}
                            />
                            <Row label="Lot size" value={property?.lotSize ? `${num(property.lotSize)} sqft` : "—"} />
                            <Row label="Year built" value={property?.yearBuilt ? String(property.yearBuilt) : "—"} />
                            <Row label="Zoning" value={property?.zoning ?? "—"} />
                            <Row
                                label="Last sale"
                                value={property?.lastSaleDate ? new Date(property.lastSaleDate).toLocaleDateString() : "—"}
                            />
                            <Row label="Last sale price" value={money(property?.lastSalePrice)} />
                        </div>
                    </Card>
                </div>

                <div style={{ display: "grid", gap: 14 }}>
                    <Card title="Value Estimate (AVM)">
                        <div className={styles.cardBody}>
                            <Row label="Estimated value" value={money(avm?.price)} />
                            <Row
                                label="Range"
                                value={
                                    avm?.priceRangeLow != null && avm?.priceRangeHigh != null
                                        ? `${money(avm.priceRangeLow)} – ${money(avm.priceRangeHigh)}`
                                        : "—"
                                }
                            />
                            <Row
                                label="Subject sqft"
                                value={avm?.subjectProperty?.squareFootage ? `${num(avm.subjectProperty.squareFootage)} sqft` : "—"}
                            />
                            <Row label="Subject type" value={avm?.subjectProperty?.propertyType ?? "—"} />
                        </div>
                    </Card>

                    <Card title="Top Comparables">
                        <div className={styles.blockList}>
                            {(avm?.comparables ?? []).slice(0, 5).map((c, i) => (
                                <div key={i} className={styles.block}>
                                    <p className={styles.blockTitle}>{c.formattedAddress ?? "Comparable"}</p>

                                    <div className={styles.metaGrid}>
                                        <div className={styles.metaItem}>
                                            Price: <span className={styles.metaValue}>{money(c.price)}</span>
                                        </div>
                                        <div className={styles.metaItem}>
                                            Sqft:{" "}
                                            <span className={styles.metaValue}>
                                                {c.squareFootage ? num(c.squareFootage) : "—"}
                                            </span>
                                        </div>
                                        <div className={styles.metaItem}>
                                            Dist:{" "}
                                            <span className={styles.metaValue}>
                                                {typeof c.distance === "number" ? `${c.distance.toFixed(2)} mi` : "—"}
                                            </span>
                                        </div>
                                        <div className={styles.metaItem}>
                                            Match:{" "}
                                            <span className={styles.metaValue}>
                                                {typeof c.correlation === "number" ? c.correlation.toFixed(2) : "—"}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))}

                            {!avm?.comparables?.length ? (
                                <div className={styles.empty}>No comparables returned.</div>
                            ) : null}
                        </div>
                    </Card>
                </div>

                <div>
                    <Card title={`Rentals in ${cityState}`}>
                        <RentalsPanel rentals={rentals} />
                    </Card>

                </div>
            </section>

        </div>
    );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div className={styles.card}>
            <h2 className={styles.cardTitle}>{title}</h2>
            {children}
        </div>
    );
}

function Row({ label, value }: { label: string; value: string }) {
    return (
        <div className={styles.row}>
            <div className={styles.rowLabel}>{label}</div>
            <div className={styles.rowValue}>{value}</div>
        </div>
    );
}

function RentalsPanel({ rentals }: { rentals: RentalListing[] }) {
    const [showAll, setShowAll] = useState(false);
    const [onlyWithSqft, setOnlyWithSqft] = useState(true);
    const [hideOutliers, setHideOutliers] = useState(true);
    const [sort, setSort] = useState<"best" | "price_desc" | "price_asc" | "sqft_closest">("best");

    const valid = useMemo(() => {
        const items = rentals
            .filter((r) => typeof r.price === "number" && r.price! > 0)
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

        if (onlyWithSqft) items = items.filter((x) => typeof x.squareFootage === "number" && x.squareFootage! > 0);

        if (hideOutliers && p25p75.p25 != null && p25p75.p75 != null) {
            // gentle outlier trim (IQR-ish)
            const iqr = p25p75.p75 - p25p75.p25;
            const low = p25p75.p25 - 1.5 * iqr;
            const high = p25p75.p75 + 1.5 * iqr;
            items = items.filter((x) => x.price >= low && x.price <= high);
        }

        // sorting
        if (sort === "price_desc") items.sort((a, b) => b.price - a.price);
        if (sort === "price_asc") items.sort((a, b) => a.price - b.price);

        // "best" = closest to median first (nice scanning default)
        if (sort === "best" && median != null) items.sort((a, b) => Math.abs(a.price - median) - Math.abs(b.price - median));

        // sqft_closest requires we have sqft values—fallback to best if missing
        if (sort === "sqft_closest") {
            const target = medianSqft(items);
            if (target != null) items.sort((a, b) => Math.abs((a.squareFootage ?? 0) - target) - Math.abs((b.squareFootage ?? 0) - target));
            else if (median != null) items.sort((a, b) => Math.abs(a.price - median) - Math.abs(b.price - median));
        }

        return items;
    }, [valid, onlyWithSqft, hideOutliers, sort, median, p25p75.p25, p25p75.p75]);

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

            {/* Controls */}
            <div className={styles.rentalsControls}>
                <label className={styles.chip}>
                    <input
                        className={styles.chipInput}
                        type="checkbox"
                        checked={onlyWithSqft}
                        onChange={(e) => setOnlyWithSqft(e.target.checked)}
                    />
                    <span>Has sqft</span>
                </label>

                <label className={styles.chip}>
                    <input
                        className={styles.chipInput}
                        type="checkbox"
                        checked={hideOutliers}
                        onChange={(e) => setHideOutliers(e.target.checked)}
                    />
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

            {/* List */}
            <div className={styles.compList}>
                {visible.map((r, i) => (
                    <details key={`${r.formattedAddress ?? "r"}-${i}`} className={styles.compDetails}>
                        <summary className={styles.compRow}>
                            <div className={styles.compLeft}>
                                <div className={styles.compPrice}>{money(r.price)}</div>
                                <div className={styles.compSub}>
                                    {typeof r.squareFootage === "number" ? `${num(r.squareFootage)} sf` : "— sf"} •{" "}
                                    {r.bedrooms ?? "—"} bd / {r.bathrooms ?? "—"} ba
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

            {/* Show more */}
            {filtered.length > initialCount ? (
                <button type="button" className={styles.showMore} onClick={() => setShowAll((v) => !v)}>
                    {showAll ? "Show less" : `Show ${hiddenCount} more`}
                </button>
            ) : null}
        </div>
    );
}

function medianSqft(items: Array<{ squareFootage?: number }>) {
    const sq = items.map((x) => x.squareFootage).filter((n): n is number => typeof n === "number" && n > 0).sort((a, b) => a - b);
    if (!sq.length) return undefined;
    const mid = Math.floor(sq.length / 2);
    return sq.length % 2 ? sq[mid] : (sq[mid - 1] + sq[mid]) / 2;
}
