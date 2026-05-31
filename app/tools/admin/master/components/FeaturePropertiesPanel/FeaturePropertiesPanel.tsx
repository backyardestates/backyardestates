"use client";

import React, { useMemo, useState } from "react";
import type { SanityProperty } from "@/lib/store/presentationStore";
import s from "./FeaturePropertiesPanel.module.css";

interface Props {
    properties: SanityProperty[];
    selectedIds: string[];
    onChange: (ids: string[]) => void;
}

type SortKey = "name-asc" | "name-desc" | "sqft-desc" | "sqft-asc";

const SORTS: { key: SortKey; label: string }[] = [
    { key: "name-asc", label: "Name · A–Z" },
    { key: "name-desc", label: "Name · Z–A" },
    { key: "sqft-desc", label: "Largest first" },
    { key: "sqft-asc", label: "Smallest first" },
];

// Distinct, sorted numeric values (bed / bath / sqft) present in the data — so a
// filter option never offers a value that matches nothing.
function distinctNums(properties: SanityProperty[], key: "bed" | "bath" | "sqft"): number[] {
    const set = new Set<number>();
    for (const p of properties) {
        const v = p[key];
        if (typeof v === "number" && v > 0) set.add(v);
    }
    return Array.from(set).sort((a, b) => a - b);
}

function fmtNum(n: number): string {
    return Number.isInteger(n) ? String(n) : n.toFixed(1);
}

