import Benefits from '@/components/Benefits'
import Floorplans from '@/components/Floorplans'
import Footer from '@/components/Footer'
import Nav from '@/components/Nav'
import Process from '@/components/Process'
import Properties from '@/components/Properties'
import StandaloneLink from '@/components/StandaloneLink'
import InclusionsHomePanel from '@/components/InclusionsHomePanel'
import Banner from '@/components/Banners/Banner'
import '../public/styles.css'
import style from './page.module.css'
import CustomerStories from '@/components/CustomerStories'
import { startOfDay, differenceInCalendarDays, parseISO, isWithinInterval } from "date-fns";

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

import { sanityFetch } from '@/sanity/live'
import { ALL_OPEN_HOUSES_QUERY, CUSTOMER_STORIES_QUERY } from '@/sanity/queries'
import Modal from '@/components/Modal'
import RSVPModal from '@/components/RSVPSuccessModal'
import RSVPModalWrapper from '@/components/RSVPSucessWrapper'
import { Suspense } from 'react'

export default async function Home() {
    const { data: stories } = await sanityFetch({
        query: CUSTOMER_STORIES_QUERY,
    })

    const { data: events } = await sanityFetch({
        query: ALL_OPEN_HOUSES_QUERY
    })

    const aduSeminar = {
        _id: "adu-seminar-2025-10-08", // unique ID
        dates: ["2025-10-08"],
        location: "2335 W Foothill Blvd #18, Upland CA 91786",
        projectMedia: {
            professionalPhotos: [
                {
                    publicId: "Seminar/Foothill/adu-seminar",
                    url: "/images/adu-seminar.png", // you can update with a Cloudinary link later
                }
            ]
        },
        propertyDetails: {
            baths: null,
            beds: null,
            sqft: null,
        },
        slug: "adu-seminar",
        title: "ADU Seminar",
    }

    // merge both seminar + open houses into one events array
    const upcomingEvents = [...events, aduSeminar];

    // ---- 🔍 pick soonest event within 14 days ----
    const today = startOfDay(new Date());

    // flatten event dates into individual entries
    const eventEntries = upcomingEvents.flatMap((event) =>
        event.dates.map((date) => ({
            ...event,
            eventDate: startOfDay(parseISO(date)), // normalize event dates too
        }))
    );

    // filter only events that are upcoming + within 14 days
    const validEvents = eventEntries.filter(({ eventDate }) =>
        isWithinInterval(eventDate, {
            start: today,
            end: new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000),
        })
    );

    // pick the soonest event
    const soonestEvent = validEvents.sort(
        (a, b) => a.eventDate.getTime() - b.eventDate.getTime()
    )[0];

    let bannerText;
    let buttonLink;

    if (soonestEvent) {
        const daysAway = differenceInCalendarDays(
            soonestEvent.eventDate,
            today
        );

        let whenText;
        if (daysAway === 0) {
            whenText = "Today";
        } else if (daysAway === 1) {
            whenText = "Tomorrow";
        } else {
            whenText = `in ${daysAway} days`;
        }

        const isSeminar = soonestEvent.slug === "adu-seminar";
        bannerText = isSeminar
            ? `ADU Seminar event ${whenText}`
            : `ADU Open House event ${whenText}`;

        buttonLink = isSeminar
            ? `/events/adu-seminar`
            : `/events/open-house/${soonestEvent.slug}`;
    }


    return (
        <div className={style.container}>
            <Nav />
            {soonestEvent && (
                <Banner
                    text={bannerText}
                    buttonText="Learn more..."
                    buttonLink={buttonLink}
                />
            )}
            <CustomerStories stories={stories} />
            <Floorplans showNav />
            <div className={style.inclusions}>
                <h2 className={style.title}>Standard inclusions</h2>
                <p className={style.explanation}>
                    We provide complete transparency on the exact inclusions of
                    our standard and custom ADU builds
                </p>
                <StandaloneLink href="/standard-inclusions" theme="beige">
                    View inclusions
                </StandaloneLink>
                <InclusionsHomePanel />
            </div>
            <Benefits />
            <Process />
            <Properties />
            <Footer />
            <Suspense fallback={null}>
                <RSVPModalWrapper />
            </Suspense>
            {/* <Modal /> */}
        </div>
    )
}
