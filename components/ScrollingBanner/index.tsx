"use client";

import styles from "./ScrollingBanner.module.css";

const items = [
    "ADU Design",
    "Architectural Plans",
    "Structural Engineering",
    "Title 24",
    "Civil Engineering",
    "Plan Check Fees",
    "Building & Fire Fees",
    "Water & City Fees",
    "Notarization",
    "County Recording",
    "Agency Coordination",
    "Zoning Verification",
    "Project Management",
    "City Inspections",
    "Certificate of Occupancy",
    "Turn-Key Construction",
    "Premium Finishes",
    "Utility Connections",
    "Weekly Updates",
    "Financing",
    "Exterior Design",
    "Interior Design",
    "Pre-Construction",
    "Final Walkthrough",
    "Warranty Support",
];


export default function ScrollingBanner() {
    return (
        <div className={styles.wrapper}>
            <div className={styles.track}>
                {items.map((item, i) => (
                    <span className={styles.item} key={i}>{item}</span>
                ))}
                {items.map((item, i) => (
                    <span className={styles.item} key={`dup-${i}`}>{item}</span>
                ))}
            </div>
        </div>

    );
}
