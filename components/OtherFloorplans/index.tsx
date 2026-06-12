'use client'

import Link from 'next/link'
import { CldImage } from 'next-cloudinary'
import { Bed, Bath, Ruler } from 'lucide-react'

import { USDollar } from '@/utils/currency'

import style from './OtherFloorplans.module.css'

interface CloudinaryAsset {
    public_id?: string
}

export interface OtherFloorplan {
    _id: string
    name: string
    slug: string
    bed?: number
    bath?: number
    sqft?: number
    price?: number | null
    drawing?: CloudinaryAsset
}

export default function OtherFloorplans({
    floorplans,
    eyebrow = 'Keep exploring',
    title = 'Explore other plans',
    subtitle,
    seeAllHref,
    seeAllLabel = 'See all ADU floor plans & pricing',
}: {
    floorplans: OtherFloorplan[]
    eyebrow?: string
    title?: string
    subtitle?: string
    seeAllHref?: string
    seeAllLabel?: string
}) {
    if (!floorplans || floorplans.length === 0) return null

    return (
        <section className={style.section}>
            <div className={style.intro}>
                <span className={style.eyebrow}>{eyebrow}</span>
                <h2 className={style.title}>{title}</h2>
                {subtitle && <p className={style.subtitle}>{subtitle}</p>}
            </div>

            <div className={style.scroller}>
                <ul className={style.track}>
                    {floorplans.map((fp) => (
                        <li key={fp._id} className={style.card}>
                            <Link
                                href={`/floorplans/${fp.slug}`}
                                className={style.cardLink}
                            >
                                <div className={style.imageWrapper}>
                                    {fp.drawing?.public_id && (
                                        <CldImage
                                            src={fp.drawing.public_id}
                                            alt={`${fp.name} floor plan drawing`}
                                            fill
                                            sizes="17rem"
                                            className={style.image}
                                        />
                                    )}
                                </div>
                                <div className={style.cardBody}>
                                    <span className={style.cardName}>
                                        {fp.name}
                                    </span>
                                    <ul className={style.specs}>
                                        <li>
                                            <Bed
                                                className={style.specIcon}
                                                aria-hidden="true"
                                            />
                                            {fp.bed === 0
                                                ? 'Studio'
                                                : `${fp.bed} Bed`}
                                        </li>
                                        {fp.bath != null && (
                                            <li>
                                                <Bath
                                                    className={style.specIcon}
                                                    aria-hidden="true"
                                                />
                                                {fp.bath} Bath
                                            </li>
                                        )}
                                        {fp.sqft != null && (
                                            <li>
                                                <Ruler
                                                    className={style.specIcon}
                                                    aria-hidden="true"
                                                />
                                                {fp.sqft} sq ft
                                            </li>
                                        )}
                                    </ul>
                                    {fp.price != null && (
                                        <div className={style.priceRow}>
                                            <span className={style.priceLabel}>
                                                All-in from
                                            </span>
                                            <span className={style.priceValue}>
                                                {USDollar.format(fp.price)}
                                            </span>
                                        </div>
                                    )}
                                    <span className={style.viewLink}>
                                        View plan &amp; pricing →
                                    </span>
                                </div>
                            </Link>
                        </li>
                    ))}
                </ul>
            </div>
            {seeAllHref && (
                <Link href={seeAllHref} className={style.seeAll}>
                    {seeAllLabel} →
                </Link>
            )}
        </section>
    )
}
