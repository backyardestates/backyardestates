import styles from "./EventDetails.module.css";
import { Calendar, MapPin } from "lucide-react";

interface EventDetailsProps {
    dates: string[];
    location: string;
}

export default function EventDetails({ dates, location }: EventDetailsProps) {

    const formattedDates = dates?.map(date => {
        const [year, month, day] = date.split("-").map(Number);
        const d = new Date(year, month - 1, day); // month is 0-indexed
        return d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
    }).join(" & ");

    const detailsData = [
        { icon: Calendar, label: formattedDates },
        { icon: MapPin, label: location },
        // Add more items if needed
    ];

    return (
        <div className={styles.detailsContainer}>
            {detailsData.map((item, index) => {
                const Icon = item.icon;
                return (
                    <div key={index} className={styles.details}>
                        <Icon />
                        <span>{item.label}</span>
                    </div>
                );
            })}
        </div>
    );
}
