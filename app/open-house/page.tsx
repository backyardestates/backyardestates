// pages/events.tsx
import { sanityFetch } from "@/sanity/live";
import styles from "./page.module.css";
import Image from "next/image";
import Link from "next/link";
import { ACTIVE_OPEN_HOUSES_QUERY } from "@/sanity/queries";
import Nav from "@/components/Nav";


export default async function EventsPage() {
    const { data: openHouses } = await sanityFetch({ query: ACTIVE_OPEN_HOUSES_QUERY });

    // ADU Seminar
    const seminar = {
        title: "ADU Seminar",
        slug: "adu-seminar",
        dates: ["2025-10-08"],
        location: "2335 W Foothill Blvd #18, Upland CA 91786",
        propertyDetails: { sqft: 0, beds: 0, baths: 0 },
        imageUrl: "/images/ADUSeminar.png",
    };

    const events = [...openHouses, seminar];

    return (
        <>
            <Nav />
            <div className={styles.container}>
                <header className={styles.headerSection}>
                    <h1 className={styles.sectionTitle}>Upcoming Events</h1>
                    <p className={styles.sectionSubtitle}>
                        Join our open houses and seminars to learn more about ADUs and modern living.
                    </p>
                </header>

                <div className={styles.eventsGrid}>
                    {events.map((event) => {
                        const eventDate = event.dates
                            .map((d) => new Date(d).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }))
                            .join(" & ");

                        console.log(event.projectMedia?.professionalPhotos[0].url)

                        return (
                            <div key={event._id || event.slug} className={styles.eventCard}>
                                {event.projectMedia?.professionalPhotos[0].url || event.imageUrl ? (
                                    <Image
                                        src={event.projectMedia?.professionalPhotos[0].url || event.imageUrl}
                                        alt={event.title}
                                        width={500}
                                        height={600}
                                        className={styles.featureImage}
                                    />
                                ) : null}

                                <div className={styles.textContent}>
                                    <h2 className={styles.weekTitle}>{event.title}</h2>
                                    <p className={styles.weekDescription}>{eventDate}</p>
                                    <p className={styles.weekDescription}>{event.location}</p>
                                    <Link
                                        href={event.slug === "adu-seminar" ? "/adu-seminar" : `/open-house/${event.slug}`}
                                        className={styles.button}
                                    >
                                        Learn More
                                    </Link>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </>

    );
}
