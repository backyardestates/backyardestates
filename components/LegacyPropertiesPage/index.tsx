import { type SanityDocument } from 'next-sanity'
import { client } from '@/sanity/client'
const options = { next: { revalidate: 30 } }

import { notFound } from 'next/navigation'

import Catchall from '@/components/AttentionCTA'
import CustomerStory from '@/components/CustomerStory'
import PropertyHero from '@/components/PropertyHero'
import FloorplanInformation from '@/components/FloorplanInformation'
import Footer from '@/components/Footer'
import Nav from '@/components/Nav'
import RelatedProperties from '@/components/RelatedProperties'
import StandaloneLink from '@/components/StandaloneLink'

import style from './LegacyPropertiesPage.module.css'

import { USDollar } from '@/utils/currency'
import AttentionCTA from '@/components/AttentionCTA'
import { RELATED_PROPERTIES_QUERY } from '@/sanity/queries'

const PROPERTY_QUERY = `
    *[_type == "property" && slug.current == $slug][0]{
    _id,name,location,body,images,bed,bath,sqft,price,download,videoID,floorplan->{name,drawing,floorPlanPDF,download,relatedProperties[]->{name,thumbnail,slug,name,bed,bath,sqft,floorplan->{name,bed,bath,sqft,slug}}}}`

export default async function LegacyPropertiesPage({ params }) {
    const slug = params
    const property = await client.fetch<SanityDocument>(
        PROPERTY_QUERY,
        { slug },
        options
    )

    const relatedProperties = await client.fetch<SanityDocument[]>(
        RELATED_PROPERTIES_QUERY,
        { slug },
        options
    )

    const { bed, bath, sqft, price } = property

    if (!property) {
        notFound()
    }

    const completedRelatedProperties = relatedProperties.filter(
        (p: any) => p.completed === true
    )

    return (
        <>
            <Nav />
            <main className={style.base}>
                <div className={style.content}>
                    <h1>{property.floorplan.name}</h1>

                    <FloorplanInformation
                        bed={bed}
                        bath={bath}
                        sqft={sqft}
                        price={price}
                    />
                    <p className={style.subhead}>{property.location}</p>
                    <div className={style.price}>
                        {property.price !== null && (
                            <h3 className={style.subhead}>
                                all-in-price starts at
                            </h3>
                        )}

                        {property.price !== null && (
                            <p className={style.price}>
                                {USDollar.format(price!)}
                            </p>
                        )}
                    </div>
                    <PropertyHero property={property} />
                </div>
                <CustomerStory story={property} />

                <AttentionCTA
                    eyebrow="Inspired by this ADU?"
                    title="Designed specifically for your property"
                    description="With years of experience building ADUs across Southern California, we begin by carefully reviewing your property, local requirements, and long-term goals. From there, we outline realistic options so you can move forward with clarity and confidence."
                    primaryLabel="See what your property allows"
                    primaryHref="/talk-to-an-adu-specialist"
                    secondaryText="Learn about our approach"
                    secondaryHref="/about-us/our-process"
                />
                <RelatedProperties
                    properties={completedRelatedProperties}
                />
            </main>
            <Footer />
        </>
    )
}
