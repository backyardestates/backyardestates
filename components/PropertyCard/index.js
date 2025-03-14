'use client'

import Link from 'next/link'
import style from './PropertyCard.module.css'
import { CldImage } from 'next-cloudinary'
import FloorplanInformation from '../FloorplanInformation'

import { Cloudinary } from '@cloudinary/url-gen'

// Import the responsive plugin
import { AdvancedImage, responsive } from '@cloudinary/react'

// Create and configure your Cloudinary instance.
const cld = new Cloudinary({
    cloud: {
        cloudName: 'backyardestates',
    },
})

export default function PropertyCard({ content }) {
    const { bed, bath, sqft, price } = content
    // const myImage = cld.image(content.thumbnail.public_id)

    // console.log(content.thumbnail.public_id)

    return (
        <Link
            href={`/properties/${content.slug.current}`}
            className={style.base}
        >
            <div
                style={{
                    aspectRatio: '16 / 9',
                }}
            >
                {/* <CldImage
                    src={content.thumbnail.public_id}
                    width="328"
                    height="185"
                    className={style.img}
                    sizes="100vw"
                    crop="fill"
                    alt="Thumbnail image of a property"
                    aspectRatio="16:9"
                /> */}
                <CldImage
                    src={content.thumbnail.public_id}
                    width="328"
                    height="185"
                    className={style.img}
                    sizes="(max-width: 600px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    crop="fill"
                    alt="Thumbnail image of a property"
                    aspectRatio="16:9"
                    srcSet={`
                        ${content.thumbnail.public_id}?w=328&h=185 328w,
                        ${content.thumbnail.public_id}?w=656&h=370 656w,
                        ${content.thumbnail.public_id}?w=984&h=555 984w
                    `}
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
                    // showPrice
                />
            </div>
        </Link>
    )
}
