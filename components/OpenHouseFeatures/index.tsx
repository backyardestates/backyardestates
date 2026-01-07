import styles from "./OpenHouseFeatures.module.css";
import { Home, Users, Calendar, House, HousePlus, HousePlusIcon, LucideHousePlus, Construction, ConstructionIcon, DoorOpen, SendToBack, Grid2X2Check } from "lucide-react";

interface PropertyDetails {
    estate: string;
    beds: number;
    baths: number;
    aduType: string;
}


interface OpenHouseFeaturesSectionProps {
    propertyDetails: PropertyDetails;
}

export default function OpenHouseFeaturesSection({ propertyDetails }: OpenHouseFeaturesSectionProps) {
    const { estate, beds, baths, aduType } = propertyDetails;

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
                        <h3 className={styles.title}>{estate}</h3>
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
                            {aduType === "detached" ? (
                                <SendToBack color="#b99764" className={styles.icon} />
                            ) : (
                                <Grid2X2Check color="#b99764" className={styles.icon} />

                            )}
                        </div>
                        <h3 className={styles.title}>{aduType}</h3>
                        <p className={styles.text}>
                            {aduType === "detached"
                                ? "Full privacy with flexible living"
                                : "A seamless extension of your home"}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
