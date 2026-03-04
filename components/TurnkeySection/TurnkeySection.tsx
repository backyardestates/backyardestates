"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { CheckCircle2, Clock } from "lucide-react";
import styles from "./TurnkeySection.module.css";
import SoftCTA from "../SoftCTA";

type PhaseKey = "plans" | "permits" | "construction";

type Phase = {
    key: PhaseKey;
    title: string;
    timeline: string;
    items: string[];
};

type TurnkeySectionProps = {
    label?: string;
    headline?: string;
    subheadline?: string;
    phases?: Phase[];
    className?: string;
};

const DEFAULT_PHASES: Phase[] = [
    {
        key: "plans",
        title: "Plans",
        timeline: "4–6 Weeks",
        items: [
            "Custom Floor Plans",
            "Site Plan + Elevations",
            "Structural + T24",
            "MEP Engineering",
            "Soils / Survey / Hydrology",
            "Septic (if required)",
            "Full Kitchen Design",
            "Finish Selections",
        ],
    },
    {
        key: "permits",
        title: "Permits",
        timeline: "As Fast as 6 Weeks",
        items: [
            "Planning Department",
            "Building Department",
            "Engineering",
            "Fire Department",
            "School Fees",
            "Impact Fees",
            "Plan Check Corrections",
            "Permit Pull Process",
        ],
    },
    {
        key: "construction",
        title: "Construction",
        timeline: "6–10 Weeks",
        items: [
            "Dedicated PM + Superintendent",
            "Weekly Updates",
            "Jobsite Photos",
            "Online Portal (Plans, Corrections, Payments)",
            "City Inspections",
            "Finish Installation",
        ],
    },
];

