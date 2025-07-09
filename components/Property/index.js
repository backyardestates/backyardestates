'use client'
import { CldImage } from 'next-cloudinary'

import Link from 'next/link'
import PropertyInformation from '../PropertyInformation'
import style from './Property.module.css'

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
                {/* <CldImage
                    src={property.thumbnail.secure_url}
                    width="640"
                    height="360"
                    className={style.image}
                    alt="Thumbnail image of a property"
                    sizes="100vw"
                    // aspectRatio="16:9"
                    crop="fill"
                    // fill={true}
                    // alt=""
                    aspectRatio="16:9"
                /> */}
                <CldImage
                    src={property.thumbnail.secure_url}
                    width="640"
                    height="360"
                    className={style.image}
                    sizes="(max-width: 1440px) 50vw, 33vw"
                    crop="fill"
                    alt="Thumbnail image of a property"
                    aspectRatio="16:9"
                    srcSet={`
                        ${property.thumbnail.secure_url}?w=328&h=185 328w,
                        ${property.thumbnail.secure_url}?w=656&h=370 656w,
                        ${property.thumbnail.secure_url}?w=984&h=555 984w
                    `}
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
