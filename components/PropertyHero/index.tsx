'use client'

import { CldImage } from 'next-cloudinary'
import VideoPlayer from '@/components/VideoPlayer'

import style from './PropertyHero.module.css'

export default function PropertyHero({ property }) {
    return (
        <div className={style.videoAndImage}>
            {property.floorplan.propertyImage !== null &&
                property.floorplan.drawing !== null && (
                    <CldImage
                        src={property.floorplan.drawing.secure_url}
                        width="640"
                        height="360"
                        alt={`3D floor plan image of ${property.name}`}
                        className={style.image}
                        style={{ flex: 1 }}
                        priority
                    />
                )}
            {property.videoID !== null && (
                <VideoPlayer wistiaID={property.videoID} />
            )}
        </div>
    )
}
