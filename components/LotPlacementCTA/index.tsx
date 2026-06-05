'use client'

import { useEffect, useRef, useState } from 'react'
import type { CSSProperties, ReactNode } from 'react'

import Button from '@/components/Button'

import style from './LotPlacementCTA.module.css'

export interface LotPlan {
    name: string
    sqft: number
}

interface LotPlacementCTAProps {
    plans: LotPlan[]
    ctaHref: string
    phoneDisplay: string
    phoneHref: string
}

// Shown only if Sanity ever returns no plans — the scene must never be empty.
const FALLBACK_PLANS: LotPlan[] = [
    { name: 'Estate 400', sqft: 400 },
    { name: 'Estate 750', sqft: 750 },
    { name: 'Estate 950', sqft: 950 },
]

// Scene geometry (viewBox units). The ADU footprint settles at this spot in
// the backyard; the CSS keyframes assume exactly three cycling footprints —
// or, with a single plan, a drag-and-rotate tour anchored here.
const ADU_CX = 258
const ADU_CY = 118

// Absolute sqft range used to size a lone footprint (single-plan mode).
const SQFT_ROOT_MIN = Math.sqrt(350)
const SQFT_ROOT_SPAN = Math.sqrt(1200) - SQFT_ROOT_MIN

// Organic lawn shape filling the backyard — hand-drawn curves, not a rect.
const LAWN_D =
    'M 32 78 C 30 46 54 30 94 27 C 152 22 240 23 316 28 ' +
    'C 352 31 372 46 370 78 C 372 122 367 162 354 186 ' +
    'C 342 205 308 208 262 207 C 192 206 122 211 78 201 ' +
    'C 46 193 34 144 32 78 Z'

interface Footprint extends LotPlan {
    w: number
    h: number
}

// The roof itself — body, shed seam, blueprint inset, solar, handles.
// Rendered inside the rotor in single mode so it rotates as a unit.
function roofArt(p: Footprint): ReactNode {
    return (
        <>
            <rect
                x={ADU_CX - p.w / 2}
                y={ADU_CY - p.h / 2}
                width={p.w}
                height={p.h}
                rx="5"
                fill="url(#lp-adu)"
                stroke="#91744a"
                strokeWidth="1.2"
                filter="url(#lp-shadow-sm)"
            />
            {/* Shed-roof seam + soft top light */}
            <line
                x1={ADU_CX - p.w / 2 + p.w * 0.32}
                y1={ADU_CY - p.h / 2 + 4}
                x2={ADU_CX - p.w / 2 + p.w * 0.32}
                y2={ADU_CY + p.h / 2 - 4}
                stroke="rgba(255, 255, 255, 0.28)"
                strokeWidth="1.5"
            />
            <rect
                x={ADU_CX - p.w / 2 + 5}
                y={ADU_CY - p.h / 2 + 5}
                width={p.w - 10}
                height={p.h - 10}
                rx="3"
                fill="none"
                stroke="rgba(255, 255, 255, 0.4)"
                strokeWidth="1"
                strokeDasharray="4 3"
            />

            {/* Solar array — included on Estate 500+ */}
            {p.sqft >= 500 &&
                [
                    [0, 0],
                    [11.5, 0],
                    [0, 8],
                    [11.5, 8],
                ].map(([ox, oy], j) => (
                    <rect
                        key={j}
                        x={ADU_CX + p.w / 2 - 32 + ox}
                        y={ADU_CY - p.h / 2 + 8 + oy}
                        width="10"
                        height="6.5"
                        rx="1"
                        fill="url(#lp-solar)"
                        stroke="rgba(255, 255, 255, 0.35)"
                        strokeWidth="0.6"
                    />
                ))}

            {/* Selection handles */}
            {[
                [ADU_CX - p.w / 2, ADU_CY - p.h / 2],
                [ADU_CX + p.w / 2, ADU_CY - p.h / 2],
                [ADU_CX - p.w / 2, ADU_CY + p.h / 2],
                [ADU_CX + p.w / 2, ADU_CY + p.h / 2],
            ].map(([hx, hy], j) => (
                <rect
                    key={j}
                    x={hx - 3}
                    y={hy - 3}
                    width="6"
                    height="6"
                    rx="1"
                    className={style.handle}
                />
            ))}
        </>
    )
}