export function TurnkeySection({
    label = "TURNKEY PROCESS",
    headline = "Everything Included. Start to Finish.",
    subheadline = "We handle design, engineering, permitting, and construction — so you don’t have to.",
    phases = DEFAULT_PHASES,
    className,
}: TurnkeySectionProps) {
    const [selectedPhase, setSelectedPhase] = useState(0);

    // --- Autoplay controls ---
    const sectionRef = useRef<HTMLElement | null>(null);
    const intervalRef = useRef<number | null>(null);
    const hasPlayedRef = useRef(false);
    const userInteractedRef = useRef(false);

    // --- Carousel refs ---
    const carouselRef = useRef<HTMLDivElement | null>(null);
    const cardRefs = useRef<Array<HTMLButtonElement | null>>([]);
    const isProgrammaticScrollRef = useRef(false);
    const scrollEndTimeoutRef = useRef<number | null>(null);

    const safeIndex = useMemo(() => {
        return Math.min(Math.max(selectedPhase, 0), Math.max(0, phases.length - 1));
    }, [selectedPhase, phases.length]);

    const stopAutoplay = () => {
        if (intervalRef.current != null) {
            window.clearInterval(intervalRef.current);
            intervalRef.current = null;
        }
    };

    const startAutoplay = () => {
        if (hasPlayedRef.current) return;
        if (userInteractedRef.current) return;

        hasPlayedRef.current = true;

        intervalRef.current = window.setInterval(() => {
            setSelectedPhase((prev) => {
                const lastIndex = Math.max(0, phases.length - 1);
                const stopIndex = Math.min(2, lastIndex);

                if (prev >= stopIndex) {
                    stopAutoplay();
                    return prev;
                }
                return prev + 1;
            });
        }, 2000);
    };

    const inViewRef = useRef(false);
    const isCarouselRef = useRef(false);

    useEffect(() => {
        // Track whether we are in "carousel mode" (mobile/tablet)
        const mql = window.matchMedia("(max-width: 980px)");
        const update = () => {
            isCarouselRef.current = mql.matches;
        };
        update();
        mql.addEventListener?.("change", update);
        return () => mql.removeEventListener?.("change", update);
    }, []);

    useEffect(() => {
        const el = sectionRef.current;
        if (!el) return;

        const obs = new IntersectionObserver(
            (entries) => {
                const entry = entries[0];
                if (!entry) return;
                if (entry.isIntersecting) {
                    inViewRef.current = true;
                    startAutoplay();
                };
            },
            { threshold: 0.75 }
        );

        obs.observe(el);

        return () => {
            stopAutoplay();
            obs.disconnect();
        };
    }, [phases.length]);

    useEffect(() => {
        const lastIndex = Math.max(0, phases.length - 1);
        const stopIndex = Math.min(2, lastIndex);
        if (safeIndex >= stopIndex) stopAutoplay();
    }, [safeIndex, phases.length]);

    const scrollActiveCardIntoView = (idx: number) => {
        const wrap = carouselRef.current;
        const card = cardRefs.current[idx];
        if (!wrap || !card) return;

        // ✅ Prevent page jump:
        // only auto-scroll once the section is actually in view
        // and only when carousel layout is active (mobile/tablet)
        if (!inViewRef.current) return;
        if (!isCarouselRef.current) return;

        isProgrammaticScrollRef.current = true;

        card.scrollIntoView({
            behavior: "smooth",
            inline: "center",
            block: "nearest",
        });

        if (scrollEndTimeoutRef.current) window.clearTimeout(scrollEndTimeoutRef.current);
        scrollEndTimeoutRef.current = window.setTimeout(() => {
            isProgrammaticScrollRef.current = false;
        }, 350);
    };

    // When selectedPhase changes (autoplay/dots/click), keep carousel in sync
    useEffect(() => {
        scrollActiveCardIntoView(safeIndex);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [safeIndex]);

    // When the user swipes, update selectedPhase based on centered card
    useEffect(() => {
        const wrap = carouselRef.current;
        if (!wrap) return;

        const onScroll = () => {
            if (isProgrammaticScrollRef.current) return;

            // debounce-ish: update index after scroll settles a bit
            if (scrollEndTimeoutRef.current) window.clearTimeout(scrollEndTimeoutRef.current);
            scrollEndTimeoutRef.current = window.setTimeout(() => {
                const rect = wrap.getBoundingClientRect();
                const centerX = rect.left + rect.width / 2;

                let bestIdx = 0;
                let bestDist = Number.POSITIVE_INFINITY;

                cardRefs.current.forEach((el, idx) => {
                    if (!el) return;
                    const r = el.getBoundingClientRect();
                    const cardCenter = r.left + r.width / 2;
                    const dist = Math.abs(cardCenter - centerX);
                    if (dist < bestDist) {
                        bestDist = dist;
                        bestIdx = idx;
                    }
                });

                // mark as user-driven so autoplay won’t fight them
                userInteractedRef.current = true;
                stopAutoplay();
                setSelectedPhase(bestIdx);
            }, 120);
        };

        wrap.addEventListener("scroll", onScroll, { passive: true });
        return () => wrap.removeEventListener("scroll", onScroll);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [phases.length]);

    const handleSelect = (idx: number) => {
        userInteractedRef.current = true;
        stopAutoplay();
        setSelectedPhase(idx);
        scrollActiveCardIntoView(idx);
    };

    return (
        <section ref={sectionRef} className={`${styles.section} ${className ?? ""}`}>
            <div className={styles.inner}>
                <p className={`${styles.label} ${styles.fadeInUp}`}>{label}</p>

                <header className={`${styles.header} ${styles.fadeInUp}`} style={{ animationDelay: "60ms" }}>
                    <h2 className={styles.h2}>{headline}</h2>
                    <p className={styles.subhead}>{subheadline}</p>
                </header>

                {/* Stepper */}
                <div className={`${styles.stepper} ${styles.fadeInUp}`} style={{ animationDelay: "120ms" }}>
                    <div className={styles.stepperTrack} aria-hidden="true">
                        <span
                            className={styles.stepperFill}
                            style={{ width: `${((safeIndex + 1) / phases.length) * 100}%` }}
                        />
                    </div>

                    <div className={styles.stepperRow}>
                        {phases.map((p, idx) => (
                            <button
                                key={p.key}
                                type="button"
                                className={`${styles.stepDot} ${idx <= safeIndex ? styles.stepDotActive : ""}`}
                                onClick={() => handleSelect(idx)}
                                aria-label={`Select ${p.title}`}
                            >
                                <span className={styles.stepDotInner}>{idx + 1}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Cards: grid on desktop, swipe carousel on mobile/tablet (CSS handles layout) */}
                <div
                    ref={carouselRef}
                    className={`${styles.phaseGrid} ${styles.fadeInUp}`}
                    style={{ animationDelay: "160ms" }}
                    role="tablist"
                    aria-label="Turnkey phases"
                >
                    {phases.map((p, idx) => {
                        const isActive = idx === safeIndex;

                        return (
                            <button
                                key={p.key}
                                ref={(el) => {
                                    cardRefs.current[idx] = el;
                                }}
                                type="button"
                                className={`${styles.phaseCard} ${isActive ? styles.phaseCardActive : ""}`}
                                onClick={() => handleSelect(idx)}
                                role="tab"
                                aria-selected={isActive}
                            >
                                <div className={styles.phaseTop}>
                                    <div className={styles.phaseTitleRow}>
                                        <span className={styles.timelineChip}>
                                            <Clock className={styles.chipIcon} aria-hidden="true" />
                                            {p.timeline}
                                        </span>
                                        <div className={styles.phaseTitle}>{p.title}</div>
                                    </div>
                                </div>

                                <ul className={styles.checkList}>
                                    {p.items.map((item) => (
                                        <li key={item} className={styles.checkItem}>
                                            <CheckCircle2 className={styles.checkIcon} aria-hidden="true" />
                                            <span className={styles.checkText}>{item}</span>
                                        </li>
                                    ))}
                                </ul>
                            </button>

                        );
                    })}
                </div>
            </div>
            <SoftCTA linkText="See what is included" href="/standard-inclusions" />
        </section>
    );
}
