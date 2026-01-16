"use client";

import { useFeasibilityStore } from "@/lib/feasibility/store";
import styles from "./page.module.css";

export default function Step2Vision() {
    const { aduType, bed, bath, intendedUse, set } = useFeasibilityStore();

    return (
        <div className={styles.step}>
            <label className={styles.label}>ADU Type</label>

            <div className={styles.buttonGroup}>
                {[
                    { v: "attached", label: "Attached ADU" },
                    { v: "detached", label: "Detached ADU" },
                    { v: "garageConversion", label: "Garage Conversion" },
                ].map((o) => (
                    <button
                        key={o.v}
                        className={`${styles.optionButton} ${aduType === o.v ? styles.optionButtonActive : ""
                            }`}
                        onClick={() => set("aduType", o.v as any)}
                    >
                        {o.label}
                    </button>
                ))}
            </div>

            <div className={styles.inputGrid}>
                <div>
                    <label className={styles.label}>Bedrooms</label>
                    <input
                        className={styles.input}
                        type="text"
                        value={bed ?? ""}
                        onChange={(e) =>
                            set("bed", e.target.value ? Number(e.target.value) : null)
                        }
                    />
                </div>

                <div>
                    <label className={styles.label}>Bathrooms</label>
                    <input
                        className={styles.input}
                        type="text"
                        value={bath ?? ""}
                        onChange={(e) =>
                            set("bath", e.target.value ? Number(e.target.value) : null)
                        }
                    />
                </div>
            </div>

            <label className={`${styles.label} ${styles.labelWithSpacing}`}>
                Intended Use
            </label>

            <div className={styles.buttonGroup}>
                {[
                    { v: "family", label: "Family" },
                    { v: "investment", label: "Investment (rental)" },
                    { v: "other", label: "Other" },
                ].map((o) => (
                    <button
                        key={o.v}
                        className={`${styles.optionButton} ${intendedUse === o.v ? styles.optionButtonActive : ""
                            }`}
                        onClick={() => set("intendedUse", o.v as any)}
                    >
                        {o.label}
                    </button>
                ))}
            </div>
        </div>
    );
}
