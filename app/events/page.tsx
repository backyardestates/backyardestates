// pages/events.tsx
import { sanityFetch } from "@/sanity/live";
import styles from "./page.module.css";
import Image from "next/image";
import Link from "next/link";
import { ALL_OPEN_HOUSES_QUERY } from "@/sanity/queries";
import Nav from "@/components/Nav";
import formatDate from "@/utils/dates";
import Footer from "@/components/Footer";
import formatTime from "@/utils/times";
import { Calendar, MapPin } from "lucide-react";
import { seedIncludedItems } from "@/sanity/seed";
// const seeded = await seedIncludedItems()
// console.log(seeded)

function splitEventsByDate(events: any[]) {
    const now = new Date();
    const upcoming: any[] = [];
    const past: any[] = [];

    events.forEach((event) => {
        // Use the first date object's `date` field
        const eventDateStr = event.dates[0]?.date;
        if (!eventDateStr) return;

        const eventDate = new Date(eventDateStr);
        if (eventDate >= now) {
            upcoming.push(event);
        } else {
            past.push(event);
        }
    });

    // Sort ascending for upcoming, descending for past
    upcoming.sort(
        (a, b) => new Date(a.dates[0].date).getTime() - new Date(b.dates[0].date).getTime()
    );
    past.sort(
        (a, b) => new Date(b.dates[0].date).getTime() - new Date(a.dates[0].date).getTime()
    );

    return { upcoming, past };
}


export default async function EventsPage() {
    const { data: openHouses } = await sanityFetch({ query: ALL_OPEN_HOUSES_QUERY });

    // ADU Seminar (static insert)
    const seminar = {
        title: "ADU Seminar",
        slug: "adu-seminar",
        dates: [{
            date: "2025-10-08",
            startTime: "18:00:00",
            endTime: "19:30:00"
        }],
        location: "2335 W Foothill Blvd #18, Upland CA 91786",
        propertyDetails: { sqft: 0, beds: 0, baths: 0 },
        imageUrl: "/images/ADUSeminar.png",
    };

    const allEvents = [...openHouses, seminar];

    const { upcoming, past } = splitEventsByDate(allEvents);

    const renderEventCard = (event: any) => {
        return (
            <Link
                href={event.slug === "adu-seminar" ? "/events/adu-seminar" : `/events/open-house/${event.slug}`} className={styles.eventCard} key={event._id || event.slug}
            >

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

                    {/* Dates */}
                    <div className={styles.weekDescription}>
                        <Calendar className={styles.icon} />
                        <div style={{ display: "flex", flexDirection: "column", gap: "0.2rem" }}>
                            {event.dates.map((d: any) => {
                                const [year, month, day] = d.date.split("-").map(Number);
                                const weekday = new Date(year, month - 1, day).toLocaleDateString("en-US", { weekday: "short" });
                                const monthName = new Date(year, month - 1, day).toLocaleDateString("en-US", { month: "long" });
                                const dayNum = day;
                                const yearNum = year;

                                if (event.slug !== "adu-seminar" && d.startTime && d.endTime) {
                                    return (
                                        <span key={d.date}>
                                            {`${weekday}, ${monthName} ${dayNum}, ${yearNum} from ${formatTime(d.startTime)} to ${formatTime(d.endTime)}`}
                                        </span>

                                    );
                                }

                                if (event.slug === "adu-seminar" && d.startTime) {
                                    return (
                                        <span key={d.date}>
                                            {`${weekday}, ${monthName} ${dayNum}, ${yearNum} at ${formatTime(d.startTime)}`}
                                        </span>

                                    );
                                }

                                return <span key={d.date}>{`${weekday}, ${monthName} ${dayNum}, ${yearNum}`}</span>;
                            })}
                        </div>
                    </div>

                    {/* Location */}
                    <div className={styles.weekDescription}>
                        <MapPin className={styles.icon} />
                        <span>{event.location}</span>
                    </div>

                    <span
                        className={styles.button}
                    >
                        Learn More
                    </span>
                </div>
            </Link>

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
