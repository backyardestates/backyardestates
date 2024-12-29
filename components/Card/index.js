'use client'

import Link from 'next/link'
import style from './Card.module.css'
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

export default function Card({ content, isFloorplan = false }) {
    // console.log(content)
    // console.log(content.drawing.secure_url)

    const { bed, bath, sqft, price } = content

    const myImage = cld.image(content.drawing.public_id)

    // const cloudinaryURL = `https://res.cloudinary.com/backyardestates/image/upload/c_limit/h_186/w_330/v1/`
    // https://res.cloudinary.com/backyardestates/image/upload/c_scale,w_320/properties/ys555uupm1fhaimacpps
    return (
        <Link href={`/${content.slug.current}`} className={style.base}>
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
                    // showPrice
                />
            </div>
        </Link>
    )
}
