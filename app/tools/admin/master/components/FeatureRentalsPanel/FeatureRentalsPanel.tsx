"use client";

import React, { useEffect, useMemo, useState } from "react";
import type { RentalListing } from "@/lib/rentcast/types";
import type { FeaturedRental } from "@/lib/store/presentationStore";
import { proxiedImage } from "@/lib/cloudinary";
import s from "./FeatureRentalsPanel.module.css";

interface Props {
    rentals: RentalListing[];
    selected: FeaturedRental[];
    onChange: (next: FeaturedRental[]) => void;
    maxSelected?: number;
    /** When false, hides the left "Available" column — used in the merged
     *  Rental Market step where the comps list already provides ★ Feature
     *  toggles, so this panel only renders the order + photo editor. */
    showAvailable?: boolean;
}

function rentalKey(r: Pick<FeaturedRental, "formattedAddress" | "price" | "squareFootage" | "bedrooms" | "bathrooms">) {
    return [
        (r.formattedAddress ?? "").trim().toLowerCase(),
        r.price ?? "",
        r.squareFootage ?? "",
        r.bedrooms ?? "",
        r.bathrooms ?? "",
    ].join("|");
}

function zillowSearchUrl(address: string) {
    const q = encodeURIComponent(`site:zillow.com ${address}`);
    return `https://www.google.com/search?q=${q}`;
}

function money(n?: number) {
    return typeof n === "number" ? `$${n.toLocaleString()}` : "—";
}

function specsLine(r: { bedrooms?: number; bathrooms?: number; squareFootage?: number }) {
    return [
        r.bedrooms != null ? `${r.bedrooms} bd` : null,
        r.bathrooms != null ? `${r.bathrooms} ba` : null,
        r.squareFootage != null ? `${r.squareFootage.toLocaleString()} sqft` : null,
    ].filter(Boolean).join(" · ") || "—";
}

function toFeatured(r: RentalListing): FeaturedRental {
    return {
        formattedAddress: r.formattedAddress,
        price: r.price,
        bedrooms: r.bedrooms,
        bathrooms: r.bathrooms,
        squareFootage: r.squareFootage,
        propertyType: r.propertyType,
        listedDate: r.listedDate,
        lastSeenDate: r.lastSeenDate,
    };
}

type FetchState = {
    loading: boolean;
    images: string[];
    source?: "property" | "search" | null;
    matchedType?: string | null;
    error?: string;
};

type ManualUrlState = Record<string, string>;

