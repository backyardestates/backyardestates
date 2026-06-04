'use client'

import { useEffect, useRef, useState } from 'react'

/**
 * Counts up to `value`, formatting each frame with `format`. Animates the first
 * time it scrolls into view, and again whenever `value` changes (e.g. the
 * payment estimator updating). Honors prefers-reduced-motion by snapping to the
 * final value with no animation.
 */
export default function AnimatedNumber({
    value,
    format = (n: number) => String(Math.round(n)),
    duration = 650,
    className,
}: {
    value: number
    format?: (n: number) => string
    duration?: number
    className?: string
}) {
    const ref = useRef<HTMLSpanElement | null>(null)
    const fromRef = useRef(0)
    const frameRef = useRef<number | null>(null)
    const startedRef = useRef(false)
    const [display, setDisplay] = useState(() => format(0))

    useEffect(() => {
        const el = ref.current
        if (!el) return

        const reduced = window.matchMedia(
            '(prefers-reduced-motion: reduce)'
        ).matches

        const run = () => {
            if (reduced) {
                fromRef.current = value
                setDisplay(format(value))
                return
            }
            const from = fromRef.current
            const to = value
            const start = performance.now()
            const tick = (now: number) => {
                const t = Math.min(1, (now - start) / duration)
                // easeOutCubic
                const eased = 1 - Math.pow(1 - t, 3)
                const current = from + (to - from) * eased
                setDisplay(format(current))
                if (t < 1) {
                    frameRef.current = requestAnimationFrame(tick)
                } else {
                    fromRef.current = to
                }
            }
            frameRef.current = requestAnimationFrame(tick)
        }

        // First run waits until scrolled into view; subsequent value changes
        // animate immediately from the previous value.
        if (!startedRef.current) {
            const observer = new IntersectionObserver(
                (entries) => {
                    entries.forEach((entry) => {
                        if (entry.isIntersecting) {
                            startedRef.current = true
                            run()
                            observer.disconnect()
                        }
                    })
                },
                { threshold: 0.4 }
            )
            observer.observe(el)
            return () => {
                observer.disconnect()
                if (frameRef.current) cancelAnimationFrame(frameRef.current)
            }
        }

        run()
        return () => {
            if (frameRef.current) cancelAnimationFrame(frameRef.current)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [value])

    return (
        <span ref={ref} className={className}>
            {display}
        </span>
    )
}
