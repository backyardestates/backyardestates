import { client } from '@/sanity/client'
import { type SanityDocument } from 'next-sanity'

import Property from '../Property'
import StandaloneLink from '../StandaloneLink'
import style from './Properties.module.css'

import { PROPERTIES_QUERY } from '@/sanity/queries'
import PropertyCard from '../PropertyCard'
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
                    <PropertyCard key={index} content={property} />
                ))}
            </div>
            <div className={style.centered}>
                <StandaloneLink href="/properties">
                    View all projects
                </StandaloneLink>
            </div>
        </div>
    )
}
