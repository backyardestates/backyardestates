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
                <CldImage
                    src={content.thumbnail.public_id}
                    width="330"
                    height="186"
                    className={style.img}
                    // alt={property.name}
                    sizes="100vw"
                    // aspectRatio="16:9"
                    crop="fill"
                    // fill={true}
                    alt="Thumbnail image of a property"
                    aspectRatio="16:9"
                />
            </div>
            {/* <AdvancedImage
                cldImg={myImage}
                plugins={[responsive({ steps: [330] })]}
                className={style.img}
            /> */}
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
