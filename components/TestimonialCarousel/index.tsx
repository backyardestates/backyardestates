'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import {
    Quote,
    Star,
    ArrowRight,
    ChevronLeft,
    ChevronRight,
} from 'lucide-react'

import StoryVideo from '../StoryVideo'
import style from './TestimonialCarousel.module.css'

export interface Testimonial {
    wistiaId?: string
    quote: string
    names: string
    slug?: string
    portraitUrl?: string
    city?: string
}

/**
 * One unified testimonial card (video or portrait + quote + name) that
 * auto-advances across every testimonial. Pauses on hover/focus, respects
 * reduced-motion, and exposes dots + prev/next for manual control.
 */
export default function TestimonialCarousel({
    items,
    cityName,
    interval = 4000,
}: {
    items: Testimonial[]
    cityName: string
    interval?: number
}) {
    const count = items.length
    const [index, setIndex] = useState(0)
    const [paused, setPaused] = useState(false)

    const go = useCallback(
        (i: number) => setIndex(((i % count) + count) % count),
        [count]
    )

    useEffect(() => {
        if (count <= 1 || paused) return
        if (
            typeof window !== 'undefined' &&
            window.matchMedia('(prefers-reduced-motion: reduce)').matches
        )
            return
        const id = window.setInterval(
            () => setIndex((p) => (p + 1) % count),
            interval
        )
        return () => window.clearInterval(id)
    }, [count, paused, interval])

    if (!count) return null

    const t = items[index]
    const hasMedia = Boolean(t.wistiaId || t.portraitUrl)

    return (
        <div
            className={style.wrap}
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
            onFocusCapture={() => setPaused(true)}
            onBlurCapture={() => setPaused(false)}
        >
            <div className={style.stage} aria-live="polite">
                <article
                    key={index}
                    className={`${style.slide} ${
                        hasMedia ? style.slideMedia : style.slideQuoteOnly
                    }`}
                >
                    {t.wistiaId ? (
                        <div className={style.media}>
                            <StoryVideo id={t.wistiaId} />
                        </div>
                    ) : t.portraitUrl ? (
                        <div className={style.portrait}>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={t.portraitUrl} alt={t.names} />
                        </div>
                    ) : null}

                    <div className={style.body}>
                        <span
                            className={style.stars}
                            role="img"
                            aria-label="Rated 5 out of 5 stars"
                        >
                            {Array.from({ length: 5 }, (_, s) => (
                                <Star
                                    key={s}
                                    className={style.star}
                                    aria-hidden="true"
                                />
                            ))}
                        </span>
                        <Quote
                            className={style.mark}
                            fill="currentColor"
                            aria-hidden="true"
                        />
                        <p className={style.quote}>{t.quote}</p>
                        <p className={style.name}>
                            {t.names}
                            <span className={style.meta}>
                                Homeowner · {t.city || cityName}
                            </span>
                        </p>
                        {t.slug && (
                            <Link
                                href={`/customer-stories/${t.slug}`}
                                className={style.link}
                            >
                                Watch their full story
                                <ArrowRight size={16} />
                            </Link>
                        )}
                    </div>
                </article>
            </div>

            {count > 1 && (
                <div className={style.controls}>
                    <button
                        type="button"
                        className={style.arrow}
                        onClick={() => go(index - 1)}
                        aria-label="Previous testimonial"
                    >
                        <ChevronLeft size={18} />
                    </button>
                    <div className={style.dots}>
                        {items.map((_, i) => (
                            <button
                                key={i}
                                type="button"
                                className={
                                    i === index ? style.dotActive : style.dot
                                }
                                onClick={() => go(i)}
                                aria-label={`Go to testimonial ${i + 1}`}
                                aria-current={i === index}
                            />
                        ))}
                    </div>
                    <button
                        type="button"
                        className={style.arrow}
                        onClick={() => go(index + 1)}
                        aria-label="Next testimonial"
                    >
                        <ChevronRight size={18} />
                    </button>
                </div>
            )}
        </div>
    )
}