// The frosted label chip — kept outside the rotor so the text never tilts.
function labelChip(p: Footprint): ReactNode {
    return (
        <>
            <rect
                x={ADU_CX - 38}
                y={ADU_CY - 14}
                width="76"
                height="28"
                rx="8"
                fill="rgba(255, 255, 255, 0.93)"
                stroke="rgba(54, 72, 75, 0.1)"
                strokeWidth="0.8"
            />
            <text x={ADU_CX} y={ADU_CY - 2} className={style.footprintName}>
                {p.name}
            </text>
            <text x={ADU_CX} y={ADU_CY + 10} className={style.footprintSqft}>
                {p.sqft.toLocaleString()} sq ft
            </text>
        </>
    )
}

export default function LotPlacementCTA({
    plans,
    ctaHref,
    phoneDisplay,
    phoneHref,
}: LotPlacementCTAProps) {
    const panelRef = useRef<HTMLDivElement>(null)
    const [inView, setInView] = useState(false)

    useEffect(() => {
        const node = panelRef.current
        if (!node) return
        // Reduced motion: skip the choreography, show the finished scene.
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            setInView(true)
            return
        }
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting) {
                    setInView(true)
                    observer.disconnect()
                }
            },
            { threshold: 0.25, rootMargin: '0px 0px -40px 0px' }
        )
        observer.observe(node)
        return () => observer.disconnect()
    }, [])

    const cycle = (plans.length ? plans : FALLBACK_PLANS)
        .slice()
        .sort((a, b) => a.sqft - b.sqft)
        .slice(0, 3)

    // Single-plan mode: one footprint is dragged around the lot and rotated,
    // the way we place THIS plan at the office. Multi-plan mode cycles sizes.
    const single = cycle.length === 1
    const singleName = cycle[0]?.name

    // Footprint sizes scale with sqrt(sqft) so relative areas read honestly.
    // With one plan there is no spread, so size it on the absolute range.
    const roots = cycle.map((p) => Math.sqrt(p.sqft))
    const minRoot = Math.min(...roots)
    const rootSpan = Math.max(...roots) - minRoot || 1
    const footprints: Footprint[] = cycle.map((p, i) => {
        const t = single
            ? Math.min(
                1,
                Math.max(0, (roots[i] - SQFT_ROOT_MIN) / SQFT_ROOT_SPAN)
            )
            : (roots[i] - minRoot) / rootSpan
        const w = 88 + t * 38 // 88–126 viewBox units
        const h = w * 0.72
        return { ...p, w, h }
    })

    return (
        <div
            ref={panelRef}
            className={`${style.panel} ${inView ? style.inView : ''}`}
        >
            {/* ---------- The “big screen” lot scene ---------- */}
            <div className={style.sceneCol}>
                <div className={style.screenChrome}>
                    <span className={style.chromeDots} aria-hidden="true">
                        <span />
                        <span />
                        <span />
                    </span>
                    <span className={style.chromeLabel}>
                        <span className={style.liveDot} aria-hidden="true" />
                        {single
                            ? `Live lot preview — the ${singleName}, to scale`
                            : 'Live lot preview — plans placed to scale'}
                    </span>
                </div>

                <div className={style.sceneFrame}>
                    <svg
                        className={style.svg}
                        viewBox="0 0 400 400"
                        aria-hidden="true"
                        focusable="false"
                    >
                        <defs>
                            {/* Survey grid */}
                            <pattern
                                id="lp-grid"
                                width="20"
                                height="20"
                                patternUnits="userSpaceOnUse"
                            >
                                <path
                                    d="M 20 0 L 0 0 0 20"
                                    fill="none"
                                    stroke="rgba(54, 72, 75, 0.04)"
                                    strokeWidth="1"
                                />
                            </pattern>

                            {/* Ground + landscaping */}
                            <linearGradient
                                id="lp-parcel"
                                x1="0"
                                y1="0"
                                x2="0"
                                y2="1"
                            >
                                <stop offset="0%" stopColor="#f8f3e7" />
                                <stop offset="100%" stopColor="#f0e8d4" />
                            </linearGradient>
                            <linearGradient
                                id="lp-lawn"
                                x1="0"
                                y1="0"
                                x2="0.6"
                                y2="1"
                            >
                                <stop offset="0%" stopColor="#eaf0d4" />
                                <stop offset="100%" stopColor="#d8e1ba" />
                            </linearGradient>
                            <radialGradient
                                id="lp-canopy"
                                cx="35%"
                                cy="30%"
                                r="75%"
                            >
                                <stop offset="0%" stopColor="#cdd9a2" />
                                <stop offset="100%" stopColor="#9eb175" />
                            </radialGradient>
                            <radialGradient
                                id="lp-canopy2"
                                cx="35%"
                                cy="30%"
                                r="75%"
                            >
                                <stop offset="0%" stopColor="#dae2b4" />
                                <stop offset="100%" stopColor="#b2c189" />
                            </radialGradient>

                            {/* Hardscape */}
                            <linearGradient
                                id="lp-asphalt"
                                x1="0"
                                y1="0"
                                x2="0"
                                y2="1"
                            >
                                <stop offset="0%" stopColor="#e6e0d1" />
                                <stop offset="100%" stopColor="#d9d1be" />
                            </linearGradient>
                            <linearGradient
                                id="lp-concrete"
                                x1="0"
                                y1="0"
                                x2="0"
                                y2="1"
                            >
                                <stop offset="0%" stopColor="#f0eada" />
                                <stop offset="100%" stopColor="#e5decb" />
                            </linearGradient>

                            {/* Main-house roof planes (sun from the NW) */}
                            <linearGradient
                                id="lp-roof-top"
                                x1="0"
                                y1="0"
                                x2="0"
                                y2="1"
                            >
                                <stop offset="0%" stopColor="#fffdf8" />
                                <stop offset="100%" stopColor="#f0ebde" />
                            </linearGradient>
                            <linearGradient
                                id="lp-roof-bottom"
                                x1="0"
                                y1="0"
                                x2="0"
                                y2="1"
                            >
                                <stop offset="0%" stopColor="#efe9da" />
                                <stop offset="100%" stopColor="#e2dac4" />
                            </linearGradient>

                            {/* ADU roof + glass */}
                            <linearGradient
                                id="lp-adu"
                                x1="0"
                                y1="0"
                                x2="1"
                                y2="1"
                            >
                                <stop offset="0%" stopColor="#c9ad7e" />
                                <stop offset="55%" stopColor="#ad8d5f" />
                                <stop offset="100%" stopColor="#97794e" />
                            </linearGradient>
                            <linearGradient
                                id="lp-solar"
                                x1="0"
                                y1="0"
                                x2="1"
                                y2="1"
                            >
                                <stop offset="0%" stopColor="#4d6266" />
                                <stop offset="100%" stopColor="#36484b" />
                            </linearGradient>
                            <linearGradient
                                id="lp-glass"
                                x1="0"
                                y1="0"
                                x2="0"
                                y2="1"
                            >
                                <stop offset="0%" stopColor="#ccd8da" />
                                <stop offset="100%" stopColor="#a9bcbf" />
                            </linearGradient>

                            {/* Atmosphere: warm sun NW, soft vignette SE */}
                            <radialGradient
                                id="lp-sun"
                                cx="16%"
                                cy="10%"
                                r="70%"
                            >
                                <stop
                                    offset="0%"
                                    stopColor="rgba(255, 252, 240, 0.32)"
                                />
                                <stop
                                    offset="100%"
                                    stopColor="rgba(255, 252, 240, 0)"
                                />
                            </radialGradient>
                            <radialGradient
                                id="lp-vignette"
                                cx="88%"
                                cy="94%"
                                r="80%"
                            >
                                <stop
                                    offset="0%"
                                    stopColor="rgba(54, 72, 75, 0.08)"
                                />
                                <stop
                                    offset="100%"
                                    stopColor="rgba(54, 72, 75, 0)"
                                />
                            </radialGradient>

                            {/* Soft architectural shadows */}
                            <filter
                                id="lp-shadow"
                                x="-20%"
                                y="-20%"
                                width="140%"
                                height="140%"
                            >
                                <feDropShadow
                                    dx="2"
                                    dy="4"
                                    stdDeviation="4"
                                    floodColor="#36484b"
                                    floodOpacity="0.18"
                                />
                            </filter>
                            <filter
                                id="lp-shadow-sm"
                                x="-20%"
                                y="-20%"
                                width="140%"
                                height="140%"
                            >
                                <feDropShadow
                                    dx="1.5"
                                    dy="3"
                                    stdDeviation="2.5"
                                    floodColor="#36484b"
                                    floodOpacity="0.22"
                                />
                            </filter>

                            {/* Organic grass speckle (fractal noise) */}
                            <filter id="lp-grass">
                                <feTurbulence
                                    type="fractalNoise"
                                    baseFrequency="0.9"
                                    numOctaves="2"
                                    result="noise"
                                />
                                <feColorMatrix
                                    in="noise"
                                    type="matrix"
                                    values="0 0 0 0 0.32  0 0 0 0 0.40  0 0 0 0 0.20  0 0 0 0.08 0"
                                    result="speckle"
                                />
                                <feComposite
                                    in="speckle"
                                    in2="SourceGraphic"
                                    operator="in"
                                />
                            </filter>

                            {/* One tree, reused at different scales */}
                            <g id="lp-tree">
                                <ellipse
                                    cx="4"
                                    cy="5"
                                    rx="18"
                                    ry="14"
                                    fill="#36484b"
                                    opacity="0.1"
                                />
                                <circle r="16" fill="url(#lp-canopy)" />
                                <circle
                                    cx="-5"
                                    cy="-4"
                                    r="9"
                                    fill="url(#lp-canopy2)"
                                    opacity="0.7"
                                />
                                <circle
                                    cx="-7"
                                    cy="-8"
                                    r="2.5"
                                    fill="#ffffff"
                                    opacity="0.25"
                                />
                            </g>
                        </defs>

                        {/* Parcel base + survey grid */}
                        <rect
                            x="0"
                            y="0"
                            width="400"
                            height="356"
                            fill="url(#lp-parcel)"
                        />
                        <rect
                            x="0"
                            y="0"
                            width="400"
                            height="356"
                            fill="url(#lp-grid)"
                        />

                        {/* Backyard lawn — organic shape + grass texture */}
                        <path d={LAWN_D} fill="url(#lp-lawn)" />
                        <path d={LAWN_D} fill="#ffffff" filter="url(#lp-grass)" />

                        {/* Street + sidewalk (context outside the parcel) */}
                        <rect
                            x="0"
                            y="356"
                            width="400"
                            height="44"
                            fill="url(#lp-asphalt)"
                        />
                        <line
                            x1="0"
                            y1="378"
                            x2="400"
                            y2="378"
                            className={style.streetLine}
                        />
                        <line
                            x1="0"
                            y1="352"
                            x2="400"
                            y2="352"
                            className={style.sidewalk}
                        />

                        {/* Compass */}
                        <g
                            className={style.compass}
                            transform="translate(352, 48)"
                        >
                            <circle
                                cx="0"
                                cy="-2"
                                r="13"
                                fill="rgba(255, 255, 255, 0.55)"
                            />
                            <line x1="0" y1="12" x2="0" y2="-8" />
                            <path d="M -4 -4 L 0 -12 L 4 -4 Z" />
                            <text x="0" y="-16">
                                N
                            </text>
                        </g>

                        {/* Landscaping, driveway & garden path */}
                        <g className={style.landscape}>
                            <rect
                                x="296"
                                y="298"
                                width="52"
                                height="58"
                                rx="2"
                                fill="url(#lp-concrete)"
                                stroke="rgba(54, 72, 75, 0.1)"
                                strokeWidth="1"
                            />
                            <line
                                x1="298"
                                y1="318"
                                x2="346"
                                y2="318"
                                stroke="rgba(54, 72, 75, 0.08)"
                                strokeWidth="1"
                            />
                            <line
                                x1="298"
                                y1="338"
                                x2="346"
                                y2="338"
                                stroke="rgba(54, 72, 75, 0.08)"
                                strokeWidth="1"
                            />

                            {/* Stepping stones from the deck to the ADU */}
                            {[
                                [205, 195],
                                [214, 185],
                                [222, 175],
                            ].map(([px, py], i) => (
                                <ellipse
                                    key={i}
                                    cx={px}
                                    cy={py}
                                    rx="5"
                                    ry="3.5"
                                    fill="#ece4cf"
                                    stroke="rgba(54, 72, 75, 0.07)"
                                    strokeWidth="0.8"
                                />
                            ))}

                            {/* Trees */}
                            <use
                                href="#lp-tree"
                                transform="translate(66, 84) scale(1.3)"
                            />
                            <use
                                href="#lp-tree"
                                transform="translate(99, 56) scale(0.8)"
                            />
                            <use
                                href="#lp-tree"
                                transform="translate(54, 168) scale(0.95)"
                            />
                            <use
                                href="#lp-tree"
                                transform="translate(354, 178) scale(0.7)"
                            />

                            {/* Shrub bed along the west boundary */}
                            <circle
                                cx="32"
                                cy="242"
                                r="5"
                                fill="url(#lp-canopy2)"
                            />
                            <circle
                                cx="37"
                                cy="260"
                                r="4"
                                fill="url(#lp-canopy)"
                            />
                            <circle
                                cx="31"
                                cy="277"
                                r="5.5"
                                fill="url(#lp-canopy2)"
                            />
                            <circle cx="39" cy="247" r="1.3" fill="#c89b62" />
                            <circle cx="36" cy="269" r="1.3" fill="#c89b62" />
                        </g>

                        {/* Existing main house — hip roof, deck, skylights */}
                        <g className={style.houseGroup}>
                            {/* Wood deck off the back */}
                            <rect
                                x="96"
                                y="203"
                                width="110"
                                height="15"
                                rx="2"
                                fill="#e0cba6"
                                stroke="rgba(145, 116, 74, 0.25)"
                                strokeWidth="1"
                            />
                            {[107, 118, 129, 140, 151, 162, 173, 184, 195].map(
                                (sx) => (
                                    <line
                                        key={sx}
                                        x1={sx}
                                        y1="205"
                                        x2={sx}
                                        y2="216"
                                        stroke="rgba(145, 116, 74, 0.16)"
                                        strokeWidth="0.8"
                                    />
                                )
                            )}

                            {/* Shadow base, then roof planes */}
                            <rect
                                x="64"
                                y="216"
                                width="184"
                                height="118"
                                rx="3"
                                fill="#e8e2d2"
                                filter="url(#lp-shadow)"
                            />
                            <polygon
                                points="64,216 248,216 206,275 106,275"
                                fill="url(#lp-roof-top)"
                            />
                            <polygon
                                points="64,334 248,334 206,275 106,275"
                                fill="url(#lp-roof-bottom)"
                            />
                            <polygon
                                points="64,216 64,334 106,275"
                                fill="#ece6d6"
                            />
                            <polygon
                                points="248,216 248,334 206,275"
                                fill="#e9e2d0"
                            />
                            {/* Ridge + hip seams */}
                            <line
                                x1="106"
                                y1="275"
                                x2="206"
                                y2="275"
                                className={style.roofSeam}
                            />
                            <line
                                x1="64"
                                y1="216"
                                x2="106"
                                y2="275"
                                className={style.roofSeam}
                            />
                            <line
                                x1="248"
                                y1="216"
                                x2="206"
                                y2="275"
                                className={style.roofSeam}
                            />
                            <line
                                x1="64"
                                y1="334"
                                x2="106"
                                y2="275"
                                className={style.roofSeam}
                            />
                            <line
                                x1="248"
                                y1="334"
                                x2="206"
                                y2="275"
                                className={style.roofSeam}
                            />
                            <rect
                                x="64"
                                y="216"
                                width="184"
                                height="118"
                                rx="3"
                                fill="none"
                                stroke="rgba(54, 72, 75, 0.22)"
                                strokeWidth="1.2"
                            />
                            {/* Chimney + skylights */}
                            <rect
                                x="208"
                                y="228"
                                width="9"
                                height="9"
                                rx="1.5"
                                fill="#d8cfba"
                                stroke="rgba(54, 72, 75, 0.25)"
                                strokeWidth="0.8"
                            />
                            <rect
                                x="148"
                                y="296"
                                width="12"
                                height="8"
                                rx="1.5"
                                fill="url(#lp-glass)"
                                stroke="rgba(54, 72, 75, 0.2)"
                                strokeWidth="0.8"
                            />
                            <rect
                                x="166"
                                y="296"
                                width="12"
                                height="8"
                                rx="1.5"
                                fill="url(#lp-glass)"
                                stroke="rgba(54, 72, 75, 0.2)"
                                strokeWidth="0.8"
                            />
                            <text x="156" y="319" className={style.houseLabel}>
                                Main house
                            </text>
                        </g>

                        {/* Atmosphere over the ground plane */}
                        <rect
                            x="0"
                            y="0"
                            width="400"
                            height="356"
                            fill="url(#lp-sun)"
                            pointerEvents="none"
                        />
                        <rect
                            x="0"
                            y="0"
                            width="400"
                            height="356"
                            fill="url(#lp-vignette)"
                            pointerEvents="none"
                        />

                        {/* Property boundary — draws itself in */}
                        <rect
                            x="18"
                            y="18"
                            width="364"
                            height="326"
                            rx="10"
                            className={style.boundary}
                        />

                        {/* Survey pins at the corners */}
                        <g className={style.pins}>
                            <circle cx="18" cy="18" r="4" />
                            <circle cx="382" cy="18" r="4" />
                            <circle cx="18" cy="344" r="4" />
                            <circle cx="382" cy="344" r="4" />
                        </g>

                        {/* ADU footprints — settle into place, then either
                            cycle through plan sizes or take a drag-and-rotate
                            tour of the yard (single-plan mode) */}
                        <g className={style.aduGroup}>
                            <rect
                                className={style.pulse}
                                x={ADU_CX - 60}
                                y={ADU_CY - 44}
                                width="120"
                                height="88"
                                rx="8"
                            />
                            {single ? (
                                <>
                                    {/* Ghost of the starting spot while away */}
                                    <rect
                                        className={style.ghost}
                                        x={ADU_CX - footprints[0].w / 2}
                                        y={ADU_CY - footprints[0].h / 2}
                                        width={footprints[0].w}
                                        height={footprints[0].h}
                                        rx="5"
                                    />
                                    <g className={style.dragFootprint}>
                                        <g className={style.dragGroup}>
                                            <g className={style.rotor}>
                                                {roofArt(footprints[0])}
                                            </g>
                                            {labelChip(footprints[0])}
                                        </g>
                                    </g>
                                </>
                            ) : (
                                footprints.map((p, i) => (
                                    <g
                                        key={p.name}
                                        className={style.footprint}
                                        style={{ '--i': i } as CSSProperties}
                                    >
                                        {roofArt(p)}
                                        {labelChip(p)}
                                    </g>
                                ))
                            )}
                        </g>
                    </svg>
                </div>

                <p className={style.sceneCaption}>
                    {single
                        ? `Drag, rotate, place — finding the right spot for the ${singleName}.`
                        : 'At your office visit, this is your real property — satellite view, true dimensions.'}
                </p>
            </div>

            {/* ---------- Copy + CTA ---------- */}
            <div className={style.copyCol}>
                <span className={style.eyebrow}>Before you decide</span>
                <h2 className={style.title}>
                    See {single ? 'it' : 'them'} on{' '}
                    <span className={style.titleAccent}>your lot</span>.
                </h2>
                <p className={style.lede}>
                    {single ? (
                        <>
                            At your free office visit, we pull your property up
                            on the big screen and place the {singleName} on
                            your actual lot &mdash; drag it across the yard,
                            rotate it, tuck it along the fence &mdash; until
                            the placement feels exactly right.
                        </>
                    ) : (
                        <>
                            At your free office visit, we pull your property up
                            on the big screen and place real floor plans on
                            your actual lot &mdash; true sizes, layouts, and
                            placement. You&rsquo;ll see exactly how an Estate
                            home fits your backyard before you commit to
                            anything.
                        </>
                    )}
                </p>
                <div className={style.ctaRow}>
                    <Button isPrimary href={ctaHref}>
                        Schedule my free office visit
                    </Button>
                </div>

                <p className={style.phoneLine}>
                    Prefer to talk first?{' '}
                    <a href={phoneHref} className={style.phoneLink}>
                        Call {phoneDisplay}
                    </a>
                </p>
            </div>
        </div>
    )
}
