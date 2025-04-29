import { sanityFetch } from '@/sanity/live'
import { defineQuery } from 'next-sanity'
import { notFound } from 'next/navigation'

import Catchall from '@/components/Catchall'
import CustomerStory from '@/components/CustomerStory'
import Footer from '@/components/Footer'
import Nav from '@/components/Nav'
import PropertyInfoHack from '@/components/PropertyInfoHack'
import VideoPlayer from '@/components/VideoPlayer'
import RelatedProperties from '@/components/RelatedProperties'

import style from './page.module.css'

const STORY_QUERY = defineQuery(`*[
    _type == "story" &&
    slug.current == $slug
  ][0]{names, purpose, wistiaId, body, images, property->{floorplan->{name,bed,bath,sqft,price,relatedProperties[]->{bed,bath,sqft,thumbnail,slug}}}}`)

const PROPERTY_QUERY = defineQuery(`*[
    _type == "story" &&
    slug.current == $slug
  ][0]{property->{bed,bath,sqft}}`)

// Dynamic metadata generation
export async function generateMetadata({
    params,
}: {
    params: Promise<{ slug: string }>
}) {
    const { data: story } = await sanityFetch({
        query: STORY_QUERY,
        params,
    })

    const title = `${story.names}'s customer story - Backyard Estates`
    const description = `${story.names}'s Backyard Estates customer story. ${story.purpose}`

    // Twitter 800px by 418px
    // Open Graph 1200px by 630px

    return {
        title: title,
        description: description,
        openGraph: {
            title: title,
            description: description,
            url: `https://www.backyardestates.com/customer-stories/${story.slug}`,
            siteName: 'Backyard Estates',
            images: [
                {
                    url: story.images?.[0]?.url || '/images/default-og.jpg',
                    width: 1200,
                    height: 630,
                    alt: title,
                },
            ],
            type: 'article',
        },
        twitter: {
            card: 'summary_large_image',
            title: title,
            description: description,
            images: [story.images?.[0]?.url || '/images/default-og.jpg'],
        },
    }
}

export default async function Story({
    params,
}: {
    params: Promise<{ slug: string }>
}) {
    const { data: story } = await sanityFetch({
        query: STORY_QUERY,
        params: await params,
    })

    const { data: property } = await sanityFetch({
        query: PROPERTY_QUERY,
        params: await params,
    })

    if (!story) {
        notFound()
    }

    if (property) {
        console.log('Property:', property)
    } else {
        console.error('Property not found for story:', story.slug)
    }

    return (
        <>
            <Nav />
            <main className={style.base}>
                <div className={style.content}>
                    <h1>{story.names}</h1>
                    <p className={style.intro}>{story.purpose}</p>
                    <h2>{story.property.floorplan.name}</h2>
                    <PropertyInfoHack property={property.property} />
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
