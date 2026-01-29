"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useAnswersStore } from "@/lib/feasibility/stores/answers.store";
import { loadGoogleMaps } from "@/lib/googleMaps/loadGoogleMaps";
import styles from "./Contact.module.css";

type PlaceResult = google.maps.places.PlaceResult;

function digitsOnly(s: string) {
    return s.replace(/\D/g, "");
}

function formatPhoneUS(input: string) {
    const d = digitsOnly(input).slice(0, 10);
    if (d.length <= 3) return d;
    if (d.length <= 6) return `(${d.slice(0, 3)}) ${d.slice(3)}`;
    return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
}

function getComponent(place: PlaceResult, type: string, useShort = false) {
    const comps = place.address_components ?? [];
    const found = comps.find((c) => c.types?.includes(type));
    if (!found) return "";
    return useShort ? found.short_name || "" : found.long_name || "";
}

function buildStreet(place: PlaceResult) {
    const streetNumber = getComponent(place, "street_number");
    const route = getComponent(place, "route");
    return [streetNumber, route].filter(Boolean).join(" ").trim();
}

export default function ContactStep() {
    const answers = useAnswersStore((s) => s.answers);
    const setAnswer = useAnswersStore((s) => s.setAnswer);

    const [mapsReady, setMapsReady] = useState(false);
    const [mapsError, setMapsError] = useState<string | null>(null);

    const addressInputRef = useRef<HTMLInputElement | null>(null);
    const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);

    const apiKey = useMemo(() => process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "", []);

    // 1) Load Google Maps script
    useEffect(() => {
        let cancelled = false;

        (async () => {
            try {
                if (!apiKey) throw new Error("Missing NEXT_PUBLIC_GOOGLE_MAPS_API_KEY");
                await loadGoogleMaps({ apiKey });
                if (cancelled) return;
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

    // 2) Create Autocomplete (via importLibrary)
    useEffect(() => {
        let cancelled = false;

        (async () => {
            if (!mapsReady) return;
            if (!addressInputRef.current) return;

            // Import Places library (modern)
            // `importLibrary` returns library objects depending on the string.
            // For "places", we only need it loaded; Autocomplete becomes available on google.maps.places.
            await google.maps.importLibrary("places");
            if (cancelled) return;

            const el = addressInputRef.current;

            const ac = new google.maps.places.Autocomplete(el, {
                types: ["address"],
                componentRestrictions: { country: "us" },
                fields: ["address_components", "formatted_address", "geometry"],
            });

            autocompleteRef.current = ac;

            const listener = ac.addListener("place_changed", () => {
                const place = ac.getPlace();

                const formatted = place.formatted_address ?? "";
                const city =
                    getComponent(place, "locality") ||
                    getComponent(place, "sublocality") ||
                    getComponent(place, "postal_town");

                const state = getComponent(place, "administrative_area_level_1", true);
                const zip = getComponent(place, "postal_code");
                const street = buildStreet(place);

                const lat = place.geometry?.location?.lat();
                const lng = place.geometry?.location?.lng();

                setAnswer("address", formatted || street || "");
                setAnswer("city", city || "");

                setAnswer("street", street || "");
                setAnswer("state", state || "");
                setAnswer("zip", zip || "");
                setAnswer("lat", typeof lat === "number" ? lat : null);
                setAnswer("lng", typeof lng === "number" ? lng : null);
            });

            // cleanup
            return () => {
                google.maps.event.removeListener(listener);
                autocompleteRef.current = null;
            };
        })();

        return () => {
            cancelled = true;
        };
    }, [mapsReady, setAnswer]);

    const name = (answers.name as string) ?? "";
    const email = (answers.email as string) ?? "";
    const phone = (answers.phone as string) ?? "";
    const address = (answers.address as string) ?? "";

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

                <label className={styles.field}>
                    <span className={styles.label}>Address</span>
                    <input
                        ref={addressInputRef}
                        className={styles.input}
                        value={address}
                        onChange={(e) => setAnswer("address", e.target.value)}
                        placeholder={mapsReady ? "Start typing your address…" : "Loading address search…"}
                        autoComplete="street-address"
                    />
                </label>
            </div>
            <div className={styles.note}>
                We’ll never share your information. This is only used to generate your report and follow up if you request it.
            </div>
        </div>
    );
}
