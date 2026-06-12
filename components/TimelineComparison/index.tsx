'use client'

import { useEffect, useRef, useState } from 'react'

import style from './TimelineComparison.module.css'

interface PhaseDays {
    plansDays?: number | null
    permitsDays?: number | null
    constructionDays?: number | null
}

export interface CityTimeline {
    city?: PhaseDays | null
    backyardEstates?: PhaseDays | null
}

const PHASES: { key: keyof PhaseDays; label: string }[] = [
    { key: 'plansDays', label: 'Plans' },
    { key: 'permitsDays', label: 'Permits' },
    { key: 'constructionDays', label: 'Construction' },
]

// "6.5", "19" — one decimal, trailing .0 trimmed.
const fmtMo = (days: number) => {
    const m = Math.round((days / 30) * 10) / 10
    return Number.isInteger(m) ? `${m}` : m.toFixed(1)
}

/**
 * Clean, near-monochrome comparison: our timeline (deep teal, short) vs. the
 * local industry average (light gray, long). One hero number, two bars, minimal
 * detail — the contrast is meant to read in a glance.
 */
export default function TimelineComparison({
    cityName,
    timeline,
}: {
    cityName: string
    timeline?: CityTimeline | null
}) {
    const ref = useRef<HTMLDivElement | null>(null)
    const [inView, setInView] = useState(false)

    useEffect(() => {
        const el = ref.current
        if (!el) return
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            setInView(true)
            return
        }
        const obs = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting) {
                    setInView(true)
                    obs.disconnect()
                }
            },
            { threshold: 0.25 }
        )
        obs.observe(el)
        return () => obs.disconnect()
    }, [])

    const rows = PHASES.map((p) => ({
        label: p.label,
        be: timeline?.backyardEstates?.[p.key],
        city: timeline?.city?.[p.key],
    })).filter(
        (r) =>
            typeof r.be === 'number' &&
            r.be > 0 &&
            typeof r.city === 'number' &&
            r.city > 0
    ) as { label: string; be: number; city: number }[]

    if (rows.length === 0) return null

    const beTotal = rows.reduce((s, r) => s + r.be, 0)
    const cityTotal = rows.reduce((s, r) => s + r.city, 0)
    const max = Math.max(beTotal, cityTotal)
    const weAreFaster = beTotal < cityTotal
    const mult = beTotal > 0 ? cityTotal / beTotal : 0
    const multLabel = mult >= 2 ? `${Math.round(mult)}×` : `${mult.toFixed(1)}×`
    const biggest = rows.reduce((a, b) => (b.city - b.be > a.city - a.be ? b : a))

    return (
        <div ref={ref} className={style.panel}>
            <div className={style.head}>
                <span className={style.eyebrow}>Timeline · {cityName}</span>
                <p className={style.lead}>
                    <span className={style.leadNum}>{fmtMo(beTotal)}</span>
                    <span className={style.leadUnit}>
                        months to a finished ADU.
                    </span>
                </p>
                {weAreFaster && (
                    <p className={style.sub}>
                        The{' '}
                        <span className={style.cityAccent}>{cityName}</span>{' '}
                        industry average is {fmtMo(cityTotal)} months —
                        we&rsquo;re about{' '}
                        <strong className={style.subStrong}>
                            {multLabel} faster
                        </strong>
                        .
                    </p>
                )}
            </div>

            <div className={style.chart}>
                {/* Backyard Estates */}
                <div className={style.row}>
                    <div className={style.rowTop}>
                        <span className={style.name}>
                            <span className={style.dot} aria-hidden="true" />
                            Backyard Estates
                        </span>
                        <span className={style.val}>
                            {fmtMo(beTotal)} mo
                            <span className={style.valDays}>
                                {beTotal} days
                            </span>
                        </span>
                    </div>
                    <div className={style.track}>
                        <div
                            className={`${style.fill} ${style.fillUs} ${
                                inView ? style.fillIn : ''
                            }`}
                            style={{ width: `${(beTotal / max) * 100}%` }}
                        />
                    </div>
                </div>

                {/* Industry average */}
                <div className={style.row}>
                    <div className={style.rowTop}>
                        <span className={style.nameMuted}>
                            Industry average
                        </span>
                        <span className={style.valMuted}>
                            {fmtMo(cityTotal)} mo
                            <span className={style.valDays}>
                                {cityTotal} days
                            </span>
                        </span>
                    </div>
                    <div className={style.track}>
                        <div
                            className={`${style.fill} ${style.fillThem} ${
                                inView ? style.fillIn : ''
                            }`}
                            style={{ width: '100%' }}
                        >
                            {rows.map((r, i) =>
                                i < rows.length - 1 ? (
                                    <span
                                        key={r.label}
                                        className={style.divider}
                                        style={{
                                            left: `${
                                                (rows
                                                    .slice(0, i + 1)
                                                    .reduce(
                                                        (s, x) => s + x.city,
                                                        0
                                                    ) /
                                                    cityTotal) *
                                                100
                                            }%`,
                                        }}
                                    />
                                ) : null
                            )}
                        </div>
                    </div>
                    <div className={style.phaseRow}>
                        {rows.map((r) => (
                            <span
                                key={r.label}
                                className={style.phaseLabel}
                                style={{
                                    width: `${(r.city / cityTotal) * 100}%`,
                                }}
                            >
                                {r.label}
                            </span>
                        ))}
                    </div>
                </div>
            </div>

            {weAreFaster && (
                <p className={style.caption}>
                    The biggest gap is {biggest.label.toLowerCase()} — the
                    industry averages <strong>{biggest.city} days</strong>; we
                    clear it in <strong>{biggest.be}</strong>.
                </p>
            )}
        </div>
    )
}
