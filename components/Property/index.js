'use client'
import { CldImage } from 'next-cloudinary'

import Link from 'next/link'
import style from './Property.module.css'
import PropertyInformation from '../PropertyInformation'

export default function Property({ property }) {
    return (
        <Link
            href={`/properties/${property.slug.current}`}
            className={style.base}
        >
            <div
                style={{
                    aspectRatio: '16 / 9',
                }}
            >
                <CldImage
                    src={property.thumbnail.secure_url}
                    width="384"
                    height="216"
                    className={style.image}
                    alt="Thumbnail image of a property"
                    sizes="100vw"
                    // aspectRatio="16:9"
                    crop="fill"
                    // fill={true}
                    // alt=""
                    aspectRatio="16:9"
                />
            </div>
            <div className={style.container}>
                <p>
                    <strong>{property.floorplan.name}</strong>
                </p>
                <PropertyInformation property={property} />
            </div>
        </Link>
    )
}
