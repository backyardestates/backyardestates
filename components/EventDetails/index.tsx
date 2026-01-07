import styles from "./EventDetails.module.css";
import { Calendar, MapPin } from "lucide-react";

interface EventDetailsProps {
    dates: { day: string; startTime?: string; endTime?: string }[];
    address: {
        street: string;
        city: string;
        state: string;
        zip: string;
    };
    eventType: "open-house" | "adu-seminar";
}

export default function EventDetails({ dates, address, eventType }: EventDetailsProps) {

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
                    {dates.map(({ day, startTime, endTime }) => {
                        const [year, month, dayNum] = day.split("-").map(Number);
                        const d = new Date(year, month - 1, dayNum); // month is 0-indexed
                        const weekday = d.toLocaleDateString("en-US", { weekday: "short" });
                        const monthName = d.toLocaleDateString("en-US", { month: "long" });
                        const yearNum = d.getFullYear();

                        if (eventType === "open-house" && startTime && endTime) {
                            return (
                                <div className={styles.details} key={day}>
                                    <Calendar className={styles.icon} />
                                    <span >
                                        {`${weekday}, ${monthName} ${dayNum}, ${yearNum} from ${formatTime(startTime)} to ${formatTime(endTime)}`}
                                    </span>
                                </div>

                            );
                        }

                        if (eventType === "adu-seminar" && startTime) {
                            return (
                                <div className={styles.details} key={day}>
                                    <Calendar className={styles.icon} />
                                    <span >
                                        {`${weekday}, ${monthName} ${dayNum}, ${yearNum} at ${formatTime(startTime)}`}
                                    </span>
                                </div>

                            );
                        }

                        // fallback
                        return (
                            <span key={day}>
                                {`${weekday}, ${monthName} ${dayNum}, ${yearNum}`}
                            </span>
                        );
                    })}
                </div>
            </div>

            {/* Location */}
            <div className={styles.details}>
                <MapPin className={styles.icon} />
                <span>{address.street}, {address.city}, {address.state} {address.zip}</span>
            </div>
        </div>
    );
}
