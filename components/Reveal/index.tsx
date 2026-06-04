'use client'

import { useEffect, useRef, useState, type ElementType } from 'react'
import style from './Reveal.module.css'

/**
 * Wraps content in a scroll-triggered entrance. Honors prefers-reduced-motion:
 * when reduced, content is shown immediately with no transform. `delay`
 * staggers siblings (ms).
 *
 * Effects:
 *  - 'rise' (default): fade + 24px rise
 *  - 'draw': scaleY 0→1 from the top — for vertical connector lines
 */
export default function Reveal({
    children,
    as,
    delay = 0,
    className = '',
    effect = 'rise',
}: {
    children?: React.ReactNode
    as?: ElementType
    delay?: number
    className?: string
    effect?: 'rise' | 'draw'
}) {
    const Tag = (as ?? 'div') as ElementType
    const ref = useRef<HTMLElement | null>(null)
    const [visible, setVisible] = useState(false)

    useEffect(() => {
        const el = ref.current
        if (!el) return

        const reduced = window.matchMedia(
            '(prefers-reduced-motion: reduce)'
        ).matches
        if (reduced) {
            setVisible(true)
            return
        }

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        setVisible(true)
                        observer.disconnect()
                    }
                })
            },
            { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
        )
        observer.observe(el)
        return () => observer.disconnect()
    }, [])

    const base = effect === 'draw' ? style.draw : style.reveal
    const shown =
        effect === 'draw'
            ? visible
                ? style.drawVisible
                : ''
            : visible
              ? style.visible
              : ''

    return (
        <Tag
            ref={ref}
            className={`${base} ${shown} ${className}`}
            style={delay ? { transitionDelay: `${delay}ms` } : undefined}
        >
            {children}
        </Tag>
    )
}
