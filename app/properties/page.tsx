import { type SanityDocument } from 'next-sanity'
import { client } from '@/sanity/client'
const PROPERTIES_QUERY = `*[_type == "property"]{_id, bed, bath, sqft, price, name, body, publishedAt, thumbnail, slug}`
const options = { next: { revalidate: 30 } }

import type { Metadata } from 'next'

import Catchall from '@/components/Catchall'
import Footer from '@/components/Footer'
import Masthead from '@/components/Masthead'
import Nav from '@/components/Nav'
import PropertiesGrid from '@/components/PropertiesGrid'

import style from './page.module.css'

export const metadata: Metadata = {
    title: 'Completed ADU properties - Backyard Estates',
    description:
        'Browse completed ADU properties to discover the right Accessory Dwelling Unit (ADU) for your family',
}

export default async function Floorplan() {
    const properties = await client.fetch<SanityDocument[]>(
        PROPERTIES_QUERY,
        {},
        options
    )

    // console.log(properties)

    return (
        <>
            <Masthead
                title="Completed ADUs"
                explanation="Browse completed ADU properties to discover the right Accessory Dwelling Unit (ADU) for your family"
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
