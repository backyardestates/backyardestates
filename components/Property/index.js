import Image from 'next/image'
import Link from 'next/link'
import style from './Property.module.css'
import PropertyInformation from '../PropertyInformation'

export default function Property({ floorplan }) {
    // build full url slug
    let urlSlug = ''
    if (floorplan.location !== '') {
        urlSlug = `${floorplan.floorplan}/${floorplan.location}`
    } else {
        urlSlug = `${floorplan.floorplan}/${floorplan.location}`
    }
    return (
        <Link href={`/gallery/${urlSlug}`} className={style.base}>
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
