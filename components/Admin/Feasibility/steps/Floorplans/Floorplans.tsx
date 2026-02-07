"use client";

import { useEffect, useMemo, useState } from "react";
import { client } from "@/sanity/client";
import { FLOORPLANS_MATCH_QUERY } from "@/sanity/queries";
import { useAnswersStore } from "@/lib/feasibility/stores/answers.store";
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
    const bedDelta = Math.abs(fp.bed - targetBed);
    const bathDelta = Math.abs(fp.bath - targetBath);
    const distance = bedDelta * 18 + bathDelta * 14;
    const score = clamp(Math.round(100 - distance), 0, 100);

    const label =
        bedDelta === 0 && bathDelta === 0
            ? "Exact match"
            : bedDelta <= 1 && bathDelta <= 0.5
                ? "Very close match"
                : "Close match";

    return { score, label };
}

export default function FloorplansStep() {
    const answers = useAnswersStore((s) => s.answers);
    const setAnswer = useAnswersStore((s) => s.setAnswer);

    // ✅ Always have usable numeric values (even if answers are empty)
    const bedVal =
        typeof answers.bed === "number" ? answers.bed : 1; // defaultValue: 1
    const bathVal =
        typeof answers.bath === "number" ? answers.bath : 1; // defaultValue: 1

    const timeframe = (answers.timeframe as string | undefined) ?? "";
    const selectedFloorplanId =
        (answers.selectedFloorplanId as string | undefined) ?? null;

    const [items, setItems] = useState<Floorplan[]>([]);
    const [loading, setLoading] = useState(true);
    const [budgetBand, setBudgetBand] = useState<string>("");

    // ✅ Seed defaults once so the store is complete + Next gating works
    useEffect(() => {
        if (typeof answers.bed !== "number") setAnswer("bed", 1);
        if (typeof answers.bath !== "number") setAnswer("bath", 1);
        // optional: if you want timeframe default
        // if (!answers.timeframe) setAnswer("timeframe", "flexible");
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // ✅ Fetch plans whenever bed/bath change (uses safe numeric values)
    useEffect(() => {
        let cancelled = false;

        (async () => {
            setLoading(true);

            const bedMin = Math.max(0, bedVal - 2);
            const bedMax = bedVal + 2;
            const bathMin = Math.max(0, bathVal - 1);
            const bathMax = bathVal + 1;

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
    }, [bedVal, bathVal]);

    const ranked = useMemo(() => {
        const scored = items.map((fp) => {
            const { score, label } = fitScore(fp, bedVal, bathVal);
            const valuePerSqft = fp.price && fp.sqft ? fp.price / fp.sqft : null;
            return { fp, score, label, valuePerSqft };
        });

        const filtered = scored.filter(({ fp }) => {
            if (!budgetBand) return true;
            if (budgetBand === "under300") return fp.price < 300000;
            if (budgetBand === "300to400")
                return fp.price >= 300000 && fp.price <= 400000;
            if (budgetBand === "400plus") return fp.price > 400000;
            return true;
        });

        filtered.sort((a, b) => {
            if (b.score !== a.score) return b.score - a.score;
            if (a.valuePerSqft == null) return 1;
            if (b.valuePerSqft == null) return -1;
            return a.valuePerSqft - b.valuePerSqft;
        });

        return filtered;
    }, [items, bedVal, bathVal, budgetBand]);

    const selected = useMemo(() => {
        return items.find((x) => x._id === selectedFloorplanId) || null;
    }, [items, selectedFloorplanId]);

    return (
        <section className={styles.step}>
            <div className={styles.heroCard}>
                <div className={styles.heroEyebrow}>Step 3</div>
                <h2 className={styles.heroHeadline}>Choose a floorplan</h2>
                <p className={styles.heroSubhead}>
                    We’ll show the best matches for your desired layout—and help you pick a
                    plan we can validate for feasibility next.
                </p>

                <div className={styles.card}>
                    <div className={styles.inputGrid2}>
                        <div>
                            <label className={styles.label}>Bedrooms</label>
                            <div className={styles.stepper}>
                                <button
                                    type="button"
                                    className={styles.stepperBtn}
                                    onClick={() => setAnswer("bed", clamp(bedVal - 1, 0, 3))}
                                >
                                    −
                                </button>
                                <div className={styles.stepperValue}>{bedVal}</div>
                                <button
                                    type="button"
                                    className={styles.stepperBtn}
                                    onClick={() => setAnswer("bed", clamp(bedVal + 1, 0, 3))}
                                >
                                    +
                                </button>
                            </div>
                        </div>

                        <div>
                            <label className={styles.label}>Bathrooms</label>
                            <div className={styles.stepper}>
                                <button
                                    type="button"
                                    className={styles.stepperBtn}
                                    onClick={() =>
                                        setAnswer("bath", clamp(Number((bathVal - 0.5).toFixed(2)), 0.5, 2))
                                    }
                                >
                                    −
                                </button>
                                <div className={styles.stepperValue}>{bathVal}</div>
                                <button
                                    type="button"
                                    className={styles.stepperBtn}
                                    onClick={() =>
                                        setAnswer("bath", clamp(Number((bathVal + 0.5).toFixed(2)), 0.5, 2))
                                    }
                                >
                                    +
                                </button>
                            </div>
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
                                value={timeframe}
                                onChange={(e) => setAnswer("timeframe", e.target.value)}
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
                        No matches found for <b>{bedVal} bed</b> / <b>{bathVal} bath</b> under
                        your current filters. Try adjusting by 1 bedroom or bathroom (or
                        clear the budget filter).
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
                        {ranked.map(({ fp, label }) => {
                            const active = selectedFloorplanId === fp._id;
                            return (
                                <button
                                    key={fp._id}
                                    type="button"
                                    onClick={() => {
                                        setAnswer("selectedFloorplanId", fp._id);

                                        setAnswer("selectedFloorplan", {
                                            id: fp._id,
                                            name: fp.name,
                                            price: fp.price,
                                            sqft: fp.sqft,
                                            bed: fp.bed,
                                            bath: fp.bath,
                                            drawingUrl: fp.drawing?.url,
                                        });
                                    }}
                                    className={`${styles.stepCardButton} ${active ? styles.stepCardButtonActive : ""}`}
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

                </>
            )}
        </section>
    );
}
