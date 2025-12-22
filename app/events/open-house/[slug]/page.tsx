import { sanityFetch } from '@/sanity/live'
import { OPEN_HOUSES_QUERY } from "@/sanity/queries";
import EventDetails from "@/components/EventDetails";
import OpenHouseFeaturesSection from "@/components/OpenHouseFeatures";
import ConstructionTimeline from "@/components/ConstructionTimeline";
import RsvpSection from "@/components/RsvpSection";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import Button from "@/components/Button";
import Image from "next/image";
import styles from "./page.module.css";
import { Bath, Home } from "lucide-react";
import { notFound } from 'next/navigation';
import FloorPlanToggle from '@/components/OpenHouseFloorplans';
import IncludedItems from '@/components/OpenHouseInclusions';
import { seedIncludedItems } from '@/sanity/seed';


export default async function ADUOpenHouse({
    params,
}: {
    params: Promise<{ slug: string }>
}) {
    const openHouse = await sanityFetch({
        query: OPEN_HOUSES_QUERY,
        params: await params,
    });

    const slug = (await params).slug

    if (!openHouse) {
        notFound()
    }

    const sqft = openHouse.data.propertyDetails.sqft === 750 && openHouse.data.propertyDetails.baths === 2 ? "750+" : openHouse.data.propertyDetails.sqft

    const buildDuration = openHouse.data.timeline?.length ? `Built in ${openHouse.data.timeline.length} Weeks` : "TBD";
    return (
        <div className={styles.container}>
            <Nav />

            <div className={styles.hero}>
                <div className={styles.heroOverlay}></div>
                <div className={styles.heroContent}>
                    {/* Left Side */}
                    <div>
                        <div className={styles.badge}>
                            <Home />
                            Open House Event
                        </div>

                        <h1 className={styles.title}>ADU Open House</h1>
                        <p className={styles.subtitle}>
                            Discover modern living in our beautifully designed Accessory Dwelling Unit
                        </p>

                        <div className={styles.buttonRow}>
                            <Button
                                theme="blue"
                                href={`/events/open-house/${slug}/rsvp`}
                                isPrimary={true}
                                showIcon={true}
                            >
                                RSVP Now
                            </Button>
                        </div>

                        <EventDetails dates={openHouse.data.dates} location={openHouse.data.location} eventType='open-house' />

                    </div>

                    {/* Right Side */}
                    <div className={styles.featureImageContainer}>
                        <Image
                            src={openHouse.data.projectMedia.professionalPhotos[0].url}
                            alt={openHouse.data.title}
                            width={500}
                            height={600}
                            className={styles.featureImage}
                            quality={100}
                        />
                    </div>
                </div>
            </div>

            <OpenHouseFeaturesSection propertyDetails={openHouse.data.propertyDetails} timeline={buildDuration} />
            <div className={styles.floatingButton}>
                <Button theme="blue" href={`/events/open-house/${slug}/rsvp`} isPrimary>
                    RSVP Now
                </Button>
            </div>
            {/* <FloorPlanToggle floorplan={openHouse.data.projectMedia.floorplans[0].url} customFloorplanPicture={openHouse.data.projectMedia.floorplans[1].url} sqft={sqft} /> */}
            {/* <ConstructionTimeline timeline={openHouse.data.timeline} /> */}
            <IncludedItems sections={openHouse.data.includedItems} />

            <RsvpSection slug={slug} />
            <Footer />
        </div>
    );
}
