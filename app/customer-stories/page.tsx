import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight, Play, Quote, Star } from 'lucide-react'

import { client } from '@/sanity/client'

import Nav from '@/components/Nav'
import Footer from '@/components/Footer'
import AttentionCTA from '@/components/AttentionCTA'
import Reveal from '@/components/Reveal'
import JsonLd from '@/components/JsonLd'
import { reviewSchemas } from '@/lib/jsonLd'
import { buildMetadata } from '@/lib/seo'

import style from './page.module.css'

export const metadata = buildMetadata({
    title: 'ADU Customer Stories & Reviews',
    description:
        'Real families, real backyard homes. Hear directly from homeowners across the Inland Empire and Los Angeles area who built an ADU with Backyard Estates — why they built, how it went, and what it changed.',
    path: '/customer-stories',
})

const options = { next: { revalidate: 30 } }

const STORIES_QUERY = `*[_type == "story" && defined(slug.current)]
| order(coalesce(featured, false) desc, names asc){
    _id,
    names,
    quote,
    purpose,
    wistiaId,
    "slug": slug.current,
    portrait,
    property->{ address { city }, location, floorplan->{ name } }
}`

interface StoryRow {
    _id: string
    names?: string
    quote?: string
    purpose?: string
    wistiaId?: string
    slug: string
    portrait?: { secure_url?: string; url?: string }
    property?: {
        address?: { city?: string }
        location?: string
        floorplan?: { name?: string }
    }
}

export default async function CustomerStories() {
    const rows = await client.fetch<StoryRow[]>(STORIES_QUERY, {}, options)
    const stories = rows.filter((s) => s.names)

    const reviewsLd = reviewSchemas(
        stories.map((s) => ({
            names: s.names,
            quote: (s.quote || s.purpose)?.replace(/^["“”']+|["“”']+$/g, ''),
            city:
                s.property?.address?.city ||
                s.property?.location?.split(',')[0]?.trim(),
            floorplan: s.property?.floorplan?.name,
            slug: s.slug,
        }))
    )

    return (
        <>
            <JsonLd data={reviewsLd} />
            <Nav />
            <main className={style.main}>
                {/* ============ HERO ============ */}
                <header className={style.hero}>
                    <Reveal className={style.heroInner}>
                        <span className={style.eyebrow}>Customer stories</span>
                        <h1 className={style.title}>
                            Real families, real
                            <span className={style.accent}>
                                {' '}
                                backyard homes
                            </span>
                        </h1>
                        <p className={style.lede}>
                            Every story here is a homeowner who started exactly
                            where you are — wondering if an ADU could work for
                            their family, their lot, and their budget. Hear why
                            they built, how it went, and what it changed.
                        </p>
                    </Reveal>
                </header>

                {/* ============ STORY GRID ============ */}
                <section className={style.section}>
                    <div className={style.container}>
                        {stories.length === 0 ? (
                            <p className={style.empty}>
                                New stories are on the way — check back soon.
                            </p>
                        ) : (
                            <ul className={style.grid}>
                                {stories.map((s, i) => {
                                    const portraitUrl =
                                        s.portrait?.secure_url ||
                                        s.portrait?.url
                                    const city =
                                        s.property?.address?.city ||
                                        s.property?.location
                                            ?.split(',')[0]
                                            ?.trim()
                                    // Some quotes arrive from Sanity already
                                    // wrapped in quotation marks — strip them
                                    // so we don't render doubles.
                                    const quote = s.quote
                                        ?.trim()
                                        .replace(/^["“”']+|["“”']+$/g, '')
                                    return (
                                        <Reveal
                                            as="li"
                                            key={s._id}
                                            delay={(i % 3) * 60}
                                            className={style.card}
                                        >
                                            <Link
                                                href={`/customer-stories/${s.slug}`}
                                                className={style.cardLink}
                                            >
                                                <div className={style.thumbWrap}>
                                                    {portraitUrl ? (
                                                        <Image
                                                            src={portraitUrl}
                                                            alt={`${s.names} — Backyard Estates homeowners`}
                                                            fill
                                                            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                                                            className={
                                                                style.thumb
                                                            }
                                                        />
                                                    ) : (
                                                        <span
                                                            className={
                                                                style.thumbFallback
                                                            }
                                                            aria-hidden="true"
                                                        >
                                                            <Quote
                                                                className={
                                                                    style.thumbFallbackIcon
                                                                }
                                                            />
                                                        </span>
                                                    )}
                                                    {s.wistiaId && (
                                                        <span
                                                            className={
                                                                style.videoBadge
                                                            }
                                                        >
                                                            <Play
                                                                className={
                                                                    style.playIcon
                                                                }
                                                                aria-hidden="true"
                                                            />
                                                            Video story
                                                        </span>
                                                    )}
                                                    {city && (
                                                        <span
                                                            className={
                                                                style.cityBadge
                                                            }
                                                        >
                                                            {city}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className={style.cardBody}>
                                                    <span
                                                        className={style.stars}
                                                        role="img"
                                                        aria-label="Rated 5 out of 5 stars"
                                                    >
                                                        {Array.from(
                                                            { length: 5 },
                                                            (_, star) => (
                                                                <Star
                                                                    key={star}
                                                                    className={
                                                                        style.star
                                                                    }
                                                                    aria-hidden="true"
                                                                />
                                                            )
                                                        )}
                                                    </span>
                                                    <h2
                                                        className={
                                                            style.cardName
                                                        }
                                                    >
                                                        {s.names}
                                                    </h2>
                                                    {s.purpose && (
                                                        <p
                                                            className={
                                                                style.cardPurpose
                                                            }
                                                        >
                                                            {s.purpose}
                                                        </p>
                                                    )}
                                                    {quote && (
                                                        <p
                                                            className={
                                                                style.cardQuote
                                                            }
                                                        >
                                                            &ldquo;{quote}
                                                            &rdquo;
                                                        </p>
                                                    )}
                                                    <span
                                                        className={
                                                            style.cardCta
                                                        }
                                                    >
                                                        {s.wistiaId
                                                            ? 'Watch their story'
                                                            : 'Read their story'}{' '}
                                                        <ArrowRight
                                                            className={
                                                                style.ctaArrow
                                                            }
                                                        />
                                                    </span>
                                                </div>
                                            </Link>
                                        </Reveal>
                                    )
                                })}
                            </ul>
                        )}
                    </div>
                </section>

                <AttentionCTA
                    eyebrow="Your story starts here"
                    title="Ready to write yours?"
                    description="Every family on this page started with a single conversation. Expand your income and livable space with a thoughtfully designed ADU — our team handles everything, from feasibility to final build."
                    primaryLabel="Talk to an ADU Specialist"
                    primaryHref="/talk-to-an-adu-specialist"
                    secondaryText="Or call (909) 500-0917"
                    secondaryHref="tel:+19095000917"
                />
            </main>
            <Footer />
        </>
    )
}
