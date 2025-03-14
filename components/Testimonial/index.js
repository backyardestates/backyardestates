'use client'

import { CldImage } from 'next-cloudinary'
import StandaloneLink from '../StandaloneLink'
import style from './Testimonial.module.css'

export default function Testimonial({ story }) {
    const { names, portrait, property, slug, quote } = story
    const cloudinaryURL = `https://res.cloudinary.com/backyardestates/image/upload/w_96/q_auto:low/v1`
    return (
        <div className={style.base}>
            <div className={style.border}>
                <CldImage
                    src={`${cloudinaryURL}/${story.portrait.public_id}`}
                    width="96"
                    height="96"
                    className={style.portrait}
                    alt={`Portrait image of ${names}`}
                />
                <p className={style.name}>{names}</p>
                <p className={style.small_caps}>{property.location}</p>
                <p className={style.quote}>&ldquo;{quote}&rdquo;</p>
                <StandaloneLink
                    href={`/customer-stories/${slug.current}`}
                >{`${names}'s story`}</StandaloneLink>
                <p className={style.floor_plan}>{property.floorplan.name}</p>
                <p className={style.small_caps}>Floor plan</p>
            </div>
        </div>
    )
}
