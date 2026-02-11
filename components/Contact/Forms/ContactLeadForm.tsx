"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import styles from "./ContactForms.module.css"
import { isValidUSPhone } from "@/utils/isValidUSPhone"
import { loadGoogleMaps } from "@/lib/googleMaps/loadGoogleMaps"

type Intent = "INTRO_CALL" | "OFFICE_CONSULT" | "MESSAGE"

type Errors = Partial<
    Record<
        | "firstName"
        | "lastName"
        | "email"
        | "phone"
        | "address"
        | "message",
        string
    >
>

function cn(...classes: (string | undefined | null | false)[]) {
    return classes.filter(Boolean).join(" ")
}

function digitsOnly(v: string) {
    return (v ?? "").replace(/\D/g, "")
}

type Prediction = google.maps.places.AutocompletePrediction

function useDebounced<T>(value: T, delay = 180) {
    const [debounced, setDebounced] = useState(value)
    useEffect(() => {
        const t = window.setTimeout(() => setDebounced(value), delay)
        return () => window.clearTimeout(t)
    }, [value, delay])
    return debounced
}

function parseAddressComponents(place: google.maps.places.PlaceResult) {
    const comps = place.address_components ?? []

    const get = (type: string) =>
        comps.find((c) => c.types?.includes(type))?.long_name ?? ""

    const streetNumber = get("street_number")
    const route = get("route")
    const city =
        get("locality") ||
        get("sublocality") ||
        get("sublocality_level_1") ||
        get("administrative_area_level_2")

    const state = comps.find((c) => c.types?.includes("administrative_area_level_1"))?.short_name ?? ""
    const zip = get("postal_code")

    const street = [streetNumber, route].filter(Boolean).join(" ").trim()

    return { street, city, state, zip }
}

