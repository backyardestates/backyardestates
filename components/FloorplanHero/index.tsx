'use client'

import { CldImage } from 'next-cloudinary'
import VideoPlayer from '@/components/VideoPlayer'

import style from './FloorplanHero.module.css'

export default function FloorplanHero({ floorplan }) {
    return (
        <div className={style.videoAndImage}>
            {floorplan.floorPlanImage !== null && (
                <CldImage
                    src={floorplan.drawing.secure_url}
                    width="640"
                    height="360"
                    alt={`3D floor plan image of ${floorplan.name}`}
                    className={style.image}
                    style={{ flex: 1 }}
                    priority
                />
            )}
            {floorplan.videoID !== null && (
                <VideoPlayer wistiaID={floorplan.videoID} />
            )}
        </div>
    )
}
