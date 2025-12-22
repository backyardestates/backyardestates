"use client";

import { useState } from "react";
import Image from "next/image";
import styles from "./SelectionsGallery.module.css";

interface Item {
    _id: string;
    title: string;
    images?: { secure_url: string }[] | null;
    isStandard?: boolean;
    upgradePrice?: number | null;
    finishColor?: string | null;
}

interface TypeGroup {
    title: string;
    items: Item[];
}

interface Category {
    title: string;
    types: Record<string, TypeGroup>;
}

export default function SelectionsGallery({
    data,
    variant = "catalog",
}: {
    data: Record<string, Category>;
    variant?: "catalog" | "property";
}) {
    const categories = Object.entries(data);
    const [activeCategory, setActiveCategory] = useState(categories[0][0]);

    const activeData = data[activeCategory];
    console.log("Active Data:", activeData);

    return (
        <section className={styles.wrapper}>
            {/* CATEGORY TABS */}
            <div className={styles.tabs}>
                {categories.map(([key, cat]) => (
                    <button
                        key={key}
                        className={`${styles.tab} ${activeCategory === key ? styles.activeTab : ""
                            }`}
                        onClick={() => setActiveCategory(key)}
                    >
                        {cat.title}
                    </button>
                ))}
            </div>

            {/* TYPES */}
            <div className={`${styles.types} ${styles[variant]}`}>
                {Object.values(activeData.types).map((type) => (
                    <div key={type.title} className={styles.typeBlock}>
                        <h3 className={styles.typeTitle}>{type.title}</h3>

                        <div className={styles.grid}>
                            {type.items.map((item) => {
                                const shouldContain =
                                    type.title === "Appliances" || type.title === "Cabinets" || type.title === "Kitchen Sinks" || type.title === "Faucets" || type.title === "Lighting Fixtures" || type.title === "Interior Finishes";
                                return (
                                    <div key={item._id} className={styles.card}>
                                        {/* BADGE */}
                                        <div
                                            className={`${styles.badge} ${item.isStandard
                                                ? styles.standardBadge
                                                : styles.upgradeBadge
                                                }`}
                                        >
                                            {item.isStandard ? "Standard" : "Upgrade"}
                                        </div>

                                        {/* IMAGE */}
                                        <div
                                            className={`${styles.imageWrapper} ${shouldContain ? styles.contain : styles.cover
                                                } ${type.title === "Cabinets" ? styles.cabinetImage : ""}`}
                                        >
                                            {item.images?.[0]?.secure_url && (
                                                <Image
                                                    src={item.images[0].secure_url}
                                                    alt={item.title}
                                                    className={styles.image}
                                                    width={300}
                                                    height={300}
                                                />
                                            )}
                                        </div>

                                        {/* BODY */}
                                        <div className={styles.cardBody}>
                                            <span className={styles.itemTitle}>{item.title}</span>

                                            {/* FINISH COLOR */}
                                            {/* {item.finishColor && (
                                                <div className={styles.finishRow}>
                                                    <span
                                                        className={styles.colorChip}
                                                        data-color={item.finishColor}
                                                    />
                                                    <span className={styles.finishLabel}>
                                                        {item.finishColor.replace("-", " ")}
                                                    </span>
                                                </div>
                                            )} */}

                                            {/* UPGRADE PRICE */}
                                            {/* {!item.isStandard && item.upgradePrice && (
                                                <span className={styles.upgradePrice}>
                                                    +${item.upgradePrice}
                                                </span>
                                            )} */}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
}
