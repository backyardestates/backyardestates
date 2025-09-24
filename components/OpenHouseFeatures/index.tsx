import styles from "./OpenHouseFeatures.module.css"
import { Home, Users, Calendar } from "lucide-react"

export default function OpenHouseFeaturesSection() {
    return (
        <div className={styles.section}>
            <div className={styles.container}>
                <div className={styles.grid}>
                    <div className={styles.feature}>
                        <div className={styles.iconWrapper}>
                            <Home color="black" />
                        </div>
                        <h3 className={styles.title}>749 sqft</h3>
                        <p className={styles.text}>Thoughtfully designed space</p>
                    </div>

                    <div className={styles.feature}>
                        <div className={styles.iconWrapper}>
                            <Users color="black" />
                        </div>
                        <h3 className={styles.title}>2 Bed / 2 Bath</h3>
                        <p className={styles.text}>Perfect for modern living</p>
                    </div>

                    <div className={styles.feature}>
                        <div className={styles.iconWrapper}>
                            <Calendar color="black" />
                        </div>
                        <h3 className={styles.title}>7-Week-Built</h3>
                        <p className={styles.text}>High quality construction</p>
                    </div>
                </div>
            </div>
        </div>
    )
}
