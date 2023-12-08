import Image from 'next/image'
import Link from 'next/link'
import style from './Property.module.css'

export default function Property({
    estate,
    url = '#',
    img = '/estate350-fpo.png',
    floorplan = 'Estate 350',
    city = 'Arcadia',
    bed = 1,
    bath = 1,
    sqft = 350,
}) {
    // const url = `/floor-plans/${estate.slug}`
    // const title = estate.frontmatter.title
    // const bed = estate.frontmatter.bed
    // const bath = estate.frontmatter.bath
    // const sqft = estate.frontmatter.sqft
    // const city = estate.frontmatter.city
    return (
        <Link href={url} className={style.root}>
            <Image
                src={img}
                // alt="Hello"
                // width={384}
                // height={256}
                className={style.image}
                width={640}
                height={360}
                alt="Alt"
                // className={style.img}
                style={{ maxWidth: '100%', height: 'auto' }}
            />
            <div className={style.container}>
                <p>
                    <strong>{floorplan}</strong>
                    <br />
                    {`${city},CA`}
                </p>
                <ul>
                    <li>{bed} Bed</li>
                    <li>{bath} Bath</li>
                    <li>{sqft} sq.ft.</li>
                </ul>
            </div>
        </Link>
    )
}
