import { type SanityDocument } from 'next-sanity'
import { client } from '@/sanity/client'
const options = { next: { revalidate: 30 } }

import { notFound } from 'next/navigation'

import Catchall from '@/components/AttentionCTA'
import CustomerStory from '@/components/CustomerStory'
import FloorplanHero from '@/components/FloorplanHero'
import FloorplanInformation from '@/components/FloorplanInformation'
import Footer from '@/components/Footer'
import Nav from '@/components/Nav'
import RelatedProperties from '@/components/RelatedProperties'
import StandaloneLink from '@/components/StandaloneLink'

import style from './page.module.css'

import { USDollar } from '@/utils/currency'
import AttentionCTA from '@/components/AttentionCTA'

const FLOORPLAN_QUERY = `
    *[_type == "floorplan" && slug.current == $slug][0]{
    _id,name,body,images,bed,bath,sqft,price,drawing,download,videoID,relatedProperties[]->{name,thumbnail,slug,name,bed,bath,sqft,floorplan->{name,bed,bath,sqft,slug}}}`

export default async function Floorplan({ params }) {
    const { slug } = await params

    const floorplan = await client.fetch<SanityDocument>(
        FLOORPLAN_QUERY,
        { slug },
        options
    )

    const { bed, bath, sqft, price } = floorplan

    if (!floorplan) {
        notFound()
    }

    return (
        <>
            <Nav />
            <main className="centered generous">
                <div className={style.content}>
                    <h1>{floorplan.name}</h1>
                    <FloorplanInformation
                        bed={bed}
                        bath={bath}
                        sqft={sqft}
                        price={price}
                    />
                    <div className={style.price}>
                        {floorplan.price !== null && (
                            <h3 className={style.subhead}>
                                all-in-price starts at
                            </h3>
                        )}

                        {floorplan.price !== null && (
                            <p className={style.price}>
                                {USDollar.format(price!)}
                            </p>
                        )}
                        <div className={style.linkGroup}>
                            {floorplan.floorPlanPDF !== null && (
                                <StandaloneLink
                                    icon="download"
                                    href={floorplan.download.secure_url}
                                >
                                    Download floor plan
                                </StandaloneLink>
                            )}

                            <StandaloneLink href="/standard-inclusions">
                                View inclusions
                            </StandaloneLink>
                        </div>
                    </div>
                    <FloorplanHero floorplan={floorplan} />
                </div>
                <CustomerStory story={floorplan} />
                {floorplan.relatedProperties.length !== 0 && (
                    <RelatedProperties
                        properties={floorplan.relatedProperties}
                    />
                )}
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
