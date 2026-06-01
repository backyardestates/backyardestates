'use client'

import { useId, useRef, useState } from 'react'
import {
    Utensils,
    Bath,
    Sofa,
    Home,
    Hammer,
    Zap,
    Check,
    type LucideIcon,
} from 'lucide-react'

import style from './FloorplanInclusions.module.css'

interface Feature {
    header: string
    text: string
}
interface Category {
    title: string
    features: Feature[]
}

const ICONS: Record<string, LucideIcon> = {
    Kitchen: Utensils,
    Bathroom: Bath,
    Interior: Sofa,
    Exterior: Home,
    Construction: Hammer,
    'Systems & Utilities': Zap,
}

export default function FloorplanInclusions({
    categories,
}: {
    categories: Category[]
}) {
    const [active, setActive] = useState(0)
    const tabRefs = useRef<(HTMLButtonElement | null)[]>([])
    const baseId = useId()

    function onKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
        const last = categories.length - 1
        let next: number | null = null
        if (e.key === 'ArrowRight') next = active === last ? 0 : active + 1
        else if (e.key === 'ArrowLeft') next = active === 0 ? last : active - 1
        else if (e.key === 'Home') next = 0
        else if (e.key === 'End') next = last
        if (next !== null) {
            e.preventDefault()
            setActive(next)
            tabRefs.current[next]?.focus()
        }
    }

    return (
        <div className={style.wrapper}>
            <div
                role="tablist"
                aria-label="What's included, by category"
                className={style.tablist}
                onKeyDown={onKeyDown}
            >
                {categories.map((cat, i) => {
                    const Icon = ICONS[cat.title] ?? Home
                    const selected = i === active
                    return (
                        <button
                            key={cat.title}
                            ref={(el) => {
                                tabRefs.current[i] = el
                            }}
                            id={`${baseId}-tab-${i}`}
                            role="tab"
                            type="button"
                            aria-selected={selected}
                            aria-controls={`${baseId}-panel-${i}`}
                            tabIndex={selected ? 0 : -1}
                            className={`${style.tab} ${selected ? style.tabActive : ''}`}
                            onClick={() => setActive(i)}
                        >
                            <Icon className={style.tabIcon} aria-hidden="true" />
                            <span>{cat.title}</span>
                            <span className={style.tabCount}>
                                {cat.features.length}
                            </span>
                        </button>
                    )
                })}
            </div>

            {categories.map((cat, i) => (
                <div
                    key={cat.title}
                    id={`${baseId}-panel-${i}`}
                    role="tabpanel"
                    aria-labelledby={`${baseId}-tab-${i}`}
                    hidden={i !== active}
                    className={style.panel}
                >
                    <ul className={style.grid}>
                        {cat.features.map((f) => (
                            <li key={f.header} className={style.card}>
                                <div className={style.cardHead}>
                                    <span className={style.checkBadge}>
                                        <Check
                                            className={style.checkIcon}
                                            aria-hidden="true"
                                        />
                                    </span>
                                    <h3 className={style.cardTitle}>
                                        {f.header}
                                    </h3>
                                </div>
                                <p className={style.cardText}>{f.text}</p>
                            </li>
                        ))}
                    </ul>
                </div>
            ))}
        </div>
    )
}
