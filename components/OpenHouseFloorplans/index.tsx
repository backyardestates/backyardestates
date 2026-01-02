"use client";

import { useState } from "react";
import styles from "./OpenHouseFloorplans.module.css";
import Image from "next/image";
import { Bed, Bath, Ruler, Sparkles, Layers, Gauge, Wand2 } from "lucide-react";
import Link from "next/link";
import SoftCTA from "../SoftCTA";

interface FloorPlanProps {
    floorplan: any;
    customFloorplanPicture?: string | null;
    sqft?: number;
    bed?: number;
    bath?: number;
}

export default function OpenHouseFloorplans({
    floorplan,
    customFloorplanPicture,
    sqft,
    bed = 1,
    bath = 1,
}: FloorPlanProps) {
    const [showCustom, setShowCustom] = useState(false);
    const standardUrl = floorplan?.drawing?.secure_url;
    const customUrl = customFloorplanPicture
        ? customFloorplanPicture
        : null;
    const displayUrl = showCustom && customUrl ? customUrl : standardUrl;
    return (
        <section className={styles.experienceContainer}>
            {/* HERO BLUEPRINT INTRO */}
            <div className={styles.blueprintHero}>
                <h2 className={styles.heroTitle}>From Blueprint to Beautiful Living</h2>
                <p className={styles.heroText}>
                    Every Backyard Estates floor plan is thoughtfully engineered to feel open,
                    functional, and intentional
                </p>
            </div>

            {/* TOGGLE PANEL */}
            <div className={styles.splitPanel}>
                <div className={styles.panelHeader}>
                    <span className={styles.panelLabel}>Explore This Design</span>
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
                            alt={
                                showCustom
                                    ? "Custom ADU floor plan designed for this specific property"
                                    : "Proven ADU floor plan optimized for efficiency and livability"
                            }
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
                    <h3>Proven by Design</h3>
                    <p>
                        Our core floor plans are the result of years of real-world builds —
                        engineered for efficiency, code compliance, and smooth approvals across
                        Southern California.
                    </p>
                </div>

                <div className={styles.storyCard}>
                    <Gauge className={styles.storyIcon} />
                    <h3>Designed Around Your Property</h3>
                    <p>
                        Every lot has unique constraints and opportunities. We analyze access,
                        setbacks, utilities, and natural light to unlock layouts that work better —
                        not just on paper, but in real life.
                    </p>
                </div>

                <div className={styles.storyCard}>
                    <Wand2 className={styles.storyIcon} />
                    <h3>Tailored to How You Live</h3>
                    <p>
                        When a property allows for it, we transform the standard footprint into
                        something uniquely tailored to your lifestyle, whether it&rsquo;s family,
                        rental income, or long-term comfort.
                    </p>
                </div>
            </div>
            <SoftCTA
                text="Confidence begins with knowing what&rsquo;s possible."
                linkText="See what your property qualifies for"
                href="/talk-to-an-adu-specialist"
            />

        </section>
    );
}
