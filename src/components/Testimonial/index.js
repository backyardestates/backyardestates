import Image from 'next/image'
import StandaloneLink from '@/components/StandaloneLink'
import style from './Testimonial.module.css'

export default function Testimonial({
    portrait = '',
    children,
    name,
    location,
    floorplan,
}) {
    return (
        <div className={style.base}>
            <div className={style.border}>
                {portrait !== '' && (
                    <Image
                        className={style.portrait}
                        src={portrait}
                        alt="Picture of the homeowner"
                        width={96}
                        height={96}
                    />
                )}
                <p className={style.name}>{name}</p>
                <p className={style.small_caps}>{location}</p>
                <p className={style.quote}>&ldquo;{children}&rdquo;</p>
                <StandaloneLink href="#">{`${name}'s story`}</StandaloneLink>
                <p className={style.floor_plan}>{floorplan}</p>
                <p className={style.small_caps}>Floor plan</p>
            </div>
        </div>
    )
}
