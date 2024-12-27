'use client'
import { CldImage } from 'next-cloudinary'

import Link from 'next/link'
import style from './Property.module.css'
import PropertyInformation from '../PropertyInformation'

export default function Property({ property }) {
    return (
        <Link
            href={`/gallery/${property.floorplan.slug.current}/${property.slug.current}`}
            className={style.base}
        >
            <CldImage
                src={property.thumbnail.secure_url}
                width="640"
                height="360"
                className={style.image}
                alt={property.name}
            />
            <div className={style.container}>
                <p>
                    <strong>{property.floorplan.name}</strong>
                </p>
                <PropertyInformation property={property} />
            </div>
        </Link>
    )
}
