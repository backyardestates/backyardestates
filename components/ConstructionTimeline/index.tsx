"use client";

import styles from "./ConstructionTimeline.module.css";
import Image from "next/image";
import { useRef, useEffect } from "react";

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
    const scrollRef = useRef<HTMLDivElement>(null);
    let isDown = false;
    let startX = 0;
    let scrollLeft = 0;

    useEffect(() => {
        const slider = scrollRef.current;
        if (!slider) return;

        // --- DRAG SCROLLING ---
        const mouseDown = (e: MouseEvent) => {
            isDown = true;
            startX = e.pageX - slider.offsetLeft;
            scrollLeft = slider.scrollLeft;
            slider.classList.add(styles.activeDragging);
        };

        const mouseLeave = () => {
            isDown = false;
            slider.classList.remove(styles.activeDragging);
        };

        const mouseUp = () => {
            isDown = false;
            slider.classList.remove(styles.activeDragging);
        };

        const mouseMove = (e: MouseEvent) => {
            if (!isDown) return;
            e.preventDefault();
            const x = e.pageX - slider.offsetLeft;
            const walk = (x - startX) * 1.2;
            slider.scrollLeft = scrollLeft - walk;
        };

        slider.addEventListener("mousedown", mouseDown);
        slider.addEventListener("mouseleave", mouseLeave);
        slider.addEventListener("mouseup", mouseUp);
        slider.addEventListener("mousemove", mouseMove);

        // --- WHEEL SCROLL (horizontal) ---
        const onWheel = (e: WheelEvent) => {
            if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
                slider.scrollLeft += e.deltaY * 1.1;
            }
        };

        slider.addEventListener("wheel", onWheel);

        return () => {
            slider.removeEventListener("mousedown", mouseDown);
            slider.removeEventListener("mouseleave", mouseLeave);
            slider.removeEventListener("mouseup", mouseUp);
            slider.removeEventListener("mousemove", mouseMove);
            slider.removeEventListener("wheel", onWheel);
        };
    }, []);

    if (!timeline || timeline.length === 0) return null;

    return (
        <section className={styles.section}>
            <div className={styles.inner}>
                <div className={styles.timelineWrapper} ref={scrollRef}>
                    {timeline.map((item, index) => {
                        const even = item.week % 2 === 0;

                        return (
                            <div
                                key={item.week}
                                className={`${styles.timelineItem} fadeInUp`}
                                style={{ animationDelay: `${index * 0.12}s` }}
                            >
                                {/* Floating luxury badge */}
                                <div
                                    className={`${styles.weekBadge} ${even ? styles.badgeBottom : styles.badgeTop
                                        }`}
                                >
                                    <div className={styles.badgeWeek}>Week {item.week}</div>
                                    <div className={styles.badgeTitle}>{item.milestone}</div>
                                </div>

                                <div className={styles.card}>
                                    {/* Image */}
                                    {item.weekImage?.secure_url && (
                                        <div className={styles.cardMedia}>
                                            <Image
                                                src={item.weekImage.secure_url}
                                                alt={item.milestone}
                                                width={600}
                                                height={450}
                                                className={styles.image}
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}
