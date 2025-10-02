import styles from "./EventDetails.module.css";
import { Calendar, MapPin } from "lucide-react";

interface EventDetailsProps {
    dates: { date: string; startTime?: string; endTime?: string }[];
    location: string;
    eventType: "open-house" | "adu-seminar";
}

export default function EventDetails({ dates, location, eventType }: EventDetailsProps) {

    const formatTime = (timeString: string) => {
        const [hours, minutes] = timeString.split(":").map(Number);
        const date = new Date();
        date.setHours(hours, minutes);
        return date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
    };

    return (
        <div className={styles.detailsContainer}>
            {/* Dates */}
            <div className={styles.details}>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.2rem" }}>
                    {dates.map(({ date, startTime, endTime }) => {
                        const [year, month, day] = date.split("-").map(Number);
                        const d = new Date(year, month - 1, day); // month is 0-indexed
                        const weekday = d.toLocaleDateString("en-US", { weekday: "short" });
                        const monthName = d.toLocaleDateString("en-US", { month: "long" });
                        const dayNum = d.getDate();
                        const yearNum = d.getFullYear();

                        if (eventType === "open-house" && startTime && endTime) {
                            return (
                                <div className={styles.details} key={date}>
                                    <Calendar className={styles.icon} />
                                    <span >
                                        {`${weekday}, ${monthName} ${dayNum}, ${yearNum} from ${formatTime(startTime)} to ${formatTime(endTime)}`}
                                    </span>
                                </div>

                            );
                        }

                        if (eventType === "adu-seminar" && startTime) {
                            return (
                                <div className={styles.details} key={date}>
                                    <Calendar className={styles.icon} />
                                    <span >
                                        {`${weekday}, ${monthName} ${dayNum}, ${yearNum} at ${formatTime(startTime)}`}
                                    </span>
                                </div>

                            );
                        }

                        // fallback
                        return (
                            <span key={date}>
                                {`${weekday}, ${monthName} ${dayNum}, ${yearNum}`}
                            </span>
                        );
                    })}
                </div>
            </div>

            {/* Location */}
            <div className={styles.details}>
                <MapPin className={styles.icon} />
                <span>{location}</span>
            </div>
        </div>
    );
}
