"use client";

import styles from "./ConstructionTimeline.module.css";
import Image from "next/image";
import { useRef, useEffect, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import GalleryModal from "../GalleryModal";
import Link from "next/link";
import SoftCTA from "../SoftCTA";

gsap.registerPlugin(ScrollTrigger);

interface TimelineItem {
    milestone: string;
    week: number;
    weekImage: {
        secure_url: string;
    };
}

interface Props {
    timeline: TimelineItem[];
}

export default function ConstructionTimeline({ timeline }: Props) {
    const wrapperRef = useRef<HTMLDivElement>(null);
    const trackRef = useRef<HTMLDivElement>(null);
    const progressRef = useRef<HTMLDivElement>(null);

    const [activeWeek, setActiveWeek] = useState(1);

    // GALLERY ITEMS — Used by the modal
    const galleryItems = timeline.map((item) => ({
        type: "image" as const,
        url: item.weekImage.secure_url,
        alt: item.milestone,
    }));
    const [showGalleryModal, setShowGalleryModal] = useState(false);
    const [galleryIndex, setGalleryIndex] = useState(0);
    // -------------------------------------------------------------------
    // PROGRESS BAR — BASED ON HORIZONTAL SCROLL POSITION
    // -------------------------------------------------------------------
    useEffect(() => {
        const wrapper = wrapperRef.current;
        const progressEl = progressRef.current;

        if (!wrapper || !progressEl) return;

        let frameId: number;
        let currentProgress = 0;
        const lerpFactor = 0.12;

        const updateProgress = () => {
            const maxScrollLeft = wrapper.scrollWidth - wrapper.clientWidth;
            const raw =
                maxScrollLeft > 0 ? wrapper.scrollLeft / maxScrollLeft : 0;

            currentProgress += (raw - currentProgress) * lerpFactor;

            progressEl.style.transform = `scaleX(${currentProgress})`;

            frameId = requestAnimationFrame(updateProgress);
        };

        frameId = requestAnimationFrame(updateProgress);

        return () => cancelAnimationFrame(frameId);
    }, []);

    // -------------------------------------------------------------------
    // INTERSECTION OBSERVER — fade + activate week
    // -------------------------------------------------------------------
    useEffect(() => {
        const items = Array.from(
            document.querySelectorAll<HTMLElement>(`.${styles.timelineItem}`)
        );
        if (!items.length) return;

        const observer = new IntersectionObserver(
            entries => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add(styles.revealed);

                        const week = Number(
                            (entry.target as HTMLElement).dataset.week
                        );
                        if (!isNaN(week)) setActiveWeek(week);
                    }
                });
            },
            { threshold: 0.05 }
        );

        items.forEach(item => observer.observe(item));
        return () => observer.disconnect();
    }, []);

    // -----------------------------------------------------
    // Smooth Snap-to-Week Navigation
    // -----------------------------------------------------
    const handleJump = (week: number) => {
        const el = document.getElementById(`week-${week}`);
        if (!el) return;

        el.scrollIntoView({ behavior: "smooth", inline: "center" });
    };

    if (!timeline.length) return null;

    return (
        <section className={styles.section}>
            <div className={styles.inner}>

                {/* Progress Bar */}
                <div className={styles.progressBarContainer}>
                    <div ref={progressRef} className={styles.progressBar} />
                </div>

                {/* Horizontal Scroll Container */}
                <div className={styles.timelineWrapperOuter} ref={wrapperRef}>
                    <div className={styles.timelineWrapper} ref={trackRef}>
                        {timeline.map(item => (
                            <div
                                key={item.week}
                                id={`week-${item.week}`}
                                data-week={item.week}
                                className={`${styles.timelineItem} ${styles.slideRight}`}
                            >
                                {/* Badge */}
                                <div className={`${styles.weekBadge} ${styles.badgeTop}`}>
                                    <div className={styles.badgeWeek}>Week {item.week}</div>
                                    <div className={styles.badgeTitle}>{item.milestone}</div>
                                </div>

                                {/* Card */}
                                <div className={styles.card}>
                                    <div className={styles.cardMedia}>
                                        <Image
                                            src={item.weekImage.secure_url}
                                            alt={item.milestone}
                                            width={600}
                                            height={450}
                                            className={styles.image}
                                            onClick={() => {
                                                const index = timeline.findIndex(i => i.week === item.week);
                                                setGalleryIndex(index);
                                                setShowGalleryModal(true);
                                            }}
                                        />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

            </div>
            <SoftCTA
                text="Big projects feel easier when you know what&rsquo;s ahead."
                linkText="Explore our ADU process"
                href="/about-us/our-process"
                align="center"
            />
            {showGalleryModal && (
                <GalleryModal
                    items={galleryItems}
                    index={galleryIndex}
                    setIndex={setGalleryIndex}
                    onClose={() => setShowGalleryModal(false)}
                />
            )}
        </section>
    );
}
