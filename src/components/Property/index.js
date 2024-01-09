import Image from 'next/image'
import Link from 'next/link'
import style from './Property.module.css'
import PropertyInformation from '@/components/PropertyInformation'

export default function Property({
    floorplan,
    url = 'estate-350',
    img = 'estate350-fpo.png',
    title = 'Estate 350',
}) {
    // build slug
    const slugArray = floorplan.slug.split(',')
    let builtSlug = ''
    slugArray.forEach((element) => {
        builtSlug += element + '/'
    })
    url = `/gallery/${builtSlug}`
    return (
        <Link href={url} className={style.base}>
            <Image
                src={`/images/property/${img}`}
                className={style.image}
                width={640}
                height={360}
                alt="Alt"
            />
            <div className={style.container}>
                <p>
                    <strong>{title}</strong>
                </p>
                <PropertyInformation floorplan={floorplan.frontmatter} />
            </div>
        </Link>
    )
}
