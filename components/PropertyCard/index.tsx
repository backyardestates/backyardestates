'use client'

import Link from 'next/link'
import style from './PropertyCard.module.css'
import Image from 'next/image'
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
    console.log(content)

    return (
        <Link
            href={`/properties/${content.slug}`}
            className={style.base}
        >
            <div
            >
                <Image
                    src={content.photos[0].url}
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
