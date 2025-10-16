"use client";

import { useState } from "react";
import styles from "./OpenHouseFloorplans.module.css";
import Image from "next/image";

interface FloorPlanToggleProps {
    standardFloorPlanUrl: string;
    customFloorPlanUrl: string;
    sqft: number; // added
}

export default function FloorPlanToggle({ standardFloorPlanUrl, customFloorPlanUrl, sqft }: FloorPlanToggleProps) {
    const [showCustom, setShowCustom] = useState(false);

    return (
        <div className={styles.floorplansContainer}>
            {/* Button group */}
            <div className={styles.buttonGroup}>
                <button
                    className={
                        !showCustom
                            ? styles.buttonGroupButtonLeft_selected
                            : styles.buttonGroupButtonLeft
                    }
                    onClick={() => setShowCustom(false)}
                >
                    Estate {sqft} Floor Plan
                </button>
                <button
                    className={
                        showCustom
                            ? styles.buttonGroupButtonRight_selected
                            : styles.buttonGroupButtonRight
                    }
                    onClick={() => setShowCustom(true)}
                >
                    Customized For This Property
                </button>
            </div>

            {/* Floor plan images */}
            <div className={styles.floorplanImageWrapper}>
                {!showCustom && (
                    <Image
                        src={standardFloorPlanUrl}
                        alt="Standard Floor Plan"
                        className={styles.floorplanImage}
                        width={500}
                        height={500}
                    />
                )}
                {showCustom && (
                    <Image
                        src={customFloorPlanUrl}
                        alt="Customized Floor Plan"
                        className={styles.floorplanImage}
                        width={500}
                        height={500}
                    />
                )}
            </div>
        </div>
    );
}