export function FeaturePropertiesPanel({ properties, selectedIds, onChange }: Props) {
    const [query, setQuery] = useState("");
    const [sort, setSort] = useState<SortKey>("name-asc");
    const [estateFilter, setEstateFilter] = useState<Set<string>>(new Set());
    const [bedsFilter, setBedsFilter] = useState<number | null>(null);
    const [bathsFilter, setBathsFilter] = useState<number | null>(null);
    const [sqftMin, setSqftMin] = useState<number | null>(null);
    const [sqftMax, setSqftMax] = useState<number | null>(null);
    const [selectedOnly, setSelectedOnly] = useState(false);

    // ── Filter option lists, derived from the data ────────────────────────────
    const estates = useMemo(() => {
        const set = new Set<string>();
        for (const p of properties) if (p.floorplanName?.trim()) set.add(p.floorplanName.trim());
        return Array.from(set).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
    }, [properties]);

    const bedOpts = useMemo(() => distinctNums(properties, "bed"), [properties]);
    const bathOpts = useMemo(() => distinctNums(properties, "bath"), [properties]);
    const sqftOpts = useMemo(() => distinctNums(properties, "sqft"), [properties]);
    const hasFeatured = useMemo(() => properties.some((p) => p.featured), [properties]);

    const anyFilter =
        query.trim() !== "" ||
        estateFilter.size > 0 ||
        bedsFilter !== null ||
        bathsFilter !== null ||
        sqftMin !== null ||
        sqftMax !== null ||
        selectedOnly;

    // ── Apply filters + sort ──────────────────────────────────────────────────
    const visible = useMemo(() => {
        const q = query.trim().toLowerCase();
        const out = properties.filter((p) => {
            if (selectedOnly && !selectedIds.includes(p._id)) return false;
            if (q && !p.name?.toLowerCase().includes(q)) return false;
            if (estateFilter.size > 0 && !(p.floorplanName && estateFilter.has(p.floorplanName.trim()))) return false;
            if (bedsFilter !== null && p.bed !== bedsFilter) return false;
            if (bathsFilter !== null && p.bath !== bathsFilter) return false;
            if (sqftMin !== null && (p.sqft ?? 0) < sqftMin) return false;
            if (sqftMax !== null && (p.sqft ?? Infinity) > sqftMax) return false;
            return true;
        });

        out.sort((a, b) => {
            switch (sort) {
                case "name-desc":
                    return (b.name ?? "").localeCompare(a.name ?? "");
                case "sqft-desc":
                    return (b.sqft ?? 0) - (a.sqft ?? 0);
                case "sqft-asc":
                    return (a.sqft ?? 0) - (b.sqft ?? 0);
                case "name-asc":
                default:
                    return (a.name ?? "").localeCompare(b.name ?? "");
            }
        });
        return out;
    }, [properties, selectedIds, query, estateFilter, bedsFilter, bathsFilter, sqftMin, sqftMax, selectedOnly, sort]);

    function toggle(id: string) {
        if (selectedIds.includes(id)) onChange(selectedIds.filter((x) => x !== id));
        else onChange([...selectedIds, id]);
    }

    function toggleEstate(name: string) {
        setEstateFilter((prev) => {
            const next = new Set(prev);
            if (next.has(name)) next.delete(name);
            else next.add(name);
            return next;
        });
    }

    function clearFilters() {
        setQuery("");
        setEstateFilter(new Set());
        setBedsFilter(null);
        setBathsFilter(null);
        setSqftMin(null);
        setSqftMax(null);
        setSelectedOnly(false);
    }

    if (properties.length === 0) {
        return (
            <div className={s.panel}>
                <div className={s.empty}>
                    <span className={s.emptyTitle}>No completed builds found in Sanity.</span>
                </div>
            </div>
        );
    }

    return (
        <div className={s.panel}>
            {/* ── Toolbar: search · selected toggle · sort ─────────────────── */}
            <div className={s.bar}>
                <div className={s.searchWrap}>
                    <svg
                        className={s.searchIcon}
                        width="16" height="16" viewBox="0 0 24 24" fill="none"
                        stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                        aria-hidden
                    >
                        <circle cx="11" cy="11" r="7" />
                        <path d="M21 21l-4.3-4.3" />
                    </svg>
                    <input
                        type="search"
                        className={s.search}
                        placeholder="Search builds by name…"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        aria-label="Search builds by name"
                    />
                    {query && (
                        <button
                            type="button"
                            className={s.searchClear}
                            onClick={() => setQuery("")}
                            aria-label="Clear search"
                        >
                            ✕
                        </button>
                    )}
                </div>

                {selectedIds.length > 0 && (
                    <button
                        type="button"
                        className={`${s.selToggle} ${selectedOnly ? s.selToggleOn : ""}`}
                        onClick={() => setSelectedOnly((v) => !v)}
                        aria-pressed={selectedOnly}
                        title="Show only the builds you've selected"
                    >
                        <span className={s.selDot} aria-hidden>✓</span>
                        {selectedIds.length} selected
                    </button>
                )}

                <label className={s.sortWrap}>
                    <span className={s.sortLabel}>Sort</span>
                    <select
                        className={s.select}
                        value={sort}
                        onChange={(e) => setSort(e.target.value as SortKey)}
                        aria-label="Sort builds"
                    >
                        {SORTS.map((o) => (
                            <option key={o.key} value={o.key}>{o.label}</option>
                        ))}
                    </select>
                </label>
            </div>

            {/* ── Filters ──────────────────────────────────────────────────── */}
            <div className={s.filters}>
                {estates.length > 0 && (
                    <div className={s.fgroup}>
                        <span className={s.fLabel}>Estate</span>
                        <div className={s.chips} role="group" aria-label="Filter by estate">
                            {estates.map((name) => {
                                const on = estateFilter.has(name);
                                return (
                                    <button
                                        key={name}
                                        type="button"
                                        className={`${s.chip} ${on ? s.chipOn : ""}`}
                                        onClick={() => toggleEstate(name)}
                                        aria-pressed={on}
                                    >
                                        {name}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}

                {bedOpts.length > 0 && (
                    <div className={s.fgroup}>
                        <span className={s.fLabel}>Beds</span>
                        <div className={s.seg} role="radiogroup" aria-label="Filter by beds">
                            <button
                                type="button" role="radio" aria-checked={bedsFilter === null}
                                className={`${s.segBtn} ${bedsFilter === null ? s.segBtnOn : ""}`}
                                onClick={() => setBedsFilter(null)}
                            >
                                Any
                            </button>
                            {bedOpts.map((n) => (
                                <button
                                    key={n} type="button" role="radio" aria-checked={bedsFilter === n}
                                    className={`${s.segBtn} ${bedsFilter === n ? s.segBtnOn : ""}`}
                                    onClick={() => setBedsFilter(bedsFilter === n ? null : n)}
                                >
                                    {fmtNum(n)}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {bathOpts.length > 0 && (
                    <div className={s.fgroup}>
                        <span className={s.fLabel}>Baths</span>
                        <div className={s.seg} role="radiogroup" aria-label="Filter by baths">
                            <button
                                type="button" role="radio" aria-checked={bathsFilter === null}
                                className={`${s.segBtn} ${bathsFilter === null ? s.segBtnOn : ""}`}
                                onClick={() => setBathsFilter(null)}
                            >
                                Any
                            </button>
                            {bathOpts.map((n) => (
                                <button
                                    key={n} type="button" role="radio" aria-checked={bathsFilter === n}
                                    className={`${s.segBtn} ${bathsFilter === n ? s.segBtnOn : ""}`}
                                    onClick={() => setBathsFilter(bathsFilter === n ? null : n)}
                                >
                                    {fmtNum(n)}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {sqftOpts.length > 1 && (
                    <div className={s.fgroup}>
                        <span className={s.fLabel}>Sqft</span>
                        <div className={s.range}>
                            <select
                                className={s.select}
                                value={sqftMin ?? ""}
                                onChange={(e) => setSqftMin(e.target.value ? Number(e.target.value) : null)}
                                aria-label="Minimum square footage"
                            >
                                <option value="">Min</option>
                                {sqftOpts.map((n) => (
                                    <option key={n} value={n} disabled={sqftMax !== null && n > sqftMax}>
                                        {n.toLocaleString()}
                                    </option>
                                ))}
                            </select>
                            <span className={s.rangeDash} aria-hidden>–</span>
                            <select
                                className={s.select}
                                value={sqftMax ?? ""}
                                onChange={(e) => setSqftMax(e.target.value ? Number(e.target.value) : null)}
                                aria-label="Maximum square footage"
                            >
                                <option value="">Max</option>
                                {sqftOpts.map((n) => (
                                    <option key={n} value={n} disabled={sqftMin !== null && n < sqftMin}>
                                        {n.toLocaleString()}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                )}
            </div>

            {/* ── Result summary ───────────────────────────────────────────── */}
            <div className={s.summary}>
                <span className={s.resultCount}>
                    {visible.length} build{visible.length === 1 ? "" : "s"}
                    {selectedIds.length > 0 && !selectedOnly && (
                        <span className={s.resultSub}> · {selectedIds.length} selected</span>
                    )}
                </span>
                <div className={s.summaryActions}>
                    {hasFeatured && (
                        <button
                            type="button"
                            className={s.linkBtn}
                            onClick={() => onChange(properties.filter((p) => p.featured).map((p) => p._id))}
                            title="Select the builds marked “featured” in Sanity"
                        >
                            Use Sanity featured
                        </button>
                    )}
                    {selectedIds.length > 0 && (
                        <button type="button" className={s.linkBtn} onClick={() => onChange([])}>
                            Clear selection
                        </button>
                    )}
                    {anyFilter && (
                        <button type="button" className={s.linkBtn} onClick={clearFilters}>
                            Clear filters
                        </button>
                    )}
                </div>
            </div>

            {/* ── Grid ─────────────────────────────────────────────────────── */}
            {visible.length === 0 ? (
                <div className={s.empty}>
                    <span className={s.emptyTitle}>No builds match your filters</span>
                    <button type="button" className={s.linkBtn} onClick={clearFilters}>
                        Clear filters
                    </button>
                </div>
            ) : (
                <div className={s.grid}>
                    {visible.map((p) => {
                        const isSelected = selectedIds.includes(p._id);
                        const order = isSelected ? selectedIds.indexOf(p._id) + 1 : 0;
                        const metaBits = [
                            p.bed ? `${fmtNum(p.bed)} bd` : null,
                            p.bath ? `${fmtNum(p.bath)} ba` : null,
                            p.sqft ? `${p.sqft.toLocaleString()} sqft` : null,
                        ].filter(Boolean) as string[];
                        const aria = [p.name, p.floorplanName, ...metaBits].filter(Boolean).join(", ");
                        return (
                            <button
                                key={p._id}
                                type="button"
                                className={`${s.card} ${isSelected ? s.cardSelected : ""}`}
                                onClick={() => toggle(p._id)}
                                aria-pressed={isSelected}
                                aria-label={`${isSelected ? "Selected" : "Select"} ${aria}`}
                            >
                                <div className={s.thumbWrap}>
                                    {p.thumbnailUrl ? (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img src={p.thumbnailUrl} alt="" className={s.thumb} loading="lazy" />
                                    ) : (
                                        <div className={s.thumbPlaceholder} aria-hidden>No image</div>
                                    )}
                                    {p.floorplanName && <span className={s.estateBadge}>{p.floorplanName}</span>}
                                    <span className={`${s.check} ${isSelected ? s.checkOn : ""}`} aria-hidden>
                                        {order > 0 ? (
                                            <span className={s.checkNum}>{order}</span>
                                        ) : (
                                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M20 6L9 17l-5-5" />
                                            </svg>
                                        )}
                                    </span>
                                </div>
                                <div className={s.cardBody}>
                                    <span className={s.name}>{p.name}</span>
                                    {metaBits.length > 0 && (
                                        <span className={s.metaStats}>
                                            {metaBits.map((b, i) => (
                                                <React.Fragment key={b}>
                                                    {i > 0 && <span className={s.metaDot} aria-hidden>·</span>}
                                                    <span>{b}</span>
                                                </React.Fragment>
                                            ))}
                                        </span>
                                    )}
                                </div>
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