export function ContactLeadForm({
    intent,
    submitLabel,
    successRedirectBase,
    showMessageField = false,
}: {
    intent: Intent
    submitLabel: string
    successRedirectBase: string
    showMessageField?: boolean
}) {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [errors, setErrors] = useState<Errors>({})

    // -----------------------------
    // Form state
    // -----------------------------
    const [form, setForm] = useState({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        // address fields
        addressInput: "",
        addressFormatted: "",
        street: "",
        city: "",
        state: "",
        zip: "",
        lat: null as number | null,
        lng: null as number | null,

        message: "",
        consentEmail: "subscribed",
        consentText: "subscribed",
        source: "Website",
    })

    const header = useMemo(() => {
        if (intent === "INTRO_CALL") {
            return {
                eyebrow: "Schedule a phone call",
                title: "Schedule a phone call",
                desc: "Book a 15-minute call to see what can work on your property.",
                cardDesc: "Enter your info so we can prefill your booking details.",
            }
        }
        if (intent === "OFFICE_CONSULT") {
            return {
                eyebrow: "Free office consultation",
                title: "Schedule a free office consultation",
                desc: "Come in for a walkthrough. We’ll review your goals and give you clear next steps.",
                cardDesc: "Enter your info so we can reserve a time for your visit.",
            }
        }
        return {
            eyebrow: "Send us a message",
            title: "Send us a message",
            desc: "Have questions? Send us a note and we’ll respond within one business day.",
            cardDesc: "Enter your info and we’ll follow up by email.",
        }
    }, [intent])

    function update<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
        setForm((prev) => ({ ...prev, [key]: value }))
        // clear matching error keys if they exist
        if (key === "addressInput") setErrors((prev) => ({ ...prev, address: "" }))
        else setErrors((prev) => ({ ...prev, [key as any]: "" }))
    }

    // -----------------------------
    // Google Maps Autocomplete (custom)
    // -----------------------------
    const apiKey = useMemo(() => process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "", [])

    const [mapsReady, setMapsReady] = useState(false)
    const [mapsError, setMapsError] = useState<string | null>(null)

    const [open, setOpen] = useState(false)
    const [loadingPredictions, setLoadingPredictions] = useState(false)
    const [predictions, setPredictions] = useState<Prediction[]>([])
    const [activeIndex, setActiveIndex] = useState(-1)

    const rootRef = useRef<HTMLDivElement | null>(null)
    const acServiceRef = useRef<google.maps.places.AutocompleteService | null>(null)
    const placeServiceRef = useRef<google.maps.places.PlacesService | null>(null)

    const debouncedAddress = useDebounced(form.addressInput, 180)
    const MAX_RESULTS = 4

    // Load Maps + Places services
    useEffect(() => {
        let cancelled = false
            ; (async () => {
                try {
                    if (!apiKey) throw new Error("Missing NEXT_PUBLIC_GOOGLE_MAPS_API_KEY")
                    await loadGoogleMaps({ apiKey })
                    if (cancelled) return

                    await google.maps.importLibrary("places")
                    if (cancelled) return

                    acServiceRef.current = new google.maps.places.AutocompleteService()
                    const dummy = document.createElement("div")
                    placeServiceRef.current = new google.maps.places.PlacesService(dummy)

                    setMapsReady(true)
                } catch (e: any) {
                    if (cancelled) return
                    setMapsError(e?.message ?? "Failed to load Google Maps")
                }
            })()

        return () => {
            cancelled = true
        }
    }, [apiKey])

    // Fetch predictions
    useEffect(() => {
        let cancelled = false

        if (!mapsReady || !acServiceRef.current) return

        const q = (debouncedAddress ?? "").trim()
        if (q.length < 3) {
            setPredictions([])
            setLoadingPredictions(false)
            setActiveIndex(-1)
            return
        }

        setLoadingPredictions(true)

        acServiceRef.current.getPlacePredictions(
            {
                input: q,
                types: ["address"],
                componentRestrictions: { country: "us" },
            },
            (res, status) => {
                if (cancelled) return
                setLoadingPredictions(false)

                if (status !== google.maps.places.PlacesServiceStatus.OK || !res?.length) {
                    setPredictions([])
                    setActiveIndex(-1)
                    return
                }

                setPredictions(res)
                setActiveIndex(-1)
            }
        )

        return () => {
            cancelled = true
        }
    }, [debouncedAddress, mapsReady])

    // Close on outside click
    useEffect(() => {
        const onDown = (e: MouseEvent) => {
            if (!rootRef.current) return
            if (!rootRef.current.contains(e.target as Node)) setOpen(false)
        }
        document.addEventListener("mousedown", onDown)
        return () => document.removeEventListener("mousedown", onDown)
    }, [])

    async function selectPrediction(p: Prediction) {
        setOpen(false)
        setPredictions([])
        setActiveIndex(-1)

        const display = p.description ?? ""
        setForm((prev) => ({
            ...prev,
            addressInput: display,
            addressFormatted: display,
        }))

        const ps = placeServiceRef.current
        if (!ps) return

        ps.getDetails(
            {
                placeId: p.place_id,
                fields: ["formatted_address", "geometry", "address_components"],
            },
            (place, status) => {
                if (status !== google.maps.places.PlacesServiceStatus.OK || !place) return

                const formatted = place.formatted_address ?? display
                const lat = place.geometry?.location?.lat()
                const lng = place.geometry?.location?.lng()

                const parsed = parseAddressComponents(place)

                setForm((prev) => ({
                    ...prev,
                    addressInput: formatted,
                    addressFormatted: formatted,
                    street: parsed.street,
                    city: parsed.city,
                    state: parsed.state || "CA",
                    zip: parsed.zip,
                    lat: typeof lat === "number" ? lat : prev.lat,
                    lng: typeof lng === "number" ? lng : prev.lng,
                }))
            }
        )
    }

    function onAddressKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
        if (!open && (e.key === "ArrowDown" || e.key === "ArrowUp")) {
            setOpen(true)
            return
        }

        if (e.key === "Escape") {
            setOpen(false)
            return
        }

        if (!predictions.length) return

        const visibleCount = Math.min(predictions.length, MAX_RESULTS)

        if (e.key === "ArrowDown") {
            e.preventDefault()
            setOpen(true)
            setActiveIndex((i) => Math.min(i + 1, visibleCount - 1))
            return
        }

        if (e.key === "ArrowUp") {
            e.preventDefault()
            setActiveIndex((i) => Math.max(i - 1, 0))
            return
        }

        if (e.key === "Enter") {
            if (activeIndex >= 0 && activeIndex < visibleCount) {
                e.preventDefault()
                void selectPrediction(predictions[activeIndex])
            }
        }
    }

    const showPanel = open && (predictions.length > 0 || loadingPredictions)

    // -----------------------------
    // Validation
    // -----------------------------
    const isValid = useMemo(() => {
        return (
            form.firstName.trim() &&
            form.lastName.trim() &&
            /\S+@\S+\.\S+/.test(form.email) &&
            isValidUSPhone(form.phone) &&
            form.addressInput.trim().length >= 6
        )
    }, [form])

    function validate(): Errors {
        const e: Errors = {}
        if (!form.firstName.trim()) e.firstName = "First name is required"
        if (!form.lastName.trim()) e.lastName = "Last name is required"
        if (!form.email || !/\S+@\S+\.\S+/.test(form.email)) e.email = "Valid email is required"
        if (!form.phone || !isValidUSPhone(form.phone)) e.phone = "Valid US phone is required"
        if (!form.addressInput.trim()) e.address = "Property address is required"
        if (showMessageField && !form.message.trim()) e.message = "Please tell us how we can help"
        return e
    }

    // -----------------------------
    // Submit
    // -----------------------------
    async function onSubmit(e: React.FormEvent) {
        e.preventDefault()
        if (loading) return

        const e2 = validate()
        setErrors(e2)
        if (Object.values(e2).some(Boolean)) return

        setLoading(true)

        try {
            const phoneDigits = digitsOnly(form.phone)

            // prefer formatted address; fallback to input
            const addressString = (form.addressFormatted || form.addressInput).trim()

            const payload = {
                intent,
                contact: {
                    firstName: form.firstName,
                    lastName: form.lastName,
                    name: `${form.firstName} ${form.lastName}`,
                    email: form.email,
                    phone: phoneDigits,
                    address: {
                        // still send parsed parts (useful for CRM + later automation)
                        street: form.street || addressString,
                        city: form.city,
                        zip: form.zip,
                    },
                    // optional extras if you want later:
                    // lat: form.lat,
                    // lng: form.lng,

                    message: showMessageField ? form.message : "",
                    source: form.source,
                    consentEmail: "subscribed",
                    consentText: "subscribed",
                },
            }

            const res = await fetch("/api/contact/lead", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            })

            const data = await res.json()

            if (!res.ok || !data?.success) {
                // show the real reason (step + pipedrive error)
                const step = data?.step ? ` (${data.step})` : ""
                const msg =
                    data?.pipedrive?.error ||
                    data?.error ||
                    "Something went wrong. Please try again."

                setErrors((prev) => ({ ...prev, email: `${msg}${step}` }))
                setLoading(false)
                return
            }

            const qs = new URLSearchParams({
                name: `${form.firstName} ${form.lastName}`,
                email: form.email,
                phone: phoneDigits,
                address: addressString,
            }).toString()

            router.push(`${successRedirectBase}?${qs}`)
        } catch {
            setErrors((prev) => ({ ...prev, email: "Network error. Please try again." }))
            setLoading(false)
        }
    }

    // -----------------------------
    // UI
    // -----------------------------
    return (
        <div className={styles.wrap}>
            <div className={styles.heroCard}>
                <div className={styles.heroTop}>
                    <div className={styles.heroLeft}>

                        <h1 className={styles.heroHeadline}>{header.title}</h1>

                        <p className={styles.heroSubhead}>{header.desc}</p>


                    </div>
                </div>

                <div className={styles.card}>

                    <form onSubmit={onSubmit} className={styles.form} noValidate>

                        <div className={styles.grid2}>
                            <div className={styles.field}>
                                <label className={styles.label} htmlFor="firstName">First name</label>
                                <input
                                    id="firstName"
                                    className={cn(styles.input, errors.firstName && styles.inputError)}
                                    value={form.firstName}
                                    onChange={(e) => update("firstName", e.target.value)}
                                    autoComplete="given-name"
                                    placeholder="John"

                                />
                                {errors.firstName && <span className={styles.error}>{errors.firstName}</span>}
                            </div>

                            <div className={styles.field}>
                                <label className={styles.label} htmlFor="lastName">Last name</label>
                                <input
                                    id="lastName"
                                    className={cn(styles.input, errors.lastName && styles.inputError)}
                                    value={form.lastName}
                                    onChange={(e) => update("lastName", e.target.value)}
                                    autoComplete="family-name"
                                    placeholder="Smith"

                                />
                                {errors.lastName && <span className={styles.error}>{errors.lastName}</span>}
                            </div>
                        </div>

                        <div className={styles.grid2}>
                            <div className={styles.field}>
                                <label className={styles.label} htmlFor="email">Email</label>
                                <input
                                    id="email"
                                    type="email"
                                    className={cn(styles.input, errors.email && styles.inputError)}
                                    value={form.email}
                                    onChange={(e) => update("email", e.target.value)}
                                    autoComplete="email"
                                    placeholder="john@mail.com"

                                />
                                {errors.email && <span className={styles.error}>{errors.email}</span>}
                            </div>

                            <div className={styles.field}>
                                <label className={styles.label} htmlFor="phone">Phone</label>
                                <input
                                    id="phone"
                                    type="tel"
                                    className={cn(styles.input, errors.phone && styles.inputError)}
                                    value={form.phone}
                                    onChange={(e) => update("phone", e.target.value)}
                                    autoComplete="tel"
                                    placeholder="(909) 000-00000"
                                />
                                {errors.phone && <span className={styles.error}>{errors.phone}</span>}
                            </div>
                        </div>

                        {mapsError ? (
                            <div className={styles.warn}>
                                Address autocomplete is unavailable: <b>{mapsError}</b>
                                <div className={styles.warnSub}>You can still type the address manually.</div>
                            </div>
                        ) : null}

                        <div ref={rootRef} className={styles.autocompleteRoot}>
                            <div className={styles.field}>
                                <label className={styles.label} htmlFor="propertyAddress">Property address</label>

                                <input
                                    id="propertyAddress"
                                    className={cn(styles.input, errors.address && styles.inputError)}
                                    value={form.addressInput}
                                    onChange={(e) => {
                                        update("addressInput", e.target.value)
                                        setOpen(true)
                                    }}
                                    onFocus={() => setOpen(true)}
                                    onKeyDown={onAddressKeyDown}
                                    placeholder={mapsReady ? "Start typing your address…" : "Loading address search…"}
                                    autoComplete="street-address"
                                    aria-autocomplete="list"
                                    aria-expanded={showPanel}
                                    aria-controls="address-suggestions"
                                />

                                {errors.address && <span className={styles.error}>{errors.address}</span>}

                                {showPanel ? (
                                    <div id="address-suggestions" className={styles.suggestions} role="listbox">
                                        {loadingPredictions ? <div className={styles.suggestionHint}>Searching…</div> : null}
                                        {!loadingPredictions && predictions.length === 0 ? (
                                            <div className={styles.suggestionHint}>No matches yet — keep typing.</div>
                                        ) : null}

                                        {predictions.slice(0, MAX_RESULTS).map((p, idx) => {
                                            const active = idx === activeIndex
                                            return (
                                                <button
                                                    key={p.place_id}
                                                    type="button"
                                                    className={active ? styles.suggestionActive : styles.suggestion}
                                                    role="option"
                                                    aria-selected={active}
                                                    onMouseEnter={() => setActiveIndex(idx)}
                                                    onMouseDown={(e) => e.preventDefault()}
                                                    onClick={() => void selectPrediction(p)}
                                                >
                                                    <div className={styles.suggestionMain}>
                                                        {p.structured_formatting?.main_text ?? p.description}
                                                    </div>
                                                    <div className={styles.suggestionSub}>
                                                        {p.structured_formatting?.secondary_text ?? ""}
                                                    </div>
                                                </button>
                                            )
                                        })}
                                    </div>
                                ) : null}
                            </div>
                        </div>

                        <div className={styles.sectionTitle}>{showMessageField ? "How can we help?" : "Notes (optional)"}</div>

                        <div className={styles.field}>
                            {showMessageField ? (
                                <>
                                    <textarea
                                        id="message"
                                        className={cn(styles.textarea, errors.message && styles.inputError)}
                                        value={form.message}
                                        onChange={(e) => update("message", e.target.value)}
                                        rows={4}
                                        placeholder="Tell us what you’re trying to accomplish (family, rental, timeline, city, etc.)"
                                    />
                                    {errors.message && <span className={styles.error}>{errors.message}</span>}
                                </>
                            ) : (
                                <textarea
                                    id="messageOptional"
                                    className={styles.textarea}
                                    value={form.message}
                                    onChange={(e) => update("message", e.target.value)}
                                    rows={4}
                                    placeholder="Anything we should know before we connect?"
                                />
                            )}
                        </div>

                        <button className={styles.submit} type="submit" disabled={!isValid || loading}>
                            {loading ? "Submitting..." : submitLabel}
                        </button>
                    </form>
                </div>

            </div>
        </div>
    )

}
