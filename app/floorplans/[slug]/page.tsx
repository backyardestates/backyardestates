import { type SanityDocument } from 'next-sanity'
import { client } from '@/sanity/client'
const options = { next: { revalidate: 30 } }

import { notFound } from 'next/navigation'

import Catchall from '@/components/Catchall'
import CustomerStory from '@/components/CustomerStory'
import FloorplanHero from '@/components/FloorplanHero'
import FloorplanInformation from '@/components/FloorplanInformation'
import Footer from '@/components/Footer'
import Nav from '@/components/Nav'
import RelatedContent from '@/components/RelatedContent'
import StandaloneLink from '@/components/StandaloneLink'

import style from './page.module.css'

import { USDollar } from '@/utils/currency'

const FLOORPLAN_QUERY = `
    *[_type == "floorplan" && slug.current == $slug][0]{
    _id,name,body,images,bed,bath,sqft,price,drawing,download,videoID,relatedProperties[]->{thumbnail,slug,floorplan->{name,bed,bath,sqft,slug}}}`

const PROPERTIES_QUERY = `
  *[_type == "property" && references($floorplanId)]{
    _id,
    name,
    thumbnail,
    slug,
    floorplan->{name,bed,bath,sqft,slug}
  }
`

export default async function Floorplan({ params }) {
    const { slug } = params

    const floorplan = await client.fetch<SanityDocument>(
        FLOORPLAN_QUERY,
        { slug },
        options
    )

    const { bed, bath, sqft, price } = floorplan

    if (!floorplan) {
        notFound()
    }

    const properties = await client.fetch(
        PROPERTIES_QUERY,
        {
            floorplanId: floorplan._id,
        },
        options
    )

    // console.log(floorplan)
    console.log(properties)

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
                {properties.length !== 0 && (
                    <RelatedContent properties={properties} />
                )}
                <Catchall />
            </main>
            <Footer />
        </>
    )
}
