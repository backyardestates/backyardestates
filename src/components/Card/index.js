import Link from 'next/link'
import style from './Card.module.css'
import Image from 'next/image'
import PropertyInformation from '../PropertyInformation'

export default function Card({ estate }) {
    const title = estate.frontmatter.title
    const img = estate.frontmatter.img

    // build slug
    const slugArray = estate.slug.split(',')
    let builtSlug = ''
    slugArray.forEach((element) => {
        builtSlug += element + '/'
    })

    const url = `/floor-plans/${builtSlug}`

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
