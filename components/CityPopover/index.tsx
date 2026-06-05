'use client'

import { useEffect, useRef, useState } from 'react'
import { MapPin } from 'lucide-react'

import style from './CityPopover.module.css'

/**
 * Inline "N more" trigger that reveals the full city list in a popover.
 * Opens on hover/focus (desktop) and tap (mobile); closes on Escape,
 * outside tap, or mouse-out.
 */
export default function CityPopover({ cities }: { cities: string[] }) {
    const [open, setOpen] = useState(false)
    const wrapRef = useRef<HTMLSpanElement>(null)

    useEffect(() => {
        if (!open) return
        const onPointerDown = (e: PointerEvent) => {
            if (!wrapRef.current?.contains(e.target as Node)) setOpen(false)
        }
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setOpen(false)
        }
        document.addEventListener('pointerdown', onPointerDown)
        document.addEventListener('keydown', onKeyDown)
        return () => {
            document.removeEventListener('pointerdown', onPointerDown)
            document.removeEventListener('keydown', onKeyDown)
        }
    }, [open])

    if (cities.length === 0) return null

    return (
        <span
            ref={wrapRef}
            className={style.wrap}
            onMouseEnter={() => setOpen(true)}
            onMouseLeave={() => setOpen(false)}
        >
            <button
                type="button"
                className={style.trigger}
                aria-expanded={open}
                aria-controls="city-popover-panel"
                onClick={() => setOpen((v) => !v)}
                onFocus={() => setOpen(true)}
                onBlur={() => setOpen(false)}
            >
                {cities.length} more
            </button>
            <span
                id="city-popover-panel"
                role="tooltip"
                className={`${style.panel} ${open ? style.panelOpen : ''}`}
            >
                <span className={style.panelTitle}>
                    <MapPin className={style.panelIcon} aria-hidden="true" />
                    Also built in
                </span>
                <span className={style.chips}>
                    {cities.map((city) => (
                        <span key={city} className={style.chip}>
                            {city}
                        </span>
                    ))}
                </span>
            </span>
        </span>
    )
}
