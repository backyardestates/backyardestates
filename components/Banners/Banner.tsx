'use client';
import styles from "./Banner.module.css";
import {
    startOfDay,
    differenceInCalendarDays,
    parseISO,
    isWithinInterval,
    isAfter,
} from "date-fns";

export default function Banner({ events = [], backgroundColor = "#b99764" }) {
    const aduSeminar = {
        _id: "adu-seminar-2025-10-08",
        openHouseDates: [{ day: "2025-10-08" }],
        location: "2335 W Foothill Blvd #18, Upland CA 91786",
        projectMedia: {
            professionalPhotos: [
                {
                    publicId: "Seminar/Foothill/adu-seminar",
                    url: "/images/adu-seminar.png",
                },
            ],
        },
        propertyDetails: { baths: null, beds: null, sqft: null },
        slug: "adu-seminar",
        title: "ADU Seminar",
    };

    const today = startOfDay(new Date());

    // only add seminar if it’s in the future
    const includeSeminar = aduSeminar.openHouseDates.some((d) =>
        isAfter(parseISO(d.day), today)
    );
    const allEvents = [...events, ...(includeSeminar ? [aduSeminar] : [])];

    // flatten all event date objects into a single list with eventDate
    const eventEntries = allEvents.flatMap((event) =>
        event.openHouseDates.map((d) => ({
            ...event,
            eventDate: startOfDay(parseISO(d.day)),
        }))
    );

    // filter: events within the next 14 days
    const twoWeeksFromNow = new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000);
    const validEvents = eventEntries.filter(({ eventDate }) =>
        isWithinInterval(eventDate, { start: today, end: twoWeeksFromNow })
    );

    // pick soonest event
    const soonestEvent = validEvents.sort(
        (a, b) => a.eventDate.getTime() - b.eventDate.getTime()
    )[0];

    // if no upcoming event, hide banner
    if (!soonestEvent) return null;

    const daysAway = differenceInCalendarDays(soonestEvent.eventDate, today);
    const whenText =
        daysAway === 0
            ? "Today"
            : daysAway === 1
                ? "Tomorrow"
                : `in ${daysAway} days`;

    const isSeminar = soonestEvent.slug === "adu-seminar";
    const bannerText = isSeminar
        ? `ADU Seminar event ${whenText}`
        : `ADU Open House event ${whenText}`;

    const buttonLink = isSeminar
        ? `/events/adu-seminar`
        : `/events/open-house/${soonestEvent.slug}`;

    return (
        <div
            className={styles.banner}
            style={{ backgroundColor }}
        >
            <div className={styles.content}>
                <p className={styles.text}>{bannerText}</p>
                <a className={styles.button} href={buttonLink}>
                    Learn more...
                </a>
            </div>
        </div>
    );
}
