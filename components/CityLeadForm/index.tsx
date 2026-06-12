'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { MapPin, Phone, ArrowRight, ShieldCheck } from 'lucide-react'

import { isValidUSPhone } from '@/utils/isValidUSPhone'
import { loadGoogleMaps } from '@/lib/googleMaps/loadGoogleMaps'
import { business } from '@/lib/business'

import style from './CityLeadForm.module.css'

type Prediction = google.maps.places.AutocompletePrediction

function cn(...classes: (string | undefined | null | false)[]) {
    return classes.filter(Boolean).join(' ')
}

function digitsOnly(v: string) {
    return (v ?? '').replace(/\D/g, '')
}

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
        comps.find((c) => c.types?.includes(type))?.long_name ?? ''
    const city =
        get('locality') ||
        get('sublocality') ||
        get('sublocality_level_1') ||
        get('administrative_area_level_2')
    const state =
        comps.find((c) => c.types?.includes('administrative_area_level_1'))
            ?.short_name ?? ''
    const zip = get('postal_code')
    const street = [get('street_number'), get('route')]
        .filter(Boolean)
        .join(' ')
        .trim()
    return { street, city, state, zip }
}

/**
 * Lightweight, low-friction inline lead form for the /adu-builder/[city] pages.
 * Asks only for the property address + phone (+ optional first name) and posts
 * to the existing Pipedrive lead endpoint with a CITY_BUILDER intent so leads
 * stay attributable per city. Mirrors the address autocomplete behaviour of the
 * full ContactLeadForm but trimmed for on-page capture.
 */
