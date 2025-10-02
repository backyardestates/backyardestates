import { sanityFetch } from '@/sanity/live'
import { OPEN_HOUSES_QUERY } from "@/sanity/queries";
import EventDetails from "@/components/EventDetails";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import Button from "@/components/Button";
import Image from "next/image";
import styles from "./page.module.css";
import { Home } from "lucide-react";
import ADUSeminarFeatures from '@/components/ADUSeminarFeatures';
import ADUSeminarTopics from '@/components/ADUSeminarTopics';
import ADUSeminarRSVPSection from '@/components/ADUSeminarRSVPSection';
import ADUSeminarHosts from '@/components/ADUSeminarHosts';


export default async function ADUOpenHouse() {
    const openHouse = await sanityFetch({
        query: OPEN_HOUSES_QUERY,
        params: { slug: "phillips" },
    });

    if (!openHouse) {
        return <p>Open House not found</p>;
    }

    const dates = [{
        date: "2025-10-08",
        startTime: "18:00:00",
        endTime: "19:30:00"
    }]

    const location = "2335 W Foothill Blvd #18, Upland CA 91786"

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
                            ADU Seminar
                        </div>

                        <h1 className={styles.title}>ADUs Made Simple</h1>
                        <p></p>
                        <p className={styles.subtitle}>
                            If you&rsquo;ve ever wondered if your property qualifies for an ADU, how much it costs, or how fast you can get it done (without the headaches)—this seminar is for you.
                        </p>

                        <div className={styles.buttonRow}>
                            <Button
                                theme="blue"
                                href="/events/adu-seminar/rsvp"
                                isPrimary={true}
                                showIcon={true}
                            >
                                RSVP Now
                            </Button>
                        </div>

                        <EventDetails dates={dates} location={location} eventType='adu-seminar' />

                    </div>

                    {/* Right Side */}
                    <div className={styles.featureImageContainer}>
                        <Image
                            src={'/images/ADUSeminar.png'}
                            alt={"ADU Seminar"}
                            width={500}
                            height={600}
                            className={styles.featureImage}
                        />
                    </div>
                </div>
            </div>

            <ADUSeminarFeatures />
            <div className={styles.floatingButton}>
                <Button theme="blue" href="/events/adu-seminar/rsvp" isPrimary>
                    RSVP Now
                </Button>
            </div>

            <ADUSeminarHosts />
            <ADUSeminarTopics />

            <ADUSeminarRSVPSection />
            <Footer />
        </div>
    );
}
