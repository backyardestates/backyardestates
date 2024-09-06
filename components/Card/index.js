import Link from 'next/link'
import style from './Card.module.css'
import Image from 'next/image'
import PropertyInformation from '../PropertyInformation'

export default function Card({ estate }) {
    return (
        <Link href={`/gallery/${estate.floorplan}`} className={style.base}>
            <Image
                src={`/images/property/${estate.image}`}
                width={640}
                height={360}
                alt={estate.title}
                className={style.img}
                style={{ maxWidth: '100%', height: 'auto' }}
            />
            <div className={style.content}>
                <p className={style.location}>
                    <strong>{estate.title}</strong>
                </p>
                <PropertyInformation floorplan={estate} />
            </div>
        </Link>
    )
}
