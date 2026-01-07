import { sanityFetch } from '@/sanity/live'
import { OPEN_HOUSE_QUERY } from "@/sanity/queries";
import EventDetails from "@/components/EventDetails";
import OpenHouseFeaturesSection from "@/components/OpenHouseFeatures";
import ConstructionTimeline from "@/components/ConstructionTimeline";
import RsvpSection from "@/components/RsvpSection";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import Button from "@/components/Button";
import styles from "./page.module.css";
import { Home } from "lucide-react";
import { notFound } from 'next/navigation';
import FloorPlanToggle from '@/components/OpenHouseFloorplans';
import IncludedItems from '@/components/OpenHouseInclusions';
import { seedIncludedItems } from '@/sanity/seed';
import PropertyTimeline from '@/components/PropertyTimeline';
import ScrollingBanner from '@/components/ScrollingBanner';
import calculateWeeks from '@/utils/calculateWeeks';
import GalleryModal from '@/components/GalleryModal';
import { OpenHouseGallery } from '@/components/OpenHouseGallery';
import SelectionsGallery from '@/components/SelectionsGallery';
import SoftCTA from '@/components/SoftCTA';
import { groupSelections } from '@/lib/groupSelections';

export default async function ADUOpenHouse({
    params,
}: {
    params: Promise<{ slug: string }>
}) {
    const openHouse = await sanityFetch({
        query: OPEN_HOUSE_QUERY,
        params: await params,
    });

    const slug = (await params).slug

    if (!openHouse) {
        notFound()
    }

    const sqft = openHouse.data.sqft === 750 && openHouse.data.baths === 2 ? "750+" : openHouse.data.sqft

    const buildDuration = openHouse.data.constructionTimeline?.length ? `Built in ${openHouse.data.constructionTimeline.length} Weeks` : "TBD";
    console.log(openHouse.data)

    const propertyDetails = {
        estate: openHouse.data.floorplan.name,
        beds: openHouse.data.bed,
        baths: openHouse.data.bath,
        aduType: openHouse.data.aduType
    };

    const planningWeeks = calculateWeeks(openHouse.data.planningTimeline.start, openHouse.data.planningTimeline.end);
    const permittingWeeks = calculateWeeks(openHouse.data.permittingTimeline.start, openHouse.data.permittingTimeline.end);
    const constructionWeeks = openHouse.data.constructionTimeline.length;
    const galleryItems = openHouse.data.photos.map((item) => ({
        type: "image" as const,
        url: item.url,
        alt: item.alt,
    }));

    let groupedSelections;
    if (openHouse.data.selections) {
        groupedSelections = groupSelections(openHouse.data.selections);
    }
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

                        <EventDetails dates={openHouse.data.openHouseDates} address={openHouse.data.address} eventType='open-house' />

                    </div>

                    {/* Right Side */}
                    <OpenHouseGallery images={galleryItems} flyer={openHouse.data} />
                </div>
            </div>

            <OpenHouseFeaturesSection propertyDetails={propertyDetails} />
            <div className={styles.floatingButton}>
                <Button theme="blue" href={`/events/open-house/${slug}/rsvp`} isPrimary>
                    RSVP Now
                </Button>
            </div>
            <ScrollingBanner />
            <PropertyTimeline planning={planningWeeks} permitting={permittingWeeks} construction={constructionWeeks} />
            {openHouse.data.constructionTimeline && openHouse.data.constructionTimeline[0].weekImage && (
                <ConstructionTimeline timeline={openHouse.data.constructionTimeline} />
            )}

            <FloorPlanToggle floorplan={openHouse.data.floorplan} customFloorplanPicture={openHouse.data.customFloorplanPicture?.url} sqft={sqft} bed={openHouse.data.bed} bath={openHouse.data.bath} />
            {/* <IncludedItems sections={openHouse.data.includedItems} /> */}

            {openHouse.data.selections && (
                <div className={styles.selectionsSection}>
                    <h2 className={styles.selectionsTitle}>Designed With Purpose, Finished With Care</h2>
                    <p className={styles.selectionsText}>Every finish and fixture is selected with intention</p>
                    <SelectionsGallery data={groupedSelections} variant='property' />
                    <SoftCTA
                        linkText="See what&rsquo;s included"
                        href="/selections"
                    />
                </div>
            )}
            <RsvpSection slug={slug} />
            <Footer />
        </div>
    );
}
