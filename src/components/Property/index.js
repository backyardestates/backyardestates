import Image from 'next/image'
import Link from 'next/link'
import style from './Property.module.css'

export default function Property({
    href = '#',
    img = '/estate350-fpo.png',
    floorplan = 'Estate 350',
    location = 'Arcadia, CA',
    bed = 1,
    bath = 1,
    sqft = 350,
}) {
    return (
        <Link href={href} className={style.root}>
            <Image
                src={img}
                alt="Hello"
                width={384}
                height={256}
                className={style.image}
            />
            <div className={style.container}>
                <p>
                    <strong>{floorplan}</strong>
                    <br />
                    {location}
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
