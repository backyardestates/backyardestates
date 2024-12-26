'use client'

import Link from 'next/link'
import style from './Card.module.css'
import { CldImage } from 'next-cloudinary'
import PropertyInformation from '../PropertyInformation'

import { Cloudinary } from '@cloudinary/url-gen'

// Import the responsive plugin
import { AdvancedImage, responsive } from '@cloudinary/react'

// Create and configure your Cloudinary instance.
const cld = new Cloudinary({
    cloud: {
        cloudName: 'backyardestates',
    },
})

export default function Card({ property }) {
    // console.log(property.thumbnail.public_id)

    const myImage = cld.image(property.thumbnail.public_id)

    // const cloudinaryURL = `https://res.cloudinary.com/backyardestates/image/upload/c_limit/h_186/w_330/v1/`
    // https://res.cloudinary.com/backyardestates/image/upload/c_scale,w_320/properties/ys555uupm1fhaimacpps
    return (
        <Link
            href={`/gallery/${property.floorplan.slug.current}/${property.slug.current}`}
            className={style.base}
        >
            <AdvancedImage
                cldImg={myImage}
                plugins={[responsive({ steps: [330, 640] })]}
                className={style.img}
            />
            <div className={style.content}>
                <p className={style.location}>
                    <strong>{property.floorplan.name}</strong>
                </p>
                <PropertyInformation property={property} />
            </div>
        </Link>
    )
}
