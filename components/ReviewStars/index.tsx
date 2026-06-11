// Visible Google review badge. Reads the real numbers from lib/business.ts so
// it always mirrors the AggregateRating JSON-LD (Google requires the rating to
// be visible on-page, not schema-only). Renders nothing until real data exists.
import { business, hasRealRating } from '@/lib/business'
import style from './ReviewStars.module.css'

export default function ReviewStars({
    className = '',
    label = true,
}: {
    className?: string
    label?: boolean
}) {
    if (!hasRealRating()) return null

    const { value, count } = business.rating
    const pct = Math.max(0, Math.min(100, (value / 5) * 100))
    const href = business.social.googleBusiness

    const stars = (
        <span
            className={style.stars}
            role="img"
            aria-label={`${value} out of 5 stars`}
        >
            <span className={style.starsTrack} aria-hidden="true">
                {'★★★★★'}
            </span>
            <span
                className={style.starsFill}
                style={{ width: `${pct}%` }}
                aria-hidden="true"
            >
                {'★★★★★'}
            </span>
        </span>
    )

    const inner = (
        <>
            {stars}
            {label && (
                <span className={style.text}>
                    <strong>{value.toFixed(1)}</strong> · {count} Google reviews
                </span>
            )}
        </>
    )

    if (href) {
        return (
            <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className={`${style.root} ${style.link} ${className}`}
                aria-label={`Rated ${value} out of 5 from ${count} Google reviews — read them on Google`}
            >
                {inner}
            </a>
        )
    }

    return <div className={`${style.root} ${className}`}>{inner}</div>
}
