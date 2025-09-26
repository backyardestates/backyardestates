import styles from "./RsvpSection.module.css";
import Button from "@/components/Button";

export default function RsvpSection() {
    return (
        <div className={styles.section}>
            <div className={styles.container}>
                <h2 className={styles.title}>Ready to see it in person?</h2>
                <p className={styles.subtitle}>
                    Join us for an exclusive tour of this stunning ADU and discover the
                    future of sustainable living
                </p>
                <div className={styles.buttonRow}>
                    <Button theme="blue" href="/open-house/rsvp" isPrimary={true} showIcon={true}>
                        Reserve Your Spot
                    </Button>
                </div>
            </div>
        </div>
    );
}
