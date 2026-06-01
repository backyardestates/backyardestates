'use client'

import { useRef, useState } from 'react'
import Link from 'next/link'
import { CldImage } from 'next-cloudinary'
import { Bed, Bath, Ruler } from 'lucide-react'

import { USDollar } from '@/utils/currency'

import style from './FloorplansGrid.module.css'

const GROUP_DEFS = [
    {
        id: 0,
        title: 'Studio',
        use: 'A private home office, gym, or guest space.',
    },
    {
        id: 1,
        title: '1 bedroom',
        use: 'A comfortable rental or in-law suite.',
    },
    {
        id: 2,
        title: '2 bedrooms',
        use: 'The rental-income favorite, with room for a small family.',
    },
    {
        id: 3,
        title: '3 bedrooms',
        use: 'Full multigenerational living with space to grow.',
    },
]

const sqftRange = (min, max) =>
    min === max
        ? `${min.toLocaleString()} sq ft`
        : `${min.toLocaleString()}–${max.toLocaleString()} sq ft`

export default function FloorplansGrid({ properties }) {
    const [selected, setSelected] = useState(99)
    const gridRef = useRef<HTMLDivElement>(null)

    const groups = GROUP_DEFS.map((g) => {
        const plans = properties.filter((p) => p.bed === g.id)
        if (!plans.length) return null
        const sqfts = plans.map((p) => p.sqft)
        const prices = plans
            .map((p) => p.price)
            .filter((p) => p !== null && p !== undefined)
        return {
            ...g,
            count: plans.length,
            minSqft: Math.min(...sqfts),
            maxSqft: Math.max(...sqfts),
            minPrice: prices.length ? Math.min(...prices) : null,
        }
    }).filter((g): g is NonNullable<typeof g> => g !== null)

    const allSqfts = properties.map((p) => p.sqft).filter(Boolean)
    const filterOptions = [
        {
            id: 99,
            title: 'All plans',
            meta: allSqfts.length
                ? sqftRange(Math.min(...allSqfts), Math.max(...allSqfts))
                : null,
        },
        ...groups.map((g) => ({
            id: g.id,
            title: g.title,
            meta: sqftRange(g.minSqft, g.maxSqft),
        })),
    ]

    const filteredProperties =
        selected !== 99
            ? properties.filter((property) => property.bed === selected)
            : properties

    const goToFilter = (id) => {
        setSelected(id)
        gridRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }

    return (
        <>
            <div
                className={style.filterBar}
                ref={gridRef}
                role="group"
                aria-label="Filter floor plans by bedrooms"
            >
                {filterOptions.map((opt) => (
                    <button
                        key={opt.id}
                        type="button"
                        className={
                            selected === opt.id ? style.filterActive : style.filter
                        }
                        aria-pressed={selected === opt.id}
                        onClick={() => setSelected(opt.id)}
                    >
                        <span className={style.filterLabel}>{opt.title}</span>
                        {opt.meta && (
                            <span className={style.filterMeta}>{opt.meta}</span>
                        )}
                    </button>
                ))}
            </div>

            <ul className={style.cards}>
                {filteredProperties.map((property) => {
                    const { bed, bath, sqft, price, name, slug, drawing } =
                        property
                    return (
                        <li key={property._id} className={style.card}>
                            <Link
                                href={`/floorplans/${slug.current}`}
                                className={style.cardLink}
                            >
                                <div className={style.imageWrapper}>
                                    {drawing?.public_id && (
                                        <CldImage
                                            src={drawing.public_id}
                                            alt={`${name} floor plan drawing`}
                                            fill
                                            sizes="(max-width: 600px) 100vw, (max-width: 960px) 50vw, 25vw"
                                            className={style.image}
                                        />
                                    )}
                                </div>
                                <div className={style.cardBody}>
                                    <span className={style.cardName}>
                                        {name}
                                    </span>
                                    <ul className={style.specs}>
                                        <li>
                                            <Bed
                                                className={style.specIcon}
                                                aria-hidden="true"
                                            />
                                            {bed === 0 ? 'Studio' : `${bed} Bed`}
                                        </li>
                                        <li>
                                            <Bath
                                                className={style.specIcon}
                                                aria-hidden="true"
                                            />
                                            {bath} Bath
                                        </li>
                                        <li>
                                            <Ruler
                                                className={style.specIcon}
                                                aria-hidden="true"
                                            />
                                            {sqft} sq ft
                                        </li>
                                    </ul>
                                    {price !== null && price !== undefined && (
                                        <div className={style.priceRow}>
                                            <span className={style.priceLabel}>
                                                All-in from
                                            </span>
                                            <span className={style.priceValue}>
                                                {USDollar.format(price)}
                                            </span>
                                        </div>
                                    )}
                                    <span className={style.viewLink}>
                                        View plan &amp; pricing →
                                    </span>
                                </div>
                            </Link>
                        </li>
                    )
                })}
            </ul>

            <section className={style.guide} aria-labelledby="plan-guide-heading">
                <div className={style.guideHeader}>
                    <h2 id="plan-guide-heading" className={style.guideTitle}>
                        Which plan is right for you?
                    </h2>
                    <p className={style.guideSubtitle}>
                        Start with what you need the space to do — we&rsquo;ll
                        show the plans that fit.
                    </p>
                </div>
                <ul className={style.guideCards}>
                    {groups.map((g) => (
                        <li key={g.id}>
                            <button
                                type="button"
                                className={style.guideCard}
                                onClick={() => goToFilter(g.id)}
                            >
                                <span className={style.guideCardTitle}>
                                    {g.title}
                                </span>
                                <span className={style.guideCardUse}>
                                    {g.use}
                                </span>
                                <span className={style.guideCardMeta}>
                                    {sqftRange(g.minSqft, g.maxSqft)}
                                    {g.minPrice
                                        ? ` · From ${USDollar.format(g.minPrice)}`
                                        : ''}
                                </span>
                                <span className={style.guideCardCta}>
                                    See {g.count}{' '}
                                    {g.count > 1 ? 'plans' : 'plan'} →
                                </span>
                            </button>
                        </li>
                    ))}
                </ul>
            </section>
        </>
    )
}
