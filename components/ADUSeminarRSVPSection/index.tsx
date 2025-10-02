import styles from "./ADUSeminarRSVPSection.module.css";
import Button from "@/components/Button";

export default function RsvpSection() {
    return (
        <div className={styles.section}>
            <div className={styles.container}>
                <h2 className={styles.title}>Ready to reserve your free spot?</h2>
                <p className={styles.subtitle}>
                    All attendees get a complementary free property consultation — we&rsquo;ll tell you if your backyard is ADU-ready.
                </p>
                <div className={styles.buttonRow}>
                    <Button theme="blue" href="/events/adu-seminar/rsvp" isPrimary={true} showIcon={true}>
                        Reserve Your Spot
                    </Button>
                </div>
            </div>
        </div>
    );
}
