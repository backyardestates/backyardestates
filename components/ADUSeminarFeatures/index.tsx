import styles from "./ADUSeminarFeatures.module.css";
import { Rocket, Eye, TrendingUp } from "lucide-react";


export default function ADUSeminarFeaturesSection() {


    // Calculate build duration from timeline if available

    return (
        <div className={styles.section}>
            <div className={styles.container}>
                <div className={styles.grid}>
                    {/* Sqft */}
                    <div className={styles.feature}>
                        <div className={styles.iconWrapper}>
                            <Rocket color="#b99764" className={styles.icon} />
                        </div>
                        <h3 className={styles.title}>Fast-Track Your ADU</h3>
                        <p className={styles.text}>Simple steps to avoid costly delays.</p>
                    </div>

                    {/* Beds / Baths */}
                    <div className={styles.feature}>
                        <div className={styles.iconWrapper}>
                            <Eye color="#b99764" className={styles.icon} />
                        </div>
                        <h3 className={styles.title}>See What&rsquo;s Possible</h3>
                        <p className={styles.text}>Get inspired by real ADUs built in your area</p>
                    </div>

                    {/* Build Duration */}
                    <div className={styles.feature}>
                        <div className={styles.iconWrapper}>
                            <TrendingUp color="#b99764" className={styles.icon} />
                        </div>
                        <h3 className={styles.title}>Why Now Is the Time</h3>
                        <p className={styles.text}>Learn how ADUs could boost your property&rsquo;s value.</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
