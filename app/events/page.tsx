// pages/events.tsx
import { sanityFetch } from "@/sanity/live";
import styles from "./page.module.css";
import Image from "next/image";
import Link from "next/link";
import { ALL_OPEN_HOUSES_QUERY } from "@/sanity/queries";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import formatTime from "@/utils/times";
import { Calendar, MapPin } from "lucide-react";
import { seedIncludedItems } from "@/sanity/seed";
import Button from "@/components/Button";
// const seeded = await seedIncludedItems()
// console.log(seeded)

function splitEventsByDate(events: any[]) {
    const now = new Date();
    const upcoming: any[] = [];
    const past: any[] = [];
    events.forEach((event) => {
        // Use the first date object's `date` field
        const eventDateStr = event.openHouseDates?.[0].day;
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
        (a, b) => new Date(a.openHouseDates[0].day).getTime() - new Date(b.openHouseDates[0].day).getTime()
    );
    past.sort(
        (a, b) => new Date(b.openHouseDates[0].day).getTime() - new Date(a.openHouseDates[0].day).getTime()
    );

    return { upcoming, past };
}


export default async function EventsPage() {
    const { data: openHouses } = await sanityFetch({ query: ALL_OPEN_HOUSES_QUERY });

    // ADU Seminar (static insert)
    const seminar = {
        name: "ADU Seminar",
        slug: "adu-seminar",
        openHouseDates: [{
            day: "2025-10-08",
            startTime: "18:00:00",
            endTime: "19:30:00"
        }],
        address: {
            street: "2335 W Foothill Blvd #18",
            city: "Upland",
            state: "CA",
            zip: "91786"
        },
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

                {event.photos?.[0]?.url || event.imageUrl ? (
                    <Image
                        src={event.photos?.[0]?.url || event.imageUrl}
                        alt={event.name}
                        width={500}
                        height={600}
                        className={styles.featureImage}
                    />
                ) : null}

                <div className={styles.textContent}>
                    <h2 className={styles.eventTitle}>
                        {event.slug !== "adu-seminar" ? `ADU Open House: ${event.name}` : event.name}
                    </h2>
                    <div className={styles.details}>

                        {/* Dates */}
                        <div className={styles.dates}>
                            <Calendar className={styles.icon} />
                            <div style={{ display: "flex", flexDirection: "column", gap: "0.2rem" }}>
                                {event.openHouseDates?.map((d: any) => {
                                    const [year, month, day] = d.day.split("-").map(Number);
                                    const weekday = new Date(year, month - 1, day).toLocaleDateString("en-US", { weekday: "short" });
                                    const monthName = new Date(year, month - 1, day).toLocaleDateString("en-US", { month: "long" });
                                    const dayNum = day;
                                    const yearNum = year;

                                    if (event.slug !== "adu-seminar" && d.startTime && d.endTime) {
                                        return (
                                            <span key={`${d.day}-${d.startTime}-${d.endTime}`}>
                                                {/* {`${weekday}, ${monthName} ${dayNum}, ${yearNum} from ${formatTime(d.startTime)} to ${formatTime(d.endTime)}`} */}
                                                {`${weekday}, ${monthName} ${dayNum}, ${yearNum}`}

                                            </span>

                                        );
                                    }

                                    if (event.slug === "adu-seminar" && d.startTime) {
                                        return (
                                            <span key={`${d.day}-${d.startTime}`}>
                                                {/* {`${weekday}, ${monthName} ${dayNum}, ${yearNum} at ${formatTime(d.startTime)}`} */}
                                                {`${weekday}, ${monthName} ${dayNum}, ${yearNum}`}

                                            </span>

                                        );
                                    }

                                    return <span key={d.date}>{`${weekday}, ${monthName} ${dayNum}, ${yearNum}`}</span>;
                                })}
                            </div>
                        </div>

                        {/* Location */}
                        <div className={styles.location}>
                            <MapPin className={styles.icon} />
                            {/* <span>{event.address.street}, {event.address.city}, {event.address.state} {event.address.zip}</span> */}
                            <span> {event.address.city}, {event.address.state} {event.address.zip}</span>

                        </div>
                    </div>
                    <div className={styles.buttons}>
                        <button className={styles.button}>
                            Learn More
                        </button>
                    </div>
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
