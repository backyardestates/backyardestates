import Image from 'next/image'
import Link from 'next/link'
import style from './Property.module.css'
import PropertyInformation from '@/components/PropertyInformation'

export default function Property({
    floorplan,
    url = 'estate-350',
    img = 'estate350-fpo.png',
    title = 'Estate 350',
    city = 'Arcadia',
    bed = 1,
    bath = 1,
    sqft = 350,
}) {
    // console.log(floorplan)
    url = `/floor-plans/${floorplan.slug}`
    // const title = estate.frontmatter.title
    // const bed = estate.frontmatter.bed
    // const bath = estate.frontmatter.bath
    // const sqft = estate.frontmatter.sqft
    // const city = estate.frontmatter.city
    return (
        <Link href={url} className={style.base}>
            <Image
                src={`/images/property/${img}`}
                className={style.image}
                width={640}
                height={360}
                alt="Alt"
                // style={{ maxWidth: '100%', height: 'auto' }}
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
