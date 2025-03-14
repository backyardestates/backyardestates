import { type SanityDocument } from 'next-sanity'
import { client } from '@/sanity/client'

import StandaloneLink from '../StandaloneLink'
import style from './Properties.module.css'
import Property from '../Property'

const PROPERTIES_QUERY = `*[_type == "property"]|order(publishedAt desc){_id, slug, thumbnail, floorplan->{slug,name,bed,bath,sqft,price},publishedAt}`
const options = { next: { revalidate: 30 } }

export default async function Properties() {
    const properties = await client.fetch<SanityDocument[]>(
        PROPERTIES_QUERY,
        {},
        options
    )

    return (
        <div className={style.base}>
            <div className={style.properties}>
                {properties.map((property, index) => (
                    <Property key={index} property={property} />
                ))}
            </div>
            <div className={style.centered}>
                <StandaloneLink href="/gallery">
                    View all projects
                </StandaloneLink>
            </div>
        </div>
    )
}
