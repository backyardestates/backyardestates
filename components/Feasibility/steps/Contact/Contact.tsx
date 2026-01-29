"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useAnswersStore } from "@/lib/feasibility/stores/answers.store";
import { loadGoogleMaps } from "@/lib/googleMaps/loadGoogleMaps";
import styles from "./Contact.module.css";

function digitsOnly(s: string) {
    return s.replace(/\D/g, "");
}

function formatPhoneUS(input: string) {
    const d = digitsOnly(input).slice(0, 10);
    if (d.length <= 3) return d;
    if (d.length <= 6) return `(${d.slice(0, 3)}) ${d.slice(3)}`;
    return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
}

type Prediction = google.maps.places.AutocompletePrediction;

function useDebounced<T>(value: T, delay = 180) {
    const [debounced, setDebounced] = useState(value);
    useEffect(() => {
        const t = window.setTimeout(() => setDebounced(value), delay);
        return () => window.clearTimeout(t);
    }, [value, delay]);
    return debounced;
}

export default function ContactStep() {
    const answers = useAnswersStore((s) => s.answers);
    const setAnswer = useAnswersStore((s) => s.setAnswer);

    const [mapsReady, setMapsReady] = useState(false);
    const [mapsError, setMapsError] = useState<string | null>(null);

    // Autocomplete state
    const [open, setOpen] = useState(false);
    const [loadingPredictions, setLoadingPredictions] = useState(false);
    const [predictions, setPredictions] = useState<Prediction[]>([]);
    const [activeIndex, setActiveIndex] = useState(-1);

    const rootRef = useRef<HTMLDivElement | null>(null);
    const addressInputRef = useRef<HTMLInputElement | null>(null);

    // Services (created once after maps loads)
    const acServiceRef = useRef<google.maps.places.AutocompleteService | null>(null);
    const placeServiceRef = useRef<google.maps.places.PlacesService | null>(null);

    const apiKey = useMemo(() => process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "", []);

    const name = (answers.name as string) ?? "";
    const email = (answers.email as string) ?? "";
    const phone = (answers.phone as string) ?? "";
    const address = (answers.address as string) ?? "";

    const debouncedAddress = useDebounced(address, 180);

    const MAX_RESULTS = 3;

    // 1) Load Google Maps script
    useEffect(() => {
        let cancelled = false;

        (async () => {
            try {
                if (!apiKey) throw new Error("Missing NEXT_PUBLIC_GOOGLE_MAPS_API_KEY");
                await loadGoogleMaps({ apiKey }); // ensure this loads Maps JS
                if (cancelled) return;

                // Load places library (modern loader)
                await google.maps.importLibrary("places");
                if (cancelled) return;

                // Init services
                acServiceRef.current = new google.maps.places.AutocompleteService();

                // PlacesService needs an HTML element (can be detached)
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

    // 2) Fetch predictions (debounced)
    useEffect(() => {
        let cancelled = false;

        (async () => {
            if (!mapsReady) return;
            if (!acServiceRef.current) return;

            const q = (debouncedAddress ?? "").trim();

            // Don't query for very short input
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
        })();

        return () => {
            cancelled = true;
        };
    }, [debouncedAddress, mapsReady]);

    // 3) Close on outside click
    useEffect(() => {
        const onDown = (e: MouseEvent) => {
            if (!rootRef.current) return;
            if (!rootRef.current.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener("mousedown", onDown);
        return () => document.removeEventListener("mousedown", onDown);
    }, []);

    async function selectPrediction(p: Prediction) {
        try {
            setOpen(false);
            setPredictions([]);
            setActiveIndex(-1);

            // Update the input immediately with the primary text
            const display = p.description ?? "";
            setAnswer("address", display);

            const ps = placeServiceRef.current;
            if (!ps) return;

            // Fetch details
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

                    setAnswer("address", formatted);
                    setAnswer("lat", typeof lat === "number" ? lat : null);
                    setAnswer("lng", typeof lng === "number" ? lng : null);
                }
            );
        } catch {
            // no-op
        }
    }

    function onAddressKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
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
            const visibleCount = Math.min(predictions.length, MAX_RESULTS);

            if (activeIndex >= 0 && activeIndex < visibleCount) {
                e.preventDefault();
                void selectPrediction(predictions[activeIndex]);
            }
        }
    }

    const showPanel = open && (predictions.length > 0 || loadingPredictions);

    return (
        <div className={styles.wrap}>
            <div className={styles.card}>
                <div className={styles.grid2}>
                    <label className={styles.field}>
                        <span className={styles.label}>Full name</span>
                        <input
                            className={styles.input}
                            value={name}
                            onChange={(e) => setAnswer("name", e.target.value)}
                            placeholder="Your name"
                            autoComplete="name"
                        />
                    </label>

                    <label className={styles.field}>
                        <span className={styles.label}>Phone</span>
                        <input
                            className={styles.input}
                            value={phone}
                            onChange={(e) => setAnswer("phone", formatPhoneUS(e.target.value))}
                            placeholder="(555) 123-4567"
                            inputMode="tel"
                            autoComplete="tel"
                        />
                    </label>

                    <label className={styles.field} style={{ gridColumn: "1 / -1" }}>
                        <span className={styles.label}>Email</span>
                        <input
                            className={styles.input}
                            value={email}
                            onChange={(e) => setAnswer("email", e.target.value)}
                            placeholder="you@email.com"
                            inputMode="email"
                            autoComplete="email"
                        />
                    </label>
                </div>

                {mapsError ? (
                    <div className={styles.warn}>
                        Address autocomplete is unavailable: <b>{mapsError}</b>
                        <div className={styles.warnSub}>You can still type the address manually.</div>
                    </div>
                ) : null}

                {/* Address w/ custom autocomplete */}
                <div ref={rootRef} className={styles.autocompleteRoot}>
                    <label className={styles.field}>
                        <span className={styles.label}>Address</span>

                        <input
                            ref={addressInputRef}
                            className={styles.input}
                            value={address}
                            onChange={(e) => {
                                setAnswer("address", e.target.value);
                                setOpen(true);
                            }}
                            onFocus={() => setOpen(true)}
                            onKeyDown={onAddressKeyDown}
                            placeholder={mapsReady ? "Start typing your address…" : "Loading address search…"}
                            autoComplete="street-address"
                            aria-autocomplete="list"
                            aria-expanded={showPanel}
                            aria-controls="address-suggestions"
                        />

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
                                            onMouseDown={(e) => {
                                                // prevent input blur before we handle selection
                                                e.preventDefault();
                                            }}
                                            onClick={() => void selectPrediction(p)}
                                        >
                                            <div className={styles.suggestionMain}>{p.structured_formatting?.main_text ?? p.description}</div>
                                            <div className={styles.suggestionSub}>
                                                {p.structured_formatting?.secondary_text ?? ""}
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        ) : null}
                    </label>
                </div>
            </div>

            <div className={styles.note}>
                We’ll never share your information. This is only used to generate your report and follow up if you request it.
            </div>
        </div>
    );
}
