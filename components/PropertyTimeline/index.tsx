import styles from "./PropertyTimeline.module.css";
import { PencilLine, FileCheck2, BrickWall } from "lucide-react";

interface PropertyTimeline {
    planning: number;
    permitting: number;
    construction: number;

}

export default function PropertyTimeline({ planning, permitting, construction }: PropertyTimeline) {

    // Calculate build duration from timeline if available
    return (
        <div className={styles.section}>
            <div className={styles.container}>
                <div className={styles.grid}>
                    {/* Sqft */}
                    <div className={styles.feature}>
                        <div className={styles.iconWrapper}>
                            <PencilLine color="#b99764" className={styles.icon} />
                        </div>
                        <h3 className={styles.title}>{planning} Weeks</h3>
                        <p className={styles.text}>Planning</p>
                    </div>

                    {/* Beds / Baths */}
                    <div className={styles.feature}>
                        <div className={styles.iconWrapper}>
                            <FileCheck2 color="#b99764" className={styles.icon} />
                        </div>
                        <h3 className={styles.title}>{permitting} Weeks</h3>
                        <p className={styles.text}>Permitting</p>
                    </div>

                    {/* Build Duration */}
                    <div className={styles.feature}>
                        <div className={styles.iconWrapper}>
                            <BrickWall color="#b99764" className={styles.icon} />
                        </div>
                        <h3 className={styles.title}>{construction} Weeks</h3>
                        <p className={styles.text}>Construction</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
