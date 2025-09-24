import styles from "./EventDetails.module.css"
import { Calendar, MapPin, Users } from "lucide-react"

const eventDetailsData = [
    { icon: Calendar, label: "October 10th, 2025" },
    { icon: MapPin, label: "Upland, CA" },
    // { icon: Users, label: "10 AM - 4 PM" },
]

export default function EventDetails({ details = eventDetailsData }) {
    return (
        <div className={styles.detailsContainer}>
            {details.map((item, index) => {
                const Icon = item.icon
                return (
                    <div key={index} className={styles.details}>
                        <Icon />
                        <span>{item.label}</span>
                    </div>
                )
            })}
        </div>
    )
}
