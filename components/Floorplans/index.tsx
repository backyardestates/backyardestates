import { type SanityDocument } from 'next-sanity'
import { client } from '@/sanity/client'

import Image from 'next/image'

import SectionTitle from '@/components/SectionTitle'
import ExploreFloorplans from '@/components/ExploreFloorplans'

import style from './Floorplans.module.css'

const FLOORPLANS_QUERY = `*[_type == "floorplan"]|order(orderID asc){orderID, isClickable, wistiaID,slug, name, bed, bath, length, width, price}`
const options = { next: { revalidate: 30 } }

export default async function Floorplans({ showNav = false }) {
    const floorplans = await client.fetch<SanityDocument[]>(
        FLOORPLANS_QUERY,
        {},
        options
    )

    return (
        <div className={style.base}>
            <div className={style.content}>
                <SectionTitle
                    title="Explore our floor plans"
                    explanation="We offer customized ADU floorplans to accomodate your family's needs."
                />

                <ExploreFloorplans showNav floorplans={floorplans} />
            </div>

            <div className={style.bg}>
                <Image
                    src="/greater-los-angeles.svg"
                    alt="Accessory Dwelling Unit (ADU)"
                    fill
                    sizes="100vw"
                    style={{
                        objectFit: 'cover',
                        objectPosition: 'center center',
                        opacity: 0.5,
                    }}
                />
            </div>
        </div>
    )
}
