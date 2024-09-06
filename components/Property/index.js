import Image from 'next/image'
import Link from 'next/link'
import style from './Property.module.css'
import PropertyInformation from '../PropertyInformation'

export default function Property({ floorplan }) {
    return (
        <Link href={`/gallery/${floorplan.floorplan}`} className={style.base}>
            <Image
                src={`/images/property/${floorplan.image}`}
                className={style.image}
                width={640}
                height={360}
                alt={floorplan.title}
            />
            <div className={style.container}>
                <p>
                    <strong>{floorplan.title}</strong>
                </p>
                <PropertyInformation floorplan={floorplan} />
            </div>
        </Link>
    )
}
