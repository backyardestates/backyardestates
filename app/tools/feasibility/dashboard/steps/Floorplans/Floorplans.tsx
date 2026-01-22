"use client";

import { useEffect, useMemo, useState } from "react";
import { client } from "@/sanity/client";
import { FLOORPLANS_MATCH_QUERY } from "@/sanity/queries";
import { useFeasibilityStore } from "@/lib/feasibility/store";
import styles from "./Floorplans.module.css";

type Floorplan = {
    _id: string;
    name: string;
    bed: number;
    bath: number;
    sqft: number;
    price: number;
    drawing?: { url: string };
};

function clamp(n: number, min: number, max: number) {
    return Math.max(min, Math.min(max, n));
}

function fitScore(fp: Floorplan, targetBed: number, targetBath: number) {
    // weighted distance: bedrooms matter slightly more than bathrooms
    const bedDelta = Math.abs(fp.bed - targetBed);
    const bathDelta = Math.abs(fp.bath - targetBath);

    // lower is better; convert to "score out of 100"
    const distance = bedDelta * 18 + bathDelta * 14;
    const score = clamp(Math.round(100 - distance), 0, 100);

    const label =
        bedDelta === 0 && bathDelta === 0
            ? "Exact match"
            : bedDelta <= 1 && bathDelta <= 0.5
                ? "Very close match"
                : "Close match";

    return { score, label, bedDelta, bathDelta };
}

