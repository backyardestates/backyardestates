'use client'

import { ShieldCheck, Home, CalendarClock } from 'lucide-react'
import AnimatedNumber from '../AnimatedNumber'
import style from './TrustStatBar.module.css'

export interface TrustStat {
    /** Numeric value to count up to, or null for a text-only stat. */
    value: number | null
    /** Text shown when value is null (e.g. "8–12"). */
    text?: string
    prefix?: string
    suffix?: string
    label: string
    icon: 'shield' | 'home' | 'clock'
}

const ICONS = {
    shield: ShieldCheck,
    home: Home,
    clock: CalendarClock,
}

export default function TrustStatBar({ stats }: { stats: TrustStat[] }) {
    return (
        <ul className={style.bar}>
            {stats.map((stat, i) => {
                const Icon = ICONS[stat.icon]
                return (
                    <li key={i} className={style.stat}>
                        <Icon className={style.icon} aria-hidden="true" />
                        <span className={style.value}>
                            {stat.prefix}
                            {stat.value !== null ? (
                                <AnimatedNumber
                                    value={stat.value}
                                    format={(n) =>
                                        Math.round(n).toLocaleString()
                                    }
                                />
                            ) : (
                                stat.text
                            )}
                            {stat.suffix}
                        </span>
                        <span className={style.label}>{stat.label}</span>
                    </li>
                )
            })}
        </ul>
    )
}
