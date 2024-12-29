import { PortableText, type SanityDocument } from 'next-sanity'
import { client } from '@/sanity/client'
const FLOORPLANS_QUERY = `*[_type == "floorplan"]|order(orderID asc){_id, bed, bath, sqft, price, name, body, publishedAt, drawing, slug}`
const options = { next: { revalidate: 30 } }

import type { Metadata } from 'next'

import Catchall from '@/components/Catchall'
import Footer from '@/components/Footer'
import Masthead from '@/components/Masthead'
import Nav from '@/components/Nav'
import PropertiesGrid from '@/components/PropertiesGrid'

import style from './page.module.css'

export const metadata: Metadata = {
    title: 'ADU floorplans - Backyard Estates',
    description:
        'Browse recent projects and customer stories to discover the right Accessory Dwelling Unit (ADU) for your family',
}

export default async function Floorplan({ params }) {
    const properties = await client.fetch<SanityDocument[]>(
        FLOORPLANS_QUERY,
        {},
        options
    )

    return (
        <>
            <Masthead
                title="ADU floorplans"
                explanation="Browse our floorplans stories to discover the right Accessory Dwelling Unit (ADU) for your family"
            />
            <Nav />
            <main className={style.base}>
                <div className={style.content}>
                    <PropertiesGrid properties={properties} />
                </div>
                <Catchall />
            </main>
            <Footer />
        </>
    )
}
