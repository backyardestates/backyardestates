import styles from "./EventDetails.module.css";
import { Calendar, MapPin } from "lucide-react";

interface EventDetailsProps {
    dates: string[];
    location: string;
    className?: string
}

export default function EventDetails({ dates, location, className }: EventDetailsProps) {
    // Format the dates nicely, e.g., "October 10th, 2025 and October 11th, 2025"
    const formattedDates = dates?.map(date => {
        const d = new Date(date);
        return d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
    }).join(" & ");

    const detailsData = [
        { icon: Calendar, label: formattedDates },
        { icon: MapPin, label: location },
        // Add more items if needed
    ];

    return (
        <div className={className ? className : styles.detailsContainer}>
            {detailsData.map((item, index) => {
                const Icon = item.icon;
                return (
                    <div key={index} className={className ? className : styles.detailsContainer}>
                        <Icon />
                        <span>{item.label}</span>
                    </div>
                );
            })}
        </div>
    );
}
