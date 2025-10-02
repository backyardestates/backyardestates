import styles from "./OpenHouseFeatures.module.css";
import { Home, Users, Calendar } from "lucide-react";

interface PropertyDetails {
    sqft: number;
    beds: number;
    baths: number;

}


interface OpenHouseFeaturesSectionProps {
    propertyDetails: PropertyDetails;
    timeline: string;
}

export default function OpenHouseFeaturesSection({ propertyDetails, timeline }: OpenHouseFeaturesSectionProps) {
    const { sqft, beds, baths } = propertyDetails;

    // Calculate build duration from timeline if available

    return (
        <div className={styles.section}>
            <div className={styles.container}>
                <div className={styles.grid}>
                    {/* Sqft */}
                    <div className={styles.feature}>
                        <div className={styles.iconWrapper}>
                            <Home color="#b99764" className={styles.icon} />
                        </div>
                        <h3 className={styles.title}>Estate {sqft}</h3>
                        <p className={styles.text}>Thoughtfully designed space</p>
                    </div>

                    {/* Beds / Baths */}
                    <div className={styles.feature}>
                        <div className={styles.iconWrapper}>
                            <Users color="#b99764" className={styles.icon} />
                        </div>
                        <h3 className={styles.title}>{beds} Bed / {baths} Bath</h3>
                        <p className={styles.text}>Perfect for modern living</p>
                    </div>

                    {/* Build Duration */}
                    <div className={styles.feature}>
                        <div className={styles.iconWrapper}>
                            <Calendar color="#b99764" className={styles.icon} />
                        </div>
                        <h3 className={styles.title}>{timeline}</h3>
                        <p className={styles.text}>High quality construction</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
