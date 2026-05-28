'use client'

import { CldImage } from 'next-cloudinary'
import Link from 'next/link'
import { MapPin } from 'lucide-react'

import { cityOf } from '@/lib/estateFacts'
import style from './CustomFloorplanShowcase.module.css'

interface CloudinaryAsset {
    secure_url?: string
    url?: string
}

interface Estate {
    _id: string
    name: string
    slug: string
    bed?: number
    bath?: number
    sqft?: number
    aduType?: string
    customFloorplan?: boolean
    customFloorplanPicture?: CloudinaryAsset
    standardDrawing?: CloudinaryAsset
    address?: { city?: string | null } | null
    location?: string | null
}

export default function CustomFloorplanShowcase({
    estates,
    floorplanName,
}: {
    estates: Estate[]
    floorplanName?: string
}) {
    if (!estates || estates.length === 0) return null

    return (
        <section className={style.section}>
            <div className={style.intro}>
                <span className={style.eyebrow}>Built from the ground up</span>
                <h2 className={style.title}>
                    Estates built from the {floorplanName || 'this plan'}
                </h2>
                <p className={style.lede}>
                    Real homes built from this plan &mdash; some tailored with a
                    custom layout, some built standard. Tap any estate to see the
                    project.
                </p>
            </div>

            <ul className={style.grid}>
                {estates.map((estate) => {
                    const isCustom = estate.customFloorplan === true
                    const city = cityOf(estate)
                    const src =
                        estate.customFloorplanPicture?.secure_url ||
                        estate.customFloorplanPicture?.url ||
                        estate.standardDrawing?.secure_url ||
                        estate.standardDrawing?.url
                    if (!src) return null

                    const specs = [
                        estate.bed === 0
                            ? 'Studio'
                            : estate.bed
                              ? `${estate.bed} Bed`
                              : null,
                        estate.bath ? `${estate.bath} Bath` : null,
                        estate.sqft ? `${estate.sqft} sq. ft.` : null,
                    ].filter(Boolean)

                    return (
                        <li key={estate._id} className={style.card}>
                            <Link
                                href={`/properties/${estate.slug}`}
                                className={style.cardLink}
                            >
                                <div className={style.imageWrapper}>
                                    <CldImage
                                        src={src}
                                        alt={`${isCustom ? 'Custom' : 'Standard'} floor plan for the ${estate.name} estate`}
                                        fill
                                        sizes="(max-width: 768px) 100vw, 33vw"
                                        className={style.image}
                                    />
                                    <span
                                        className={`${style.badge} ${isCustom ? '' : style.badgeStandard}`}
                                    >
                                        {isCustom ? 'Custom' : 'Standard'}
                                    </span>
                                </div>
                                <div className={style.cardBody}>
                                    <span className={style.cardName}>
                                        {estate.name}
                                    </span>
                                    {city && (
                                        <span className={style.cardCity}>
                                            <MapPin
                                                className={style.cardCityIcon}
                                                aria-hidden="true"
                                            />
                                            {city}
                                        </span>
                                    )}
                                    {specs.length > 0 && (
                                        <span className={style.cardSpecs}>
                                            {specs.join(' · ')}
                                        </span>
                                    )}
                                    <span className={style.viewProject}>
                                        View project →
                                    </span>
                                </div>
                            </Link>
                        </li>
                    )
                })}
            </ul>
        </section>
    )
}
