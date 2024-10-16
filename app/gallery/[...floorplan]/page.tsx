import type { Metadata, ResolvingMetadata } from 'next'

import Catchall from '@/components/Catchall'
import CustomerStory from '@/components/CustomerStory'
import Footer from '@/components/Footer'
import Image from 'next/image'
import Nav from '@/components/Nav'
// import OpenGraph from '@/components/OpenGraph'
import PropertyInformation from '@/components/PropertyInformation'
import RelatedContent from '@/components/RelatedContent'
import StandaloneLink from '@/components/StandaloneLink'
import VideoPlayer from '@/components/VideoPlayer'

import style from './page.module.css'

import db from '@/utils/db'
import { USDollar } from '@/utils/currency'

export async function generateStaticParams() {
    // const posts = await fetch('https://.../posts').then((res) => res.json())

    const floorplans = await db.floorplan.findMany({})
    // return floorplan

    return floorplans.map((floorplan) => ({
        slug: `${floorplan.floorplan}/${floorplan.location}`,
    }))
}

const getFloorplan = async (slug) => {
    const floorplan = await db.floorplan.findFirst({
        where: {
            floorplan: slug[0],
            location: slug[1],
        },
    })
    return floorplan
}

export async function generateMetadata(
    { params },
    parent: ResolvingMetadata
): Promise<Metadata> {
    const slug = params.floorplan
    let dynamicTitle = ''

    if (slug.length === 2) {
        dynamicTitle = `${formatDynamicTitle(slug[0])} - ${formatDynamicTitle(
            slug[1]
        )}`
    } else {
        dynamicTitle = formatDynamicTitle(slug[0])
    }
    return {
        title: `${dynamicTitle} - Backyard Estates'`,
    }
}

function formatDynamicTitle(slug: string) {
    let dynamicTitle = ''
    const words = slug.split('-')
    if (words.length === 2) {
        dynamicTitle = `${
            words[0].charAt(0).toUpperCase() + words[0].slice(1)
        } ${words[1].charAt(0).toUpperCase() + words[1].slice(1)}  - Floor plan`
    } else {
        if (words[0] === 'custom') {
            dynamicTitle = 'Custom Estate'
        } else {
            dynamicTitle = `${
                words[0].charAt(0).toUpperCase() + words[0].slice(1)
            } property`
        }
    }
    return dynamicTitle
}

export default async function Floorplan({ params }) {
    const { floorplan } = params
    const property = await getFloorplan(floorplan)

    return (
        <>
            {/* <OpenGraph
                title={`Backyard Estates`}
                description={`${property?.title} floor plan`}
                image={property?.ogImage}
            /> */}
            <Nav />
            <main className="centered generous">
                <div className={style.content}>
                    <h1>{property?.title}</h1>
                    <PropertyInformation floorplan={property} />
                    <div className={style.price}>
                        {property?.price !== null && (
                            <h3 className={style.subhead}>
                                all-in-price starts at
                            </h3>
                        )}

                        {property?.price !== null && (
                            <p className={style.price}>
                                {USDollar.format(property?.price!)}
                            </p>
                        )}
                        <div className={style.linkGroup}>
                            {property?.floorPlanPDF !== null && (
                                <StandaloneLink
                                    icon="download"
                                    href={`/pdf/${property?.floorPlanPDF}`}
                                    // download
                                >
                                    Download floor plan
                                </StandaloneLink>
                            )}

                            <StandaloneLink href="/standard-inclusions">
                                View inclusions
                            </StandaloneLink>
                        </div>
                    </div>
                    <div className={style.videoAndImage}>
                        {property?.floorPlanImage !== null && (
                            <Image
                                src={`/images/floor-plans/${property?.floorPlanImage}`}
                                alt={`3D floor plan image of ${property?.title}`}
                                width={640}
                                height={360}
                                className={style.image}
                                style={{ flex: 1 }}
                                priority
                            />
                        )}
                        {property?.wistiaID !== null && (
                            <VideoPlayer wistiaID={property?.wistiaID} />
                        )}
                    </div>
                </div>
                <CustomerStory story={property} hideDetails>
                    <h2 style={{ textAlign: 'left' }}>
                        Every estate includes:
                    </h2>
                    <ul>
                        <li>Luxury vinyl planking</li>
                        <li>Name brand stainless-steel kitchen appliances</li>
                        <li>Real quartz countertops</li>
                        <li>Recessed lighting in every room</li>
                        <li>
                            Clerestory windows with vaulted ceilings in kitchen
                            and living room
                        </li>
                        <li>2-inch vinyl blinds on windows</li>
                        <li>Mirrored closet doors in bedrooms</li>
                        <li>Smart ceiling fans</li>
                    </ul>
                </CustomerStory>
                <RelatedContent properties={property?.related} />
                <Catchall />
            </main>
            <Footer />
        </>
    )
}
