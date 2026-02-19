import Benefits from '@/components/Benefits'
import Floorplans from '@/components/Floorplans'
import Footer from '@/components/Footer'
import Nav from '@/components/Nav'
import Process from '@/components/Process'
import Properties from '@/components/Properties'
import StandaloneLink from '@/components/StandaloneLink'
import InclusionsHomePanel from '@/components/InclusionsHomePanel'

import '../public/styles.css'
import style from './page.module.css'
import CustomerStories from '@/components/CustomerStories'

import { sanityFetch } from '@/sanity/live'
import { ALL_OPEN_HOUSES_QUERY, CUSTOMER_STORIES_QUERY, SELECTIONS_QUERY } from '@/sanity/queries'
import Modal from '@/components/Modal'
import RSVPModalWrapper from '@/components/RSVPSucessWrapper'
import { Suspense } from 'react'
import Banner from '@/components/Banners/Banner'
import { TurnkeySection } from '@/components/TurnkeySection/TurnkeySection'

const title = 'Backyard Estates - Premier ADU builder'
const description =
    'Backyard Estates specializes in custom Accessory Dwelling Units (ADUs) in Los Angeles. Transform your property with our expert ADU solutions.'

export const metadata = {
    metadataBase: new URL('https://www.backyardestates.com'),
    title: title,
    description: description,
    openGraph: {
        title: title,
        description: description,
        url: 'https://www.backyardestates.com',
        siteName: 'Backyard Estates',
        images: [
            {
                url: '/images/backyard-estates-OG.png',
                width: 1200,
                height: 630,
                alt: title,
            },
        ],
        type: 'website',
    },
    twitter: {
        card: 'summary_large_image',
        title: title,
        description: description,
        images: ['/images/backyard-estates-Twitter.png'],
    },
}



export default async function Home() {
    const { data: stories } = await sanityFetch({
        query: CUSTOMER_STORIES_QUERY,
    })

    const { data: events } = await sanityFetch({
        query: ALL_OPEN_HOUSES_QUERY
    })

    const { data: selections } = await sanityFetch({
        query: SELECTIONS_QUERY
    })


    return (
        <div className={style.container}>
            <Nav />
            <Banner events={events} />
            <CustomerStories stories={stories} />
            <Floorplans showNav />
            <TurnkeySection />
            <div className={style.inclusions}>
                <h2 className={style.title}>Standard Finishes</h2>
                <p className={style.explanation}>
                    We provide complete transparency on the exact finishes of
                    our standard and custom ADU builds
                </p>
                <StandaloneLink href="/standard-inclusions" theme="beige">
                    View inclusions
                </StandaloneLink>
                <InclusionsHomePanel selections={selections} />
            </div>
            <Benefits />
            <Process />
            <Properties />
            <Footer />
            <Suspense fallback={null}>
                <RSVPModalWrapper />
            </Suspense>
            <Modal events={events} />
        </div>
    )
}
