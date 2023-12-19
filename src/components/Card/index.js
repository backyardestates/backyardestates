import Link from 'next/link'
import style from './Card.module.css'
import Image from 'next/image'
import PropertyInformation from '../PropertyInformation'

export default function Card({ estate }) {
    const url = `/floor-plans/${estate.slug}`
    const title = estate.frontmatter.title
    const bed = estate.frontmatter.bed
    const bath = estate.frontmatter.bath
    const sqft = estate.frontmatter.sqft
    const city = estate.frontmatter.city

    const img = estate.frontmatter.img

    return (
        <Link href={url} className={style.base}>
            <Image
                src={`/images/property/${img}`}
                width={640}
                height={360}
                alt="Alt"
                className={style.img}
                style={{ maxWidth: '100%', height: 'auto' }}
            />
            <div className={style.content}>
                <p className={style.location}>
                    <strong>{title}</strong>
                </p>
                <PropertyInformation floorplan={estate.frontmatter} />
            </div>
        </Link>
    )
}
