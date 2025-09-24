// ADUOpenHouse.tsx
import EventDetails from "@/components/EventDetails";
import styles from "./page.module.css";
import Button from "@/components/Button";
import Nav from "@/components/Nav";
import OpenHouseFeaturesSection from "@/components/OpenHouseFeatures";
import { Home, Users, Calendar, MapPin, Construction } from "lucide-react"
import Image from "next/image";
import ConstructionTimeline from "@/components/ConstructionTimeline";
import RsvpSection from "@/components/RsvpSection";
import Footer from "@/components/Footer";
export default function ADUOpenHouse() {
    return (
        <div className={styles.container}>

            <Nav />
            <div className={styles.container}>
                <div className={styles.hero}>
                    <div className={styles.heroOverlay}></div>

                    <div className={styles.heroContent}>
                        {/* Left Side */}
                        <div >
                            <div className={styles.badge}>
                                <Home />
                                Open House Event
                            </div>

                            <h1 className={styles.title}>ADU Open House</h1>

                            <p className={styles.subtitle}>
                                Discover modern living in our beautifully designed Accessory Dwelling Unit
                            </p>

                            <div className={styles.buttonRow}>
                                <Button theme="blue" href="https://www.backyardestates.com/open-house/rsvp" isPrimary={true} showIcon={false}>RSVP Now</Button>
                            </div>

                            <EventDetails />

                            <OpenHouseFeaturesSection />

                        </div>

                        {/* Right Side */}
                        <div className={styles.featureImageContainer}>
                            <Image src={"/images/open-house-adu.png"} alt="Open House ADU" width={500} height={600} className={styles.featureImage}>
                            </Image>

                        </div>
                    </div>
                </div>
                <ConstructionTimeline />
                <RsvpSection />
            </div>
            <Footer />

        </div>

    )
}
