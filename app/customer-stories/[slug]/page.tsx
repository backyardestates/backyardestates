import { sanityFetch } from '@/sanity/live'
import { defineQuery } from 'next-sanity'
import { notFound } from 'next/navigation'

import Catchall from '@/components/AttentionCTA'
import CustomerStory from '@/components/CustomerStory'
import Footer from '@/components/Footer'
import Nav from '@/components/Nav'
import PropertyInfoHack from '@/components/PropertyInfoHack'
import VideoPlayer from '@/components/VideoPlayer'
import RelatedProperties from '@/components/RelatedProperties'

import style from './page.module.css'
import AttentionCTA from '@/components/AttentionCTA'

const STORY_QUERY = defineQuery(`*[
    _type == "story" &&
    slug.current == $slug
  ][0]{names, purpose, wistiaId, body, images, property->{thumbnail, floorplan->{name,bed,bath,sqft,price,relatedProperties[]->{name,bed,bath,sqft,thumbnail,slug}}}}`)

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

    // Cloudinary base URL
    const cloudinaryBase =
        'https://res.cloudinary.com/backyardestates/image/upload'

    // Get the property thumbnail or use a default image
    const imagePath =
        story.property?.thumbnail?.url || '/images/backyard-estates-OG.png'

    // Generate Cloudinary URLs for OG and Twitter images
    const ogImage = `${cloudinaryBase}/w_1200,h_630,c_fill/${imagePath}`
    const twitterImage = `${cloudinaryBase}/w_800,h_418,c_fill/${imagePath}`

    return {
        metadataBase: new URL('https://www.backyardestates.com'),

        title: title,
        description: description,
        openGraph: {
            title: title,
            description: description,
            url: `https://www.backyardestates.com/customer-stories/${story.slug}`,
            siteName: 'Backyard Estates',
            images: [
                {
                    url: ogImage,
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
            images: [twitterImage],
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
    return (
        <>
            <Nav />
            <main className={style.base}>
                <div className={style.content}>
                    <h1>{story.names}</h1>
                    <p className={style.intro}>{story.purpose}</p>
                    {story.property && (
                        <h2>{story.property.floorplan.name}</h2>
                    )}
                    {story.property && (
                        <PropertyInfoHack property={property.property} />
                    )}
                    <VideoPlayer wistiaID={story.wistiaId} />
                </div>
                <CustomerStory story={story} />


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
