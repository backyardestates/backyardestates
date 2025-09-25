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
import { Home } from "lucide-react";
import FloatingRsvpButton from '@/components/FloatingButton';

export default async function ADUOpenHouse() {
    const openHouse = await sanityFetch({
        query: OPEN_HOUSES_QUERY,
        params: { slug: "phillips" },
    });

    console.log(openHouse);

    if (!openHouse) {
        return <p>Open House not found</p>;
    }

    const buildDuration = openHouse.data.timeline?.length ? `${openHouse.data.timeline.length}-Week-Built` : "TBD";


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

                        <h1 className={styles.title}>ADU Open House - {openHouse.data.title}</h1>
                        <p className={styles.subtitle}>
                            Discover modern living in our beautifully designed Accessory Dwelling Unit
                        </p>

                        <div className={styles.buttonRow}>
                            <Button
                                theme="blue"
                                href="/open-house/rsvp"
                                isPrimary={true}
                                showIcon={true}
                            >
                                RSVP Now
                            </Button>
                        </div>

                        <EventDetails dates={openHouse.data.dates} location={openHouse.data.location} />

                    </div>

                    {/* Right Side */}
                    <div className={styles.featureImageContainer}>
                        <Image
                            src={openHouse.data.projectMedia.professionalPhotos[0].url}
                            alt={openHouse.data.title}
                            width={500}
                            height={600}
                            className={styles.featureImage}
                        />
                    </div>
                </div>
            </div>
            <OpenHouseFeaturesSection propertyDetails={openHouse.data.propertyDetails} timeline={buildDuration} />
            <ConstructionTimeline timeline={openHouse.data.timeline} />
            <RsvpSection />
            <Footer />
        </div>
    );
}
