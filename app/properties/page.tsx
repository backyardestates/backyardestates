import { type SanityDocument } from 'next-sanity'
import { client } from '@/sanity/client'
import { PROPERTIES_QUERY } from '@/sanity/queries'
const LEGACY_PROPERTIES_QUERY = `
  *[
    _type == "property" &&
    defined(thumbnail)
  ]
  | order(featured asc, publishedAt asc) {
    _id,
    bed,
    bath,
    sqft,
    price,
    name,
    body,
    publishedAt,
    thumbnail,
    slug
  }
`

const options = { next: { revalidate: 30 } }

import type { Metadata } from 'next'

import Footer from '@/components/Footer'
import Masthead from '@/components/Masthead'
import Nav from '@/components/Nav'
import PropertiesGrid from '@/components/PropertiesGrid'

import style from './page.module.css'
import AttentionCTA from '@/components/AttentionCTA'

export const metadata: Metadata = {
    title: 'Completed ADU properties - Backyard Estates',
    description:
        'Browse completed ADU properties to discover the right Accessory Dwelling Unit (ADU) for your family',
}
import {
    normalizeLegacyProperty,
    normalizeNewProperty,
} from '@/lib/normalizeProperty'

export default async function Floorplan() {
    const newProperties = await client.fetch(
        PROPERTIES_QUERY,
        {},
        options
    )

    const legacyProperties = await client.fetch(
        LEGACY_PROPERTIES_QUERY,
        {},
        options
    )

    // 🧹 Filter NEW properties to only completed ones
    const completedNewProperties = newProperties.filter(
        (p: any) => p.completed === true
    )

    const normalizedProperties = [
        ...completedNewProperties.map(normalizeNewProperty),
        ...legacyProperties.map(normalizeLegacyProperty),
    ].sort((a, b) => Number(b.featured) - Number(a.featured))

    return (
        <>
            <Masthead
                title="Completed ADUs"
                explanation="Browse completed ADU properties to discover the right Accessory Dwelling Unit (ADU) for your family"
            />
            <Nav />
            <main className={style.base}>
                <div className={style.content}>
                    <PropertiesGrid properties={normalizedProperties} />
                </div>
            </main>
            <Footer />
        </>
    )
}
