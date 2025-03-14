import { type SanityDocument } from 'next-sanity'
import { client } from '@/sanity/client'
const options = { next: { revalidate: 30 } }

import { notFound } from 'next/navigation'

import Catchall from '@/components/Catchall'
import CustomerStory from '@/components/CustomerStory'
import PropertyHero from '@/components/PropertyHero'
import FloorplanInformation from '@/components/FloorplanInformation'
import Footer from '@/components/Footer'
import Nav from '@/components/Nav'
import RelatedProperties from '@/components/RelatedProperties'
import StandaloneLink from '@/components/StandaloneLink'

import style from './page.module.css'

import { USDollar } from '@/utils/currency'

const PROPERTY_QUERY = `
    *[_type == "property" && slug.current == $slug][0]{
    _id,name,location,body,images,bed,bath,sqft,price,download,videoID,floorplan->{name,drawing,floorPlanPDF,download,relatedProperties[]->{name,thumbnail,slug,name,bed,bath,sqft,floorplan->{name,bed,bath,sqft,slug}}}}`

export default async function Property({ params }) {
    const { slug } = await params

    const property = await client.fetch<SanityDocument>(
        PROPERTY_QUERY,
        { slug },
        options
    )

    const { bed, bath, sqft, price } = property

    if (!property) {
        notFound()
    }

    return (
        <>
            <Nav />
            <main className="centered generous">
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
                        {/* <div className={style.linkGroup}>
                            {property.floorPlanPDF !== null && (
                                <StandaloneLink
                                    icon="download"
                                    href={
                                        property.floorplan.download.secure_url
                                    }
                                >
                                    Download floor plan
                                </StandaloneLink>
                            )}

                            <StandaloneLink href="/standard-inclusions">
                                View inclusions
                            </StandaloneLink>
                        </div> */}
                    </div>
                    <PropertyHero property={property} />
                </div>
                <CustomerStory story={property} />
                {property.floorplan.relatedProperties.length !== 0 && (
                    <RelatedProperties
                        properties={property.floorplan.relatedProperties}
                    />
                )}
                <Catchall />
            </main>
            <Footer />
        </>
    )
}