export default function CityLeadForm({
    cityName,
    id = 'city-lead-form',
    successRedirectBase = '/talk-to-an-adu-specialist/message/success',
}: {
    cityName: string
    id?: string
    successRedirectBase?: string
}) {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [errors, setErrors] = useState<{
        phone?: string
        address?: string
        form?: string
    }>({})

    const [form, setForm] = useState({
        firstName: '',
        phone: '',
        addressInput: '',
        addressFormatted: '',
        street: '',
        city: '',
        state: '',
        zip: '',
        // Honeypot — real users never fill this; bots often do.
        company: '',
    })

    function update<K extends keyof typeof form>(
        key: K,
        value: (typeof form)[K]
    ) {
        setForm((prev) => ({ ...prev, [key]: value }))
        if (key === 'addressInput')
            setErrors((prev) => ({ ...prev, address: '' }))
        if (key === 'phone') setErrors((prev) => ({ ...prev, phone: '' }))
    }

    // ---- Google Maps Places autocomplete ----
    const apiKey = useMemo(
        () => process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? '',
        []
    )
    const [mapsReady, setMapsReady] = useState(false)
    const [mapsError, setMapsError] = useState<string | null>(null)
    const [open, setOpen] = useState(false)
    const [loadingPredictions, setLoadingPredictions] = useState(false)
    const [predictions, setPredictions] = useState<Prediction[]>([])
    const [activeIndex, setActiveIndex] = useState(-1)

    const rootRef = useRef<HTMLDivElement | null>(null)
    const acServiceRef =
        useRef<google.maps.places.AutocompleteService | null>(null)
    const placeServiceRef =
        useRef<google.maps.places.PlacesService | null>(null)

    const debouncedAddress = useDebounced(form.addressInput, 180)
    const MAX_RESULTS = 4

    useEffect(() => {
        let cancelled = false
        ;(async () => {
            try {
                if (!apiKey)
                    throw new Error('Missing NEXT_PUBLIC_GOOGLE_MAPS_API_KEY')
                await loadGoogleMaps({ apiKey })
                if (cancelled) return
                await google.maps.importLibrary('places')
                if (cancelled) return
                acServiceRef.current =
                    new google.maps.places.AutocompleteService()
                placeServiceRef.current =
                    new google.maps.places.PlacesService(
                        document.createElement('div')
                    )
                setMapsReady(true)
            } catch (e: any) {
                if (cancelled) return
                setMapsError(e?.message ?? 'Failed to load Google Maps')
            }
        })()
        return () => {
            cancelled = true
        }
    }, [apiKey])

    useEffect(() => {
        let cancelled = false
        if (!mapsReady || !acServiceRef.current) return
        const q = (debouncedAddress ?? '').trim()
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
                types: ['address'],
                componentRestrictions: { country: 'us' },
            },
            (res, status) => {
                if (cancelled) return
                setLoadingPredictions(false)
                if (
                    status !==
                        google.maps.places.PlacesServiceStatus.OK ||
                    !res?.length
                ) {
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

    useEffect(() => {
        const onDown = (e: MouseEvent) => {
            if (!rootRef.current) return
            if (!rootRef.current.contains(e.target as Node)) setOpen(false)
        }
        document.addEventListener('mousedown', onDown)
        return () => document.removeEventListener('mousedown', onDown)
    }, [])

    function selectPrediction(p: Prediction) {
        setOpen(false)
        setPredictions([])
        setActiveIndex(-1)
        const display = p.description ?? ''
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
                fields: ['formatted_address', 'address_components'],
            },
            (place, status) => {
                if (
                    status !==
                        google.maps.places.PlacesServiceStatus.OK ||
                    !place
                )
                    return
                const formatted = place.formatted_address ?? display
                const parsed = parseAddressComponents(place)
                setForm((prev) => ({
                    ...prev,
                    addressInput: formatted,
                    addressFormatted: formatted,
                    street: parsed.street,
                    city: parsed.city,
                    state: parsed.state || 'CA',
                    zip: parsed.zip,
                }))
            }
        )
    }

    function onAddressKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
        if (!open && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
            setOpen(true)
            return
        }
        if (e.key === 'Escape') {
            setOpen(false)
            return
        }
        if (!predictions.length) return
        const visibleCount = Math.min(predictions.length, MAX_RESULTS)
        if (e.key === 'ArrowDown') {
            e.preventDefault()
            setOpen(true)
            setActiveIndex((i) => Math.min(i + 1, visibleCount - 1))
        } else if (e.key === 'ArrowUp') {
            e.preventDefault()
            setActiveIndex((i) => Math.max(i - 1, 0))
        } else if (e.key === 'Enter') {
            if (activeIndex >= 0 && activeIndex < visibleCount) {
                e.preventDefault()
                selectPrediction(predictions[activeIndex])
            }
        }
    }

    const showPanel = open && (predictions.length > 0 || loadingPredictions)

    const isValid =
        form.addressInput.trim().length >= 6 && isValidUSPhone(form.phone)

    async function onSubmit(e: React.FormEvent) {
        e.preventDefault()
        if (loading) return

        // Honeypot tripped — silently succeed without sending anything.
        if (form.company.trim()) {
            router.push(successRedirectBase)
            return
        }

        const nextErrors: typeof errors = {}
        if (form.addressInput.trim().length < 6)
            nextErrors.address = 'Enter your property address'
        if (!isValidUSPhone(form.phone))
            nextErrors.phone = 'Enter a valid US phone number'
        setErrors(nextErrors)
        if (Object.values(nextErrors).some(Boolean)) return

        setLoading(true)
        try {
            const phoneDigits = digitsOnly(form.phone)
            const addressString = (
                form.addressFormatted || form.addressInput
            ).trim()

            const payload = {
                intent: 'CITY_BUILDER',
                cityLabel: cityName,
                contact: {
                    firstName: form.firstName,
                    name: form.firstName || `${cityName} ADU lead`,
                    phone: phoneDigits,
                    address: {
                        street: form.street || addressString,
                        city: form.city || cityName,
                        zip: form.zip,
                    },
                    source: `City Page — ${cityName}`,
                    consentEmail: 'subscribed',
                    consentText: 'subscribed',
                },
            }

            const res = await fetch('/api/contact/lead', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            })
            const data = await res.json()

            if (!res.ok || !data?.success) {
                setErrors({
                    form: 'Something went wrong. Please try again or call us.',
                })
                setLoading(false)
                return
            }

            const qs = new URLSearchParams({
                name: form.firstName,
                phone: phoneDigits,
                address: addressString,
            }).toString()
            router.push(`${successRedirectBase}?${qs}`)
        } catch {
            setErrors({ form: 'Network error. Please try again.' })
            setLoading(false)
        }
    }

    return (
        <div className={style.wrap} id={id}>
            <div className={style.copy}>
                <p className={style.kicker}>Your next step</p>
                <h2 className={style.title}>
                    See what&rsquo;s possible at your{' '}
                    <span className={style.accent}>{cityName}</span> address
                </h2>
                <p className={style.lede}>
                    Drop in your address and we&rsquo;ll show you which ADUs fit
                    your lot, what they&rsquo;d cost all-in, and what they could
                    earn — no pressure, no obligation.
                </p>
                <ul className={style.trust}>
                    <li>
                        <ShieldCheck className={style.trustIcon} />
                        Free, no-obligation
                    </li>
                    <li>
                        <MapPin className={style.trustIcon} />
                        Specific to your {cityName} parcel
                    </li>
                </ul>
            </div>

            <form onSubmit={onSubmit} className={style.card} noValidate>
                {/* Honeypot field — visually hidden, ignored by humans */}
                <div className={style.hp} aria-hidden="true">
                    <label htmlFor="company-website">
                        Company (leave blank)
                    </label>
                    <input
                        id="company-website"
                        tabIndex={-1}
                        autoComplete="off"
                        value={form.company}
                        onChange={(e) => update('company', e.target.value)}
                    />
                </div>

                <div className={style.field}>
                    <label className={style.label} htmlFor="cityLeadFirstName">
                        First name{' '}
                        <span className={style.optional}>(optional)</span>
                    </label>
                    <input
                        id="cityLeadFirstName"
                        className={style.input}
                        value={form.firstName}
                        onChange={(e) => update('firstName', e.target.value)}
                        autoComplete="given-name"
                        placeholder="John"
                    />
                </div>

                <div ref={rootRef} className={style.autocompleteRoot}>
                    <div className={style.field}>
                        <label
                            className={style.label}
                            htmlFor="cityLeadAddress"
                        >
                            Property address
                        </label>
                        <input
                            id="cityLeadAddress"
                            className={cn(
                                style.input,
                                errors.address && style.inputError
                            )}
                            value={form.addressInput}
                            onChange={(e) => {
                                update('addressInput', e.target.value)
                                setOpen(true)
                            }}
                            onFocus={() => setOpen(true)}
                            onKeyDown={onAddressKeyDown}
                            placeholder={
                                mapsReady
                                    ? 'Start typing your address…'
                                    : 'Your property address'
                            }
                            autoComplete="street-address"
                            aria-autocomplete="list"
                            aria-expanded={showPanel}
                            aria-controls="city-lead-suggestions"
                        />
                        {errors.address && (
                            <span className={style.error}>
                                {errors.address}
                            </span>
                        )}
                        {showPanel && (
                            <div
                                id="city-lead-suggestions"
                                className={style.suggestions}
                                role="listbox"
                            >
                                {loadingPredictions && (
                                    <div className={style.suggestionHint}>
                                        Searching…
                                    </div>
                                )}
                                {predictions
                                    .slice(0, MAX_RESULTS)
                                    .map((p, idx) => {
                                        const active = idx === activeIndex
                                        return (
                                            <button
                                                key={p.place_id}
                                                type="button"
                                                className={
                                                    active
                                                        ? style.suggestionActive
                                                        : style.suggestion
                                                }
                                                role="option"
                                                aria-selected={active}
                                                onMouseEnter={() =>
                                                    setActiveIndex(idx)
                                                }
                                                onMouseDown={(e) =>
                                                    e.preventDefault()
                                                }
                                                onClick={() =>
                                                    selectPrediction(p)
                                                }
                                            >
                                                <span
                                                    className={
                                                        style.suggestionMain
                                                    }
                                                >
                                                    {p.structured_formatting
                                                        ?.main_text ??
                                                        p.description}
                                                </span>
                                                <span
                                                    className={
                                                        style.suggestionSub
                                                    }
                                                >
                                                    {p.structured_formatting
                                                        ?.secondary_text ?? ''}
                                                </span>
                                            </button>
                                        )
                                    })}
                            </div>
                        )}
                    </div>
                </div>

                <div className={style.field}>
                    <label className={style.label} htmlFor="cityLeadPhone">
                        Phone
                    </label>
                    <input
                        id="cityLeadPhone"
                        type="tel"
                        className={cn(
                            style.input,
                            errors.phone && style.inputError
                        )}
                        value={form.phone}
                        onChange={(e) => update('phone', e.target.value)}
                        autoComplete="tel"
                        placeholder="(909) 000-0000"
                    />
                    {errors.phone && (
                        <span className={style.error}>{errors.phone}</span>
                    )}
                </div>

                {errors.form && (
                    <p className={style.formError}>{errors.form}</p>
                )}

                <button
                    className={style.submit}
                    type="submit"
                    disabled={!isValid || loading}
                >
                    {loading ? 'Sending…' : 'See what fits my lot'}
                    {!loading && <ArrowRight size={18} />}
                </button>

                <a href={business.phone.href} className={style.callRow}>
                    <Phone size={16} />
                    Prefer to talk? Call {business.phone.display}
                </a>

                {mapsError && (
                    <p className={style.warn}>
                        Address search is unavailable — type your address and
                        we&rsquo;ll take it from there.
                    </p>
                )}
            </form>
        </div>
    )
}
