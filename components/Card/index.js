'use client'

import Link from 'next/link'
import style from './Card.module.css'
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

export default function Card({ content }) {
    const { bed, bath, sqft, price } = content
    const myImage = cld.image(content.drawing.public_id)

    return (
        <Link
            href={`/floorplans/${content.slug.current}`}
            className={style.base}
        >
            <AdvancedImage
                cldImg={myImage}
                plugins={[responsive({ steps: [330] })]}
                className={style.img}
            />
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