export function FeatureRentalsPanel({ rentals, selected, onChange, maxSelected = 4, showAvailable = true }: Props) {
    const selectedKeys = useMemo(() => new Set(selected.map(rentalKey)), [selected]);

    // Per-row Zillow fetch state, keyed by the rental composite key.
    const [fetchState, setFetchState] = useState<Record<string, FetchState>>({});
    const [manualUrls, setManualUrls] = useState<ManualUrlState>({});

    // Latest props via refs so async photo uploads can update by KEY after
    // awaits without clobbering concurrent edits to other rows.
    const selectedRef = React.useRef(selected);
    selectedRef.current = selected;
    const onChangeRef = React.useRef(onChange);
    onChangeRef.current = onChange;

    function setImageUrlByKey(key: string, imageUrl: string) {
        const cur = selectedRef.current;
        const idx = cur.findIndex((r) => rentalKey(r) === key);
        if (idx === -1) return;
        const copy = [...cur];
        copy[idx] = { ...copy[idx], imageUrl: imageUrl || undefined };
        onChangeRef.current(copy);
    }

    // Re-host a picked photo on Cloudinary so it survives Zillow's CDN URLs
    // expiring (saved proposals reopened weeks later had broken photos).
    // Falls back to the raw URL if the upload fails — same behavior as before.
    async function persistImage(key: string, rawUrl: string) {
        setImageUrlByKey(key, rawUrl); // show immediately
        if (!/^https?:\/\//i.test(rawUrl) || rawUrl.includes("res.cloudinary.com")) return;
        try {
            const res = await fetch("/api/admin/rental-photo", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ url: rawUrl }),
            });
            const data = (await res.json().catch(() => ({}))) as { url?: string };
            if (res.ok && data.url && data.url !== rawUrl) {
                setImageUrlByKey(key, data.url);
            }
        } catch {
            /* keep the raw URL — proxiedImage still renders it while it lives */
        }
    }

    async function fetchFromZillow(idx: number, zillowUrl?: string, opts?: { replaceImage?: boolean }) {
        const r = selected[idx];
        if (!r) return;
        if (!r.formattedAddress && !zillowUrl) return;
        const key = rentalKey(r);
        setFetchState((prev) => ({ ...prev, [key]: { loading: true, images: [] } }));
        try {
            const params = new URLSearchParams();
            if (r.formattedAddress) params.set("address", r.formattedAddress);
            if (zillowUrl) params.set("url", zillowUrl);
            const res = await fetch(`/api/hasdata/zillow-photos?${params.toString()}`);
            const data = await res.json();
            if (!res.ok) {
                setFetchState((prev) => ({
                    ...prev,
                    [key]: { loading: false, images: [], error: data?.error ?? `HTTP ${res.status}` },
                }));
                return;
            }
            const images: string[] = Array.isArray(data.images) ? data.images : [];
            const source: "property" | "search" | null = data.source ?? null;
            const matchedType: string | null = data.matchedType ?? null;
            const attempts: any[] = data?.meta?.attempts ?? [];
            const triedSummary = attempts
                .map((a) =>
                    a.kind === "property"
                        ? `property(${a.imageCount ?? 0})`
                        : `${a.type}(${a.upstreamCount ?? 0})`
                )
                .join(", ");
            setFetchState((prev) => ({
                ...prev,
                [key]: {
                    loading: false,
                    images,
                    source,
                    matchedType,
                    error: images.length === 0
                        ? `No photos found. Tried: ${triedSummary}`.trim()
                        : undefined,
                },
            }));
            // Auto-pick the first image if none chosen yet (or when replacing a
            // dead legacy URL after an onError self-heal). Persisted via
            // Cloudinary so the photo survives Zillow CDN expiry.
            if (images.length > 0 && (!r.imageUrl || opts?.replaceImage)) {
                void persistImage(key, images[0]);
            }
        } catch (err) {
            setFetchState((prev) => ({
                ...prev,
                [key]: {
                    loading: false,
                    images: [],
                    error: err instanceof Error ? err.message : "Network error",
                },
            }));
        }
    }

    // Auto-fetch a Zillow photo the moment a rental is featured — when it has no
    // image yet and we haven't already tried. The same loading + Try-again UI as
    // a manual fetch is shown, so a failed auto-attempt can be retried by hand.
    useEffect(() => {
        for (let i = 0; i < selected.length; i++) {
            const r = selected[i];
            const key = rentalKey(r);
            if (!r.imageUrl && r.formattedAddress && !fetchState[key]) {
                void fetchFromZillow(i);
            }
        }
        // Intentionally keyed on `selected` only — fetchState guards re-runs.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selected]);

    const available = useMemo(() => {
        return rentals.filter((r) => typeof r.price === "number" && !selectedKeys.has(rentalKey(r)));
    }, [rentals, selectedKeys]);

    const atLimit = selected.length >= maxSelected;

    function add(r: RentalListing) {
        if (atLimit) return;
        onChange([...selected, toFeatured(r)]);
    }

    function remove(idx: number) {
        onChange(selected.filter((_, i) => i !== idx));
    }

    function move(idx: number, dir: -1 | 1) {
        const next = idx + dir;
        if (next < 0 || next >= selected.length) return;
        const copy = [...selected];
        [copy[idx], copy[next]] = [copy[next], copy[idx]];
        onChange(copy);
    }

    function setImageUrl(idx: number, imageUrl: string) {
        const copy = [...selected];
        copy[idx] = { ...copy[idx], imageUrl: imageUrl || undefined };
        onChange(copy);
    }

    function clear() {
        onChange([]);
    }

    if (rentals.length === 0) {
        return (
            <div className={s.panel}>
                <div className={s.empty}>
                    No rental comps yet. Add a property address and pull property data first.
                </div>
            </div>
        );
    }

    return (
        <div>
            <div className={`${s.panel} ${!showAvailable ? s.panelSolo : ""}`}>
                {showAvailable && (
                <div className={s.column}>
                    <div className={s.columnHeader}>
                        <span className={s.columnTitle}>Available · {available.length}</span>
                        <span className={s.columnHint}>
                            {atLimit ? "Limit reached" : "Click + to feature"}
                        </span>
                    </div>
                    <div className={s.list}>
                        {available.length === 0 ? (
                            <div className={s.listEmpty}>All rentals featured.</div>
                        ) : (
                            available.map((r) => (
                                <div key={rentalKey(r)} className={s.availItem}>
                                    <div className={s.availMain}>
                                        <span className={s.price}>
                                            {money(r.price)}<span className={s.priceMo}>/ mo</span>
                                        </span>
                                        <span className={s.addr}>{r.formattedAddress ?? "Listing"}</span>
                                        <span className={s.specs}>{specsLine(r)}</span>
                                    </div>
                                    <div className={s.actions}>
                                        <button
                                            type="button"
                                            className={`${s.iconBtn} ${s.iconBtnAdd}`}
                                            onClick={() => add(r)}
                                            disabled={atLimit}
                                            aria-label="Feature this rental"
                                            title={atLimit ? "Max 4 featured" : "Feature"}
                                        >
                                            +
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
                )}

                <div className={s.column}>
                    <div className={s.columnHeader}>
                        <span className={s.columnTitle}>Slide 10 order · {selected.length}</span>
                        <span className={s.limitChip}>Max {maxSelected}</span>
                    </div>
                    <div className={`${s.list} ${s.listFeatured}`}>
                        {selected.length === 0 ? (
                            <div className={s.listEmpty}>
                                Nothing featured yet — use <strong>★ Feature</strong> on a comp above to
                                add it here. Otherwise the slide shows the first {maxSelected} rentals from RentCast.
                            </div>
                        ) : (
                            selected.map((r, i) => (
                                <div key={rentalKey(r)} className={s.selectedItem}>
                                    <div className={s.selectedHead}>
                                        <span className={s.order}>{i + 1}</span>
                                        <div className={s.selectedMain}>
                                            <span className={s.price}>
                                                {money(r.price)}<span className={s.priceMo}>/ mo</span>
                                            </span>
                                            <span className={s.addr}>{r.formattedAddress ?? "Listing"}</span>
                                            <span className={s.specs}>{specsLine(r)}</span>
                                        </div>
                                        <div className={s.actions}>
                                            <button
                                                type="button"
                                                className={s.iconBtn}
                                                onClick={() => move(i, -1)}
                                                disabled={i === 0}
                                                aria-label="Move up"
                                                title="Move up"
                                            >
                                                ↑
                                            </button>
                                            <button
                                                type="button"
                                                className={s.iconBtn}
                                                onClick={() => move(i, 1)}
                                                disabled={i === selected.length - 1}
                                                aria-label="Move down"
                                                title="Move down"
                                            >
                                                ↓
                                            </button>
                                            <button
                                                type="button"
                                                className={`${s.iconBtn} ${s.iconBtnRemove}`}
                                                onClick={() => remove(i)}
                                                aria-label="Remove"
                                                title="Remove"
                                            >
                                                ×
                                            </button>
                                        </div>
                                    </div>

                                    <div className={s.imageRow}>
                                        <div className={s.imageWrap}>
                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                            <img
                                                src={r.imageUrl ? proxiedImage(r.imageUrl) : "/images/rental-placeholder.svg"}
                                                alt=""
                                                className={s.imagePreview}
                                                referrerPolicy="no-referrer"
                                                onError={(e) => {
                                                    const img = e.currentTarget as HTMLImageElement;
                                                    if (img.src.endsWith("/images/rental-placeholder.svg")) return;
                                                    img.src = "/images/rental-placeholder.svg";
                                                    // Legacy snapshots stored raw Zillow CDN URLs that
                                                    // expire — self-heal by refetching fresh photos and
                                                    // re-hosting the pick on Cloudinary.
                                                    const key = rentalKey(r);
                                                    if (r.imageUrl && r.formattedAddress && !fetchState[key]) {
                                                        void fetchFromZillow(i, undefined, { replaceImage: true });
                                                    }
                                                }}
                                            />
                                            {fetchState[rentalKey(r)]?.loading && (
                                                <div className={s.imageOverlay}>
                                                    <span className={s.spinner} aria-hidden />
                                                    <span>Loading from Zillow…</span>
                                                </div>
                                            )}
                                            {!fetchState[rentalKey(r)]?.loading &&
                                                fetchState[rentalKey(r)]?.error &&
                                                !r.imageUrl && (
                                                    <button
                                                        type="button"
                                                        className={s.imageRetry}
                                                        onClick={() => {
                                                            const manual = (manualUrls[rentalKey(r)] ?? "").trim();
                                                            fetchFromZillow(i, manual || undefined);
                                                        }}
                                                        title="Retry fetching from Zillow"
                                                    >
                                                        <span className={s.imageRetryIcon} aria-hidden>↻</span>
                                                        <span>Couldn&apos;t load — try again</span>
                                                    </button>
                                                )}
                                        </div>
                                        <div className={s.imageControls}>
                                            <input
                                                type="url"
                                                className={s.imageInput}
                                                placeholder="Paste image URL (e.g. from Zillow)"
                                                value={r.imageUrl ?? ""}
                                                onChange={(e) => setImageUrl(i, e.target.value)}
                                                onBlur={(e) => {
                                                    // Re-host pasted URLs on Cloudinary once the rep
                                                    // is done typing (not per keystroke).
                                                    const v = e.target.value.trim();
                                                    if (v) void persistImage(rentalKey(r), v);
                                                }}
                                            />
                                            <input
                                                type="url"
                                                className={s.imageInput}
                                                placeholder="Or paste Zillow listing URL → click Fetch"
                                                value={manualUrls[rentalKey(r)] ?? ""}
                                                onChange={(e) =>
                                                    setManualUrls((prev) => ({ ...prev, [rentalKey(r)]: e.target.value }))
                                                }
                                            />
                                            <div className={s.imageButtons}>
                                                <button
                                                    type="button"
                                                    className={s.fetchBtn}
                                                    onClick={() => {
                                                        const manual = (manualUrls[rentalKey(r)] ?? "").trim();
                                                        fetchFromZillow(i, manual || undefined);
                                                    }}
                                                    disabled={fetchState[rentalKey(r)]?.loading}
                                                >
                                                    {fetchState[rentalKey(r)]?.loading
                                                        ? "Fetching…"
                                                        : fetchState[rentalKey(r)]?.error
                                                          ? "↻ Try again"
                                                          : "↓ Fetch from Zillow"}
                                                </button>
                                                {r.formattedAddress && (
                                                    <a
                                                        href={zillowSearchUrl(r.formattedAddress)}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className={s.zillowBtn}
                                                    >
                                                        ↗ Search
                                                    </a>
                                                )}
                                                {r.imageUrl && (
                                                    <button
                                                        type="button"
                                                        className={s.clearBtn}
                                                        onClick={() => setImageUrl(i, "")}
                                                    >
                                                        Clear image
                                                    </button>
                                                )}
                                            </div>
                                            {fetchState[rentalKey(r)]?.error && (
                                                <div className={s.fetchError}>
                                                    {fetchState[rentalKey(r)]!.error}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {fetchState[rentalKey(r)]?.images && fetchState[rentalKey(r)]!.images.length > 0 && (
                                        <div className={s.gallery}>
                                            <div className={s.galleryHead}>
                                                <span className={s.galleryCount}>
                                                    {fetchState[rentalKey(r)]!.images.length} photo
                                                    {fetchState[rentalKey(r)]!.images.length === 1 ? "" : "s"} from Zillow
                                                </span>
                                                {fetchState[rentalKey(r)]!.source === "property" && (
                                                    <span className={s.galleryTag}>property</span>
                                                )}
                                                {fetchState[rentalKey(r)]!.source === "search" &&
                                                    fetchState[rentalKey(r)]!.matchedType && (
                                                        <span className={s.galleryTag}>
                                                            {fetchState[rentalKey(r)]!.matchedType}
                                                        </span>
                                                    )}
                                            </div>
                                            <div className={s.thumbStrip}>
                                                {fetchState[rentalKey(r)]!.images.map((thumb) => (
                                                    <button
                                                        key={thumb}
                                                        type="button"
                                                        className={`${s.thumbBtn} ${r.imageUrl === thumb ? s.thumbBtnActive : ""}`}
                                                        onClick={() => void persistImage(rentalKey(r), thumb)}
                                                        title="Use this photo"
                                                    >
                                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                                        <img
                                                            src={proxiedImage(thumb)}
                                                            alt=""
                                                            className={s.thumbBtnImg}
                                                            referrerPolicy="no-referrer"
                                                        />
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            <div className={s.toolbar}>
                <button
                    type="button"
                    className={s.textBtn}
                    onClick={clear}
                    disabled={selected.length === 0}
                >
                    Clear selection
                </button>
            </div>
        </div>
    );
}
