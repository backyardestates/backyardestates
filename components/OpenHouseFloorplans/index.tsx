"use client";

import { useState } from "react";
import styles from "./OpenHouseFloorplans.module.css";
import Image from "next/image";
import { Bed, Bath, Ruler, Sparkles, Layers, Gauge, Wand2 } from "lucide-react";

interface FloorPlanProps {
    floorplan: any;
    customFloorplanPicture?: string | null;
    sqft?: number;
    bed?: number;
    bath?: number;
}

function removeBackground(url: string) {
    return url.replace("/upload/", "/upload/e_background_removal/");
}

export default function FloorPlanExperience({
    floorplan,
    customFloorplanPicture,
    sqft,
    bed = 1,
    bath = 1,
}: FloorPlanProps) {
    const [showCustom, setShowCustom] = useState(false);
    const standardUrl = removeBackground(floorplan?.drawing?.secure_url);
    const customUrl = customFloorplanPicture
        ? removeBackground(customFloorplanPicture)
        : null;
    const displayUrl = showCustom && customUrl ? customUrl : standardUrl;
    return (
        <section className={styles.experienceContainer}>
            {/* HERO BLUEPRINT INTRO */}
            <div className={styles.blueprintHero}>
                <h2 className={styles.heroTitle}>How a Floor Plan Becomes a Home</h2>
            </div>

            {/* TOGGLE PANEL */}
            <div className={styles.splitPanel}>
                <div className={styles.panelHeader}>
                    <span className={styles.panelLabel}>Compare Designs</span>
                    <div className={styles.segmentedControl}>
                        <button
                            className={`${styles.segmentButton} ${!showCustom ? styles.segmentActive : ""
                                }`}
                            onClick={() => setShowCustom(false)}
                        >
                            Standard Plan
                        </button>
                        <button
                            className={`${styles.segmentButton} ${showCustom ? styles.segmentActive : ""
                                }`}
                            onClick={() => setShowCustom(true)}
                            disabled={!customUrl}
                        >
                            Custom Plan
                            <Sparkles className={styles.sparkIcon} />
                        </button>
                    </div>
                    {/* SPECS */}
                    <div className={styles.specsBar}>
                        <div className={styles.specItem}>
                            <Bed />
                            <span>{bed} Bed</span>
                        </div>
                        <div className={styles.specItem}>
                            <Bath />
                            <span>{bath} Bath</span>
                        </div>
                        <div className={styles.specItem}>
                            <Ruler />
                            <span>{sqft} Sq Ft</span>
                        </div>
                    </div>
                </div>

                {/* SIDE-BY-SIDE SLIDER */}
                <div className={styles.compareWrapper}>
                    {/* FLOOR PLAN IMAGE */}
                    <div className={styles.imageCard}>
                        <Image
                            key={displayUrl}
                            src={displayUrl}
                            alt={showCustom ? "Customized Floor Plan" : "Standard Floor Plan"}
                            width={1200}
                            height={900}
                            className={`${styles.floorplanImage} ${styles.fadeImage}`}
                        />
                    </div>
                </div>


            </div>

            {/* STORY PANELS */}
            <div className={styles.storySection}>
                <div className={styles.storyCard}>
                    <Layers className={styles.storyIcon} />
                    <h3>Smart Foundation</h3>
                    <p>
                        Our standard plans are engineered to be efficient, functional, and
                        cost-effective — perfect for most properties.
                    </p>
                </div>

                <div className={styles.storyCard}>
                    <Gauge className={styles.storyIcon} />
                    <h3>Optimized for Your Lot</h3>
                    <p>
                        Certain sites unlock better layouts by adjusting circulation, access,
                        utilities, and light exposure.
                    </p>
                </div>

                <div className={styles.storyCard}>
                    <Wand2 className={styles.storyIcon} />
                    <h3>Customized for Living</h3>
                    <p>
                        When a property allows for it, we transform the standard footprint into
                        something uniquely tailored to your lifestyle.
                    </p>
                </div>
            </div>
        </section>
    );
}
