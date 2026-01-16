"use client";

import { useEffect, useState } from "react";
import { client } from "@/sanity/client";
import { FLOORPLANS_MATCH_QUERY } from "@/sanity/queries";
import { useFeasibilityStore } from "@/lib/feasibility/store";
import styles from "./page.module.css";

type Floorplan = {
    _id: string;
    name: string;
    bed: number;
    bath: number;
    sqft: number;
    price: number;
    drawing: {
        url: string;
    };
};

export default function Step6Floorplan() {
    const { bed, bath, selectedFloorplanId, set } = useFeasibilityStore();
    const [items, setItems] = useState<Floorplan[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;

        (async () => {
            if (bed == null || bath == null) {
                setLoading(false);
                return;
            }

            setLoading(true);

            const bedMin = Math.max(0, bed - 1);
            const bedMax = bed + 1;
            const bathMin = Math.max(0, bath - 1);
            const bathMax = bath + 1;

            try {
                const data = await client.fetch(FLOORPLANS_MATCH_QUERY, {
                    bedMin,
                    bedMax,
                    bathMin,
                    bathMax,
                });

                data.pop();

                if (!cancelled) setItems(data || []);
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [bed, bath]);

    if (bed == null || bath == null) {
        return (
            <div className={styles.step}>
                <div className={styles.card}>
                    <p className={styles.helperText}>
                        Please choose <b>bedrooms</b> and <b>bathrooms</b> first so we can recommend floorplans that match.
                    </p>
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className={styles.step}>
                <div className={styles.card}>
                    <p className={styles.helperText}>Loading floorplans…</p>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.step}>
            <p className={styles.helperText}>
                Based on your preferences, here are floorplans that match (or are very close).
            </p>

            {/* Using the existing floorplanGrid spacing for a nice vertical list */}
            <div className={styles.floorplanGrid}>
                {items.length === 0 ? (
                    <div className={styles.card}>
                        <p className={styles.helperText}>
                            No close matches found for <b>{bed} bed</b> / <b>{bath} bath</b>.
                            Try adjusting by 1 bedroom or bathroom.
                        </p>
                    </div>
                ) : (
                    items.map((fp) => {
                        const active = selectedFloorplanId === fp._id;
                        return (
                            <button
                                key={fp._id}
                                type="button"
                                onClick={() => set("selectedFloorplanId", fp._id)}
                                className={`${styles.stepCardButton} ${active ? styles.stepCardButtonActive : ""}`}
                            >
                                <div className={styles.stepCardImage}>
                                    <img src={fp.drawing?.url} alt={fp.name} className={styles.floorplanImage} />
                                </div>
                                <div className={styles.stepCardTitleRow}>
                                    <div className={styles.stepCardName}>{fp.name}</div>
                                    <span className={`${styles.pill} ${active ? styles.pillActive : ""}`}>
                                        {active ? "Selected" : "Select"}
                                    </span>
                                </div>

                                <div className={styles.stepCardMeta}>
                                    {fp.bed} bed • {fp.bath} bath • {fp.sqft} sqft • ${fp.price.toLocaleString()}
                                </div>
                            </button>
                        );
                    })
                )}
            </div>
        </div>
    );
}
