// pages/events.tsx
import { sanityFetch } from "@/sanity/live";
import styles from "./page.module.css";
import Image from "next/image";
import Link from "next/link";
import { ALL_OPEN_HOUSES_QUERY } from "@/sanity/queries";
import Nav from "@/components/Nav";
import formatDate from "@/utils/dates";
import Footer from "@/components/Footer";

// helper: split events into upcoming and past
function splitEventsByDate(events: any[]) {
    const now = new Date();
    const upcoming: any[] = [];
    const past: any[] = [];

    events.forEach((event) => {
        const eventDate = new Date(event.dates[0]); // first date
        if (eventDate >= now) {
            upcoming.push(event);
        } else {
            past.push(event);
        }
    });

    // sort ascending for upcoming, descending for past
    upcoming.sort((a, b) => new Date(a.dates[0]).getTime() - new Date(b.dates[0]).getTime());
    past.sort((a, b) => new Date(b.dates[0]).getTime() - new Date(a.dates[0]).getTime());

    return { upcoming, past };
}

export default async function EventsPage() {
    const { data: openHouses } = await sanityFetch({ query: ALL_OPEN_HOUSES_QUERY });

    // ADU Seminar (static insert)
    const seminar = {
        title: "ADU Seminar",
        slug: "adu-seminar",
        dates: ["2025-10-08"],
        location: "2335 W Foothill Blvd #18, Upland CA 91786",
        propertyDetails: { sqft: 0, beds: 0, baths: 0 },
        imageUrl: "/images/ADUSeminar.png",
    };

    const allEvents = [...openHouses, seminar];

    const { upcoming, past } = splitEventsByDate(allEvents);

    const renderEventCard = (event: any) => {
        const eventDate = event.dates
            .map((d: string) =>
                formatDate(d)
            )
            .join(" & ");

        return (
            <div key={event._id || event.slug} className={styles.eventCard}>
                {event.projectMedia?.professionalPhotos?.[0]?.url || event.imageUrl ? (
                    <Image
                        src={event.projectMedia?.professionalPhotos?.[0]?.url || event.imageUrl}
                        alt={event.title}
                        width={500}
                        height={600}
                        className={styles.featureImage}
                    />
                ) : null}

                <div className={styles.textContent}>
                    <h2 className={styles.weekTitle}>
                        {event.slug !== "adu-seminar" ? `Open House: ${event.title}` : event.title}
                    </h2>
                    <p className={styles.weekDescription}>{eventDate}</p>
                    <p className={styles.weekDescription}>{event.location}</p>
                    <Link
                        href={event.slug === "adu-seminar" ? "/events/adu-seminar" : `/events/open-house/${event.slug}`}
                        className={styles.button}
                    >
                        Learn More
                    </Link>
                </div>
            </div>
        );
    };

    return (
        <>
            <Nav />
            <div className={styles.container}>
                {/* Upcoming Events */}
                <header className={styles.headerSection}>
                    <h1 className={styles.sectionTitle}>Upcoming Events</h1>
                    <p className={styles.sectionSubtitle}>
                        Join our open houses and seminars to learn more about ADUs and modern living.
                    </p>
                </header>

                <div className={styles.eventsGrid}>
                    {upcoming.length > 0 ? upcoming.map(renderEventCard) : <p>No upcoming events.</p>}
                </div>

                {/* Past Events */}
                {past.length > 0 && (
                    <>
                        <header className={styles.headerSection} style={{ marginTop: "6rem" }}>
                            <h2 className={styles.sectionTitle}>Past Events</h2>
                            <p className={styles.sectionSubtitle}>
                                Explore some of our past open houses and seminars.
                            </p>
                        </header>

                        <div className={styles.eventsGrid}>
                            {past.map(renderEventCard)}
                        </div>
                    </>
                )}
            </div>
            <Footer />
        </>
    );
}
