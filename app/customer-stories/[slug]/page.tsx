import { sanityFetch } from '@/sanity/live'
import { defineQuery } from 'next-sanity'
import { notFound } from 'next/navigation'

import type { Metadata } from 'next'

import Catchall from '@/components/Catchall'
import CustomerStory from '@/components/CustomerStory'
import Footer from '@/components/Footer'
import Nav from '@/components/Nav'
import PropertyInformation from '@/components/PropertyInformation'
import VideoPlayer from '@/components/VideoPlayer'
import RelatedProperties from '@/components/RelatedProperties'

import style from './page.module.css'

const temp = {
    title: 'Estate 800',
    date: '2023-12-22',
    city: 'Rancho Cucamonga',
    bed: 2,
    bath: 2,
    sqft: 800,
    img: 'estate350-cover.png',
    price: '299,999',
    portrait: 'portrait-02.jpg',
    images: [
        'vanessa-and-gabriel-01.jpg',
        'vanessa-and-gabriel-02.jpg',
        'vanessa-and-gabriel-03.jpg',
        'vanessa-and-gabriel-04.jpg',
        'vanessa-and-gabriel-05.jpg',
        'vanessa-and-gabriel-06.jpg',
        'vanessa-and-gabriel-07.jpg',
    ],
    related: ['750-000', '751-000', '950-000', '1200-000'],
    ogImage: 'backyard-estates-OG.png',
}

export const metadata: Metadata = {
    title: "Vanessa and Gabriel's customer story - Backyard Estates",
    description:
        "Gabriel and Vanessa, teamed up with Gabriel's parents, Grandma and Grandpa, to make a strategic move that benefited everyone involved. Seeking closer proximity to their grandchildren, Gabriel's parents sold their home and, along with Gabriel and Vanessa, purchased a new property in their ideal neighborhood. The plan? Build an ADU to maintain independence for Grandma and Grandpa, while creating a larger support system for the growing family.",
}

const STORY_QUERY = defineQuery(`*[
    _type == "story" &&
    slug.current == $slug
  ][0]{names, purpose, wistiaId, body, images, property->{floorplan->{name,bed,bath,sqft,price,relatedProperties[]->{bed,bath,sqft,thumbnail,slug}}}}`)

export default async function Story({
    params,
}: {
    params: Promise<{ slug: string }>
}) {
    const { data: story } = await sanityFetch({
        query: STORY_QUERY,
        params: await params,
    })

    if (!story) {
        notFound()
    }

    return (
        <>
            <Nav />
            <main className={style.base}>
                <div className={style.content}>
                    <h1>{story.names}</h1>
                    <p className={style.intro}>{story.purpose}</p>
                    <h2>{story.property.floorplan.name}</h2>
                    <PropertyInformation property={story.property} />
                    <VideoPlayer wistiaID={story.wistiaId} />
                </div>
                <CustomerStory story={story} />
                <RelatedProperties
                    properties={story.property.floorplan.relatedProperties}
                />
                <Catchall />
            </main>
            <Footer />
        </>
    )
}
