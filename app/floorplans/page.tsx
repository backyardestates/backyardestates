import { PortableText, type SanityDocument } from 'next-sanity'
import { client } from '@/sanity/client'
import { FLOORPLANS_QUERY } from '@/sanity/queries'
const options = { next: { revalidate: 30 } }

import type { Metadata } from 'next'

import Catchall from '@/components/AttentionCTA'
import Footer from '@/components/Footer'
import Masthead from '@/components/Masthead'
import Nav from '@/components/Nav'
import FloorplansGrid from '@/components/FloorplansGrid'

import style from './page.module.css'
import AttentionCTA from '@/components/AttentionCTA'

export const metadata: Metadata = {
    title: 'ADU floorplans - Backyard Estates',
    description:
        'Browse recent projects and customer stories to discover the right Accessory Dwelling Unit (ADU) for your family',
}

export default async function Floorplan() {
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
                    <FloorplansGrid properties={properties} />
                </div>
                <AttentionCTA
                    eyebrow="Get Started"
                    title="Start your ADU journey today"
                    description="Expand your income and livable space with a thoughtfully designed ADU. Our team handles everything — from feasibility to final build."
                    primaryLabel="Talk to an ADU Specialist"
                    primaryHref="/talk-to-an-adu-specialist"
                    secondaryText="Or call (425) 494-4705"
                    secondaryHref="tel:+4254944705"
                />
            </main>
            <Footer />
        </>
    )
}
