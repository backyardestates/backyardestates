"use client";

import { useMemo } from "react";
import { useFeasibilityStore } from "@/lib/feasibility/store";
import styles from "./Vision.module.css";

type Motivation =
    | "family"
    | "rental"
    | "office"
    | "guest"
    | "value"
    | "other";

type AduType =
    | "detachedNew"
    | "attachedNew"
    | "garageConversion"
    | "existingSpace"
    | "jadu";

type Priority =
    | "lowestCost"
    | "maxPrivacy"
    | "fastTimeline"
    | "maxRental"
    | "resaleValue";



export default function Vision() {
    const {
        // existing
        aduType,
        bed,
        bath,

        // new (recommended)
        motivation,
        motivationOther,
        occupant,
        timeframe,
        priority,

        set,
    } = useFeasibilityStore();

    const aduTypeCards = useMemo(
        () =>
            [
                {
                    v: "detachedNew",
                    title: "Detached New Construction",
                    desc: "Stand-alone unit with maximum privacy & layout flexibility.",
                    meta: "Best for: rentals + multi-gen living",
                },
                {
                    v: "attachedNew",
                    title: "Attached New Construction",
                    desc: "Connected to the main home—often efficient utilities + footprint.",
                    meta: "Best for: family + cost control",
                },
                {
                    v: "garageConversion",
                    title: "Garage Conversion",
                    desc: "Fastest path when the structure works (and zoning supports it).",
                    meta: "Best for: speed + budget",
                },
                {
                    v: "jadu",
                    title: "JADU (≤ 500 sq ft)",
                    desc: "Within the primary structure—small footprint, big impact.",
                    meta: "Best for: simple living + family support",
                },
            ] as const,
        []
    );

    const motivationCards = useMemo(
        () =>
            [
                {
                    v: "family",
                    title: "Housing for family",
                    desc: "Support parents, adult kids, or multi-generational living.",
                },
                {
                    v: "rental",
                    title: "Rental income",
                    desc: "Offset mortgage or build long-term investment value.",
                },
                {
                    v: "office",
                    title: "Home office / studio",
                    desc: "Dedicated space for work, clients, or creative focus.",
                },
                {
                    v: "guest",
                    title: "Guest housing",
                    desc: "Comfortable space for visitors without disrupting the main home.",
                },
                {
                    v: "value",
                    title: "Increase property value",
                    desc: "Add functional square footage and flexibility for the future.",
                },
                {
                    v: "other",
                    title: "Other",
                    desc: "Tell us what you’re trying to achieve—we’ll map the best path.",
                },
            ] as const,
        []
    );

    const priorityPills = useMemo(
        () =>
            [
                { v: "lowestCost", label: "Lowest cost" },
                { v: "maxPrivacy", label: "Max privacy" },
                { v: "fastTimeline", label: "Fast timeline" },
                { v: "maxRental", label: "Max rental income" },
                { v: "resaleValue", label: "Best resale value" },
            ] as const,
        []
    );

    return (
        <section className={styles.step}>
            {/* HERO */}
            <div className={styles.heroCard}>
                <div className={styles.heroEyebrow}>Step 1</div>
                <h2 className={styles.heroHeadline}>Your ADU vision</h2>
                <p className={styles.heroSubhead}>
                    Answer a few quick questions so we can recommend the best ADU path and
                    flag feasibility risks early (utilities, access, setbacks, fire, etc.).
                </p>
            </div>

            {/* MOTIVATION */}
            <div className={styles.card}>
                <h3 className={styles.sectionTitle}>What’s your primary motivation?</h3>
                <p className={styles.helperText}>
                    This helps us prioritize layout, privacy, and the best construction
                    approach.
                </p>

                <div className={styles.cardGrid}>
                    {motivationCards.map((m) => {
                        const active = motivation === m.v;
                        return (
                            <button
                                key={m.v}
                                type="button"
                                className={`${styles.choiceCard} ${active ? styles.choiceCardActive : ""
                                    }`}
                                onClick={() => {
                                    set("motivation", m.v as any);

                                    // clear "other" text unless "other" is selected
                                    if (m.v !== "other") {
                                        set("motivationOther", "");
                                    }
                                }}
                            >
                                <div className={styles.choiceTop}>
                                    <div className={styles.choiceTitle}>{m.title}</div>
                                    <div
                                        className={`${styles.choiceDot} ${active ? styles.choiceDotActive : ""
                                            }`}
                                        aria-hidden
                                    />
                                </div>
                                <div className={styles.choiceDesc}>{m.desc}</div>
                            </button>
                        );
                    })}
                </div>

                {motivation === "other" && (
                    <div className={styles.mt1}>
                        <label className={styles.label}>
                            If “Other”, tell us what you’re aiming for
                        </label>
                        <textarea
                            className={styles.textarea}
                            value={motivationOther ?? ""}
                            placeholder="Example: short-term rental + a quiet office; or a future downsizing plan…"
                            onChange={(e) => set("motivationOther", e.target.value)}
                        />
                    </div>
                )}

                <div className={styles.divider} />

                <label className={styles.label}>
                    What is most important to you?
                </label>
                <div className={styles.pillRow}>
                    {priorityPills.map((p) => {
                        const active = priority === p.v;
                        return (
                            <button
                                key={p.v}
                                type="button"
                                className={`${styles.pill} ${active ? styles.pillActive : ""}`}
                                onClick={() => set("priority", p.v as any)}
                            >
                                {p.label}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* ADU TYPE */}
            <div className={styles.card}>
                <h3 className={styles.sectionTitle}>What type of ADU are you considering?</h3>
                <p className={styles.helperText}>
                    Don’t worry if you’re not sure—pick your best guess. We’ll validate it
                    during feasibility.
                </p>

                <div className={styles.cardGrid}>
                    {aduTypeCards.map((t) => {
                        const active = aduType === t.v;
                        return (
                            <button
                                key={t.v}
                                type="button"
                                className={`${styles.choiceCard} ${active ? styles.choiceCardActive : ""
                                    }`}
                                onClick={() => set("aduType", t.v as any)}
                            >
                                <div className={styles.choiceTop}>
                                    <div className={styles.choiceTitle}>{t.title}</div>
                                    <div
                                        className={`${styles.choiceDot} ${active ? styles.choiceDotActive : ""
                                            }`}
                                        aria-hidden
                                    />
                                </div>
                                <div className={styles.choiceDesc}>{t.desc}</div>
                                <div className={styles.choiceMeta}>{t.meta}</div>
                            </button>
                        );
                    })}
                </div>
            </div>



            {/* MICRO-CALLOUT */}
            <div className={`${styles.card} ${styles.cardBeige}`}>
                <div className={styles.calloutTitle}>Why we ask this</div>
                <p className={styles.helperText}>
                    Your answers let us recommend the right approach and flag early risks
                    like utility upgrades, access constraints, fire requirements, and
                    conversion feasibility—before you waste time.
                </p>
            </div>
        </section>
    );
}
