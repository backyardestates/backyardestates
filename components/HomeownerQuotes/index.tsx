import Link from 'next/link'
import { Quote, Star } from 'lucide-react'

import style from './HomeownerQuotes.module.css'

export interface HomeownerQuote {
    names: string
    quote: string
    slug?: string
    portraitUrl?: string
    city?: string
}

export default function HomeownerQuotes({
    quotes,
}: {
    quotes: HomeownerQuote[]
}) {
    if (!quotes || quotes.length === 0) return null

    return (
        <section className={style.section}>
            <div className={style.intro}>
                <span className={style.eyebrow}>
                    From the families who built with us
                </span>
                <h2 className={style.title}>What homeowners say</h2>
            </div>

            <ul className={style.grid}>
                {quotes.map((q, i) => {
                    const inner = (
                        <>
                            <div className={style.cardTop}>
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
                                    aria-hidden="true"
                                />
                            </div>
                            <p className={style.quote}>{q.quote}</p>
                            <div className={style.person}>
                                {q.portraitUrl ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img
                                        className={style.avatar}
                                        src={q.portraitUrl}
                                        alt={q.names}
                                        loading="lazy"
                                    />
                                ) : (
                                    <span
                                        className={style.avatarFallback}
                                        aria-hidden="true"
                                    >
                                        {q.names?.[0] ?? '“'}
                                    </span>
                                )}
                                <span className={style.meta}>
                                    <span className={style.name}>
                                        {q.names}
                                    </span>
                                    <span className={style.role}>
                                        Homeowner
                                        {q.city ? ` · ${q.city}` : ''}
                                    </span>
                                </span>
                            </div>
                            {q.slug && (
                                <span className={style.storyLink}>
                                    Watch their story →
                                </span>
                            )}
                        </>
                    )

                    return (
                        <li key={q.slug || i} className={style.card}>
                            {q.slug ? (
                                <Link
                                    href={`/customer-stories/${q.slug}`}
                                    className={style.cardLink}
                                >
                                    {inner}
                                </Link>
                            ) : (
                                <div className={style.cardStatic}>{inner}</div>
                            )}
                        </li>
                    )
                })}
            </ul>
        </section>
    )
}
