"use client";

import { useEffect, useState } from "react";
import { client } from "@/sanity/client";
import { FLOORPLANS_MATCH_QUERY } from "@/sanity/queries";
import { useFeasibilityStore } from "@/lib/feasibility/store";

type Floorplan = {
    _id: string;
    name: string;
    bed: number;
    bath: number;
    sqft: number;
    price: number;
};

export default function Step6Floorplan() {
    const { bed, bath, selectedFloorplanId, set } = useFeasibilityStore();
    const [items, setItems] = useState<Floorplan[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        (async () => {
            if (bed == null || bath == null) return;
            setLoading(true);

            const bedMin = Math.max(0, bed - 1);
            const bedMax = bed + 1;
            const bathMin = Math.max(0, bath - 1);
            const bathMax = bath + 1;

            const data = await client.fetch(FLOORPLANS_MATCH_QUERY, { bedMin, bedMax, bathMin, bathMax });
            setItems(data || []);
            setLoading(false);
        })();
    }, [bed, bath]);

    if (bed == null || bath == null) return <p>Please choose beds/baths first.</p>;
    if (loading) return <p>Loading floorplans…</p>;

    return (
        <div>
            <p style={{ color: "var(--color-neutral-600)", marginBottom: "1rem" }}>
                Based on your preferences, here are floorplans that match (or are very close).
            </p>

            <div style={{ display: "grid", gap: ".75rem" }}>
                {items.map((fp) => {
                    const active = selectedFloorplanId === fp._id;
                    return (
                        <button
                            key={fp._id}
                            className="multistep button"
                            onClick={() => set("selectedFloorplanId", fp._id)}
                            style={{
                                height: "auto",
                                textAlign: "left",
                                padding: "1rem 1.25rem",
                                background: active ? "var(--color-brand-beige)" : "var(--color-neutral-0)",
                                color: active ? "white" : "var(--color-brand-dark-blue)",
                                border: active ? "none" : "2px solid var(--color-neutral-100)",
                            }}
                        >
                            <div style={{ fontWeight: 800 }}>{fp.name}</div>
                            <div style={{ opacity: 0.9 }}>
                                {fp.bed} bed • {fp.bath} bath • {fp.sqft} sqft • ${fp.price.toLocaleString()}
                            </div>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