export default function Floorplans() {
    const {
        bed,
        bath,
        timeframe,
        selectedFloorplanId,
        set,
        // optional: from your vision step (if you added them)
        motivation,
        priority,
    } = useFeasibilityStore();

    const [items, setItems] = useState<Floorplan[]>([]);
    const [loading, setLoading] = useState(true);

    // Optional “soft” filter UI – keep local, doesn’t need to persist yet
    const [budgetBand, setBudgetBand] = useState<string>("");

    useEffect(() => {
        let cancelled = false;

        (async () => {
            if (bed == null || bath == null) {
                setLoading(false);
                return;
            }

            setLoading(true);

            // Wider search net -> better results, then we rank in the UI
            const bedMin = Math.max(0, bed - 2);
            const bedMax = bed + 2;
            const bathMin = Math.max(0, bath - 1);
            const bathMax = bath + 1;

            try {
                const data = await client.fetch(FLOORPLANS_MATCH_QUERY, {
                    bedMin,
                    bedMax,
                    bathMin,
                    bathMax,
                });

                if (!cancelled) setItems(Array.isArray(data) ? data : []);
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [bed, bath]);

    const ranked = useMemo(() => {
        if (bed == null || bath == null) return [];

        const scored = items.map((fp) => {
            const { score, label } = fitScore(fp, bed, bath);
            const valuePerSqft = fp.price && fp.sqft ? fp.price / fp.sqft : null;

            return { fp, score, label, valuePerSqft };
        });

        // Optional budget filtering (rough)
        const filtered = scored.filter(({ fp }) => {
            if (!budgetBand) return true;
            if (budgetBand === "under300") return fp.price < 300000;
            if (budgetBand === "300to400") return fp.price >= 300000 && fp.price <= 400000;
            if (budgetBand === "400plus") return fp.price > 400000;
            return true;
        });

        // Sort: higher fit score first, then lower $/sqft (value)
        filtered.sort((a, b) => {
            if (b.score !== a.score) return b.score - a.score;
            if (a.valuePerSqft == null) return 1;
            if (b.valuePerSqft == null) return -1;
            return a.valuePerSqft - b.valuePerSqft;
        });

        return filtered;
    }, [items, bed, bath, budgetBand]);

    const selected = useMemo(() => {
        return items.find((x) => x._id === selectedFloorplanId) || null;
    }, [items, selectedFloorplanId]);

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

    return (
        <section className={styles.step}>
            {/* HERO */}
            <div className={styles.heroCard}>
                <div className={styles.heroEyebrow}>Step 2</div>
                <h2 className={styles.heroHeadline}>Choose a floorplan</h2>
                <p className={styles.heroSubhead}>
                    We’ll show the best matches for your desired layout—and help you pick a plan we can validate for feasibility next.
                </p>
                {/* CONTROLS */}
                <div className={styles.card}>
                    <div className={styles.inputGrid2}>
                        <div>
                            <label className={styles.label}>Bedrooms</label>
                            <div className={styles.stepper}>
                                <button
                                    type="button"
                                    className={styles.stepperBtn}
                                    onClick={() => set("bed", clamp((bed ?? 0) - 1, 0, 3))}
                                    aria-label="Decrease bedrooms"
                                >
                                    −
                                </button>
                                <div className={styles.stepperValue}>{bed ?? 0}</div>
                                <button
                                    type="button"
                                    className={styles.stepperBtn}
                                    onClick={() => set("bed", clamp((bed ?? 0) + 1, 0, 3))}
                                    aria-label="Increase bedrooms"
                                >
                                    +
                                </button>
                            </div>
                            <div className={styles.inputHint}>0–3 bedrooms</div>
                        </div>

                        <div>
                            <label className={styles.label}>Bathrooms</label>
                            <div className={styles.stepper}>
                                <button
                                    type="button"
                                    className={styles.stepperBtn}
                                    onClick={() => set("bath", clamp((bath ?? 1) - 0.5, 0.5, 2))}
                                    aria-label="Decrease bathrooms"
                                >
                                    −
                                </button>
                                <div className={styles.stepperValue}>{bath ?? 1}</div>
                                <button
                                    type="button"
                                    className={styles.stepperBtn}
                                    onClick={() => set("bath", clamp((bath ?? 1) + 0.5, 0.5, 2))}
                                    aria-label="Increase bathrooms"
                                >
                                    +
                                </button>
                            </div>
                            <div className={styles.inputHint}>0.5–2 bathrooms</div>
                        </div>
                    </div>

                    <div className={styles.inputGrid2}>
                        <div>
                            <label className={styles.label}>Budget comfort (optional)</label>
                            <select
                                className={styles.select}
                                value={budgetBand}
                                onChange={(e) => setBudgetBand(e.target.value)}
                            >
                                <option value="">Not sure / show all</option>
                                <option value="under300">Under $300k</option>
                                <option value="300to400">$300k – $400k</option>
                                <option value="400plus">$400k+</option>
                            </select>
                        </div>

                        <div>
                            <label className={styles.label}>When do you want it ready?</label>
                            <select
                                className={styles.select}
                                value={timeframe ?? ""}
                                onChange={(e) => set("timeframe", e.target.value)}
                            >
                                <option value="">Select one…</option>
                                <option value="asap">ASAP</option>
                                <option value="3to6">3–6 months</option>
                                <option value="6to12">6–12 months</option>
                                <option value="flexible">Flexible</option>
                            </select>
                        </div>
                    </div>
                </div>
            </div>



            {/* RESULTS */}
            {loading ? (
                <div className={styles.card}>
                    <p className={styles.helperText}>Loading floorplans…</p>
                    <div className={styles.skeletonRow}>
                        <div className={styles.skeletonCard} />
                        <div className={styles.skeletonCard} />
                        <div className={styles.skeletonCard} />
                    </div>
                </div>
            ) : ranked.length === 0 ? (
                <div className={styles.card}>
                    <p className={styles.helperText}>
                        No matches found for <b>{bed} bed</b> / <b>{bath} bath</b> under your current filters.
                        Try adjusting by 1 bedroom or bathroom (or clear the budget filter).
                    </p>
                </div>
            ) : (
                <>
                    <div className={styles.resultsHeader}>
                        <div>
                            <h3 className={styles.sectionTitle}>Recommended floorplans</h3>
                            <p className={styles.helperText}>
                                Ordered by best fit first (then best value).
                            </p>
                        </div>
                    </div>

                    <div className={styles.floorplanGrid}>
                        {ranked.map(({ fp, score, label }) => {
                            const active = selectedFloorplanId === fp._id;

                            return (
                                <button
                                    key={fp._id}
                                    type="button"
                                    onClick={() => set("selectedFloorplanId", fp._id)}
                                    className={`${styles.stepCardButton} ${active ? styles.stepCardButtonActive : ""
                                        }`}
                                >
                                    <div className={styles.stepCardTop}>
                                        <div>
                                            <div className={styles.stepCardName}>{fp.name}</div>
                                            <div className={styles.stepCardMeta}>
                                                {fp.bed} bed • {fp.bath} bath • {fp.sqft} sqft
                                            </div>
                                        </div>

                                        <div className={styles.stepCardRight}>
                                            <span className={`${styles.pill} ${active ? styles.pillActive : ""}`}>
                                                {active ? "Selected" : "Select"}
                                            </span>
                                        </div>
                                    </div>

                                    <div className={styles.stepCardBody}>
                                        <div className={styles.imageWrap}>
                                            {fp.drawing?.url ? (
                                                <img
                                                    src={fp.drawing.url}
                                                    alt={fp.name}
                                                    className={styles.floorplanImage}
                                                    loading="lazy"
                                                />
                                            ) : (
                                                <div className={styles.imageFallback}>No drawing available</div>
                                            )}
                                        </div>

                                        <div className={styles.stepCardFooter}>
                                            <span className={styles.matchTag}>{label}</span>
                                            <div className={styles.price}>
                                                ${fp.price.toLocaleString()}
                                            </div>
                                        </div>
                                    </div>
                                </button>
                            );
                        })}
                    </div>

                    {selected ? (
                        <div className={`${styles.card} ${styles.cardBeige}`}>
                            <div className={styles.calloutTitle}>Next: feasibility checks</div>
                            <p className={styles.helperText}>
                                Great—now we’ll validate this plan against common feasibility constraints
                                like <b>utility upgrades</b>, <b>site access</b>, <b>fire requirements</b>, and <b>setbacks</b>.
                            </p>
                        </div>
                    ) : null}
                </>
            )}
        </section>
    );
}
