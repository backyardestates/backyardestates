'use client'

import Link from 'next/link'
import style from './PropertyCard.module.css'
import Image from 'next/image'
import FloorplanInformation from '../FloorplanInformation'

export default function PropertyCard({ content }) {
    const { bed, bath, sqft, price } = content

    return (
        <Link
            href={`/properties/${content.slug.current ? content.slug.current : content.slug}`}
            className={style.base}
        >
            <div
            >
                <Image
                    src={content.photos ? content.photos[0].url : content.image}
                    alt="Thumbnail image of a property"
                    width={400}
                    height={225}
                    className={style.img}
                />
            </div>
            <div className={style.content}>
                <p className={style.location}>
                    <strong>{content.name}</strong>
                </p>
                <FloorplanInformation
                    bed={bed}
                    bath={bath}
                    sqft={sqft}
                    price={price}
                />
            </div>
        </Link>
    )
}
