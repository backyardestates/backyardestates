// ADUOpenHouse.tsx
import styles from "./page.module.css";
import Button from "@/components/Button";
import Nav from "@/components/Nav";
import { faCalendar, faHome, faUsers, faMapPin } from "@fortawesome/pro-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

export default function ADUOpenHouse() {
    return (
        <div className={styles.container}>

            <Nav />
            <div className={styles.container}>
                <div className={styles.hero}>
                    <div className={styles.heroOverlay}></div>

                    <div className={styles.heroContent}>
                        {/* Left Side */}
                        <div>
                            <div className={styles.badge}>
                                <FontAwesomeIcon icon={faHome} className="mr-2" />
                                Open House Event
                            </div>

                            <h1 className={styles.title}>ADU Open House</h1>

                            <p className={styles.subtitle}>
                                Discover modern living in our beautifully designed Accessory Dwelling Unit
                            </p>

                            <div className={styles.buttonRow}>
                                <button className={styles.buttonPrimary}>RSVP Now</button>
                                <button className={styles.buttonOutline}>Learn More</button>
                            </div>

                            <div className={styles.details}>
                                <div className="flex items-center gap-2">
                                    <FontAwesomeIcon icon={faCalendar} />
                                    <span>May 15th, 2025</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <FontAwesomeIcon icon={faMapPin} />
                                    <span>San Francisco, CA</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <FontAwesomeIcon icon={faUsers} />
                                    <span>10 AM - 4 PM</span>
                                </div>
                            </div>
                        </div>

                        {/* Right Side */}
                        <div className={styles.featureImage}>
                            <div>
                                <FontAwesomeIcon icon={faHome} size="3x" />
                                <p className="text-lg font-medium">Featured ADU Image</p>
                                <p className="text-sm opacity-70">Professional photography coming soon</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

    )
}
