"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { loadGoogleMaps } from "@/lib/googleMaps/loadGoogleMaps";
import styles from "./AddressAutocomplete.module.css";

type Prediction = google.maps.places.AutocompletePrediction;

function useDebounced<T>(value: T, delay = 180) {
    const [debounced, setDebounced] = useState(value);
    useEffect(() => {
        const t = window.setTimeout(() => setDebounced(value), delay);
        return () => window.clearTimeout(t);
    }, [value, delay]);
    return debounced;
}

export function AddressAutocomplete({
    value,
    onChange,
    onResolved,
    label = "Property Address",
    placeholder = "Start typing an address…",
}: {
    value: string;
    onChange: (v: string) => void;
    onResolved?: (d: { formattedAddress: string; lat: number | null; lng: number | null; placeId?: string }) => void;
    label?: string;
    placeholder?: string;
}) {
    const [mapsReady, setMapsReady] = useState(false);
    const [mapsError, setMapsError] = useState<string | null>(null);

    const [open, setOpen] = useState(false);
    const [loadingPredictions, setLoadingPredictions] = useState(false);
    const [predictions, setPredictions] = useState<Prediction[]>([]);
    const [activeIndex, setActiveIndex] = useState(-1);

    const rootRef = useRef<HTMLDivElement | null>(null);
    const inputRef = useRef<HTMLInputElement | null>(null);

    const acServiceRef = useRef<google.maps.places.AutocompleteService | null>(null);
    const placeServiceRef = useRef<google.maps.places.PlacesService | null>(null);

    const apiKey = useMemo(
        () => process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "",
        []
    );

    const debouncedValue = useDebounced(value, 180);
    const MAX_RESULTS = 4;

    // 1) Load Maps + Places
    useEffect(() => {
        let cancelled = false;

        (async () => {
            try {
                if (!apiKey) throw new Error("Missing NEXT_PUBLIC_GOOGLE_MAPS_API_KEY");
                await loadGoogleMaps({ apiKey });
                if (cancelled) return;

                await google.maps.importLibrary("places");
                if (cancelled) return;

                acServiceRef.current = new google.maps.places.AutocompleteService();

                const dummy = document.createElement("div");
                placeServiceRef.current = new google.maps.places.PlacesService(dummy);

                setMapsReady(true);
            } catch (e: any) {
                if (cancelled) return;
                setMapsError(e?.message ?? "Failed to load Google Maps");
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [apiKey]);

    // 2) Predictions
    useEffect(() => {
        let cancelled = false;

        if (!mapsReady) return;
        if (!acServiceRef.current) return;

        const q = (debouncedValue ?? "").trim();
        if (q.length < 3) {
            setPredictions([]);
            setLoadingPredictions(false);
            setActiveIndex(-1);
            return;
        }

        setLoadingPredictions(true);

        acServiceRef.current.getPlacePredictions(
            {
                input: q,
                types: ["address"],
                componentRestrictions: { country: "us" },
            },
            (res, status) => {
                if (cancelled) return;

                setLoadingPredictions(false);

                if (status !== google.maps.places.PlacesServiceStatus.OK || !res?.length) {
                    setPredictions([]);
                    setActiveIndex(-1);
                    return;
                }

                setPredictions(res);
                setActiveIndex(-1);
            }
        );

        return () => {
            cancelled = true;
        };
    }, [debouncedValue, mapsReady]);

    // 3) Close on outside click
    useEffect(() => {
        const onDown = (e: MouseEvent) => {
            if (!rootRef.current) return;
            if (!rootRef.current.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener("mousedown", onDown);
        return () => document.removeEventListener("mousedown", onDown);
    }, []);

    const showPanel = open && (loadingPredictions || predictions.length > 0);

    async function selectPrediction(p: Prediction) {
        setOpen(false);
        setPredictions([]);
        setActiveIndex(-1);

        const display = p.description ?? "";
        onChange(display);

        const ps = placeServiceRef.current;
        if (!ps) return;

        ps.getDetails(
            {
                placeId: p.place_id,
                fields: ["formatted_address", "geometry"],
            },
            (place, status) => {
                if (status !== google.maps.places.PlacesServiceStatus.OK || !place) return;

                const formatted = place.formatted_address ?? display;
                const lat = place.geometry?.location?.lat();
                const lng = place.geometry?.location?.lng();

                onChange(formatted);

                onResolved?.({
                    formattedAddress: formatted,
                    lat: typeof lat === "number" ? lat : null,
                    lng: typeof lng === "number" ? lng : null,
                    placeId: p.place_id,
                });
            }
        );
    }

    function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
        if (!open && (e.key === "ArrowDown" || e.key === "ArrowUp")) {
            setOpen(true);
            return;
        }

        if (e.key === "Escape") {
            setOpen(false);
            return;
        }

        if (!predictions.length) return;

        const visibleCount = Math.min(predictions.length, MAX_RESULTS);

        if (e.key === "ArrowDown") {
            e.preventDefault();
            setOpen(true);
            setActiveIndex((i) => Math.min(i + 1, visibleCount - 1));
            return;
        }

        if (e.key === "ArrowUp") {
            e.preventDefault();
            setActiveIndex((i) => Math.max(i - 1, 0));
            return;
        }

        if (e.key === "Enter") {
            if (activeIndex >= 0 && activeIndex < visibleCount) {
                e.preventDefault();
                void selectPrediction(predictions[activeIndex]);
            }
        }
    }

    return (
        <div className={styles.autocompleteRoot} ref={rootRef}>
            <label className={styles.label}>{label}</label>

            <input
                ref={inputRef}
                className={styles.input}
                value={value}
                onChange={(e) => {
                    onChange(e.target.value);
                    setOpen(true);
                }}
                onFocus={() => setOpen(true)}
                onKeyDown={onKeyDown}
                placeholder={mapsReady ? placeholder : "Loading address search…"}
                autoComplete="street-address"
                aria-autocomplete="list"
                aria-expanded={showPanel}
                aria-controls="address-suggestions"
            />

            {mapsError ? (
                <div className={styles.inlineWarn}>
                    Autocomplete unavailable: <b>{mapsError}</b> — you can still type the address manually.
                </div>
            ) : null}

            {showPanel ? (
                <div id="address-suggestions" className={styles.suggestions} role="listbox">
                    {loadingPredictions ? (
                        <div className={styles.suggestionHint}>Searching…</div>
                    ) : null}

                    {!loadingPredictions && predictions.length === 0 ? (
                        <div className={styles.suggestionHint}>No matches yet — keep typing.</div>
                    ) : null}

                    {predictions.slice(0, MAX_RESULTS).map((p, idx) => {
                        const active = idx === activeIndex;
                        return (
                            <button
                                key={p.place_id}
                                type="button"
                                className={active ? styles.suggestionActive : styles.suggestion}
                                role="option"
                                aria-selected={active}
                                onMouseEnter={() => setActiveIndex(idx)}
                                onMouseDown={(e) => e.preventDefault()} // keep input focused
                                onClick={() => void selectPrediction(p)}
                            >
                                <div className={styles.suggestionMain}>
                                    {p.structured_formatting?.main_text ?? p.description}
                                </div>
                                <div className={styles.suggestionSub}>
                                    {p.structured_formatting?.secondary_text ?? ""}
                                </div>
                            </button>
                        );
                    })}
                </div>
            ) : null}
        </div >
    );
}
