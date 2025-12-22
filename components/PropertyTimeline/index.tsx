"use client";
import { useCountUp } from "@/hooks/countUp";
import { useRef, useState, useEffect } from "react";

import styles from "./PropertyTimeline.module.css";
import { PencilLine, FileCheck2, BrickWall } from "lucide-react";

interface TimelineItemProps {
    icon: React.ElementType
    label: string
    value: number
    visible: boolean
    delay: number
}

function TimelineItem({ icon: Icon, label, value, visible, delay }: TimelineItemProps) {
    const animatedValue = useCountUp(value, visible, delay)

    return (
        <div className={`${styles.item} fadeInUp`} style={{ animationDelay: `${delay / 1000}s` }}>
            <Icon className={styles.icon} />
            <p className={styles.value}>{animatedValue} weeks</p>
            <span className={styles.caption}>{label}</span>
        </div>
    )
}

interface PropertyTimeline {
    planning: number;
    permitting: number;
    construction: number;
}

export default function PropertyTimeline({ planning, permitting, construction }: PropertyTimeline) {
    const items = [
        { icon: PencilLine, label: "Planning", value: planning },
        { icon: FileCheck2, label: "Permitting", value: permitting },
        { icon: BrickWall, label: "Construction", value: construction },
    ];
    const sectionRef = useRef<HTMLDivElement>(null);
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const observer = new IntersectionObserver(
            entries => {
                if (entries[0].isIntersecting) {
                    setVisible(true); // trigger once
                    observer.disconnect(); // stop observing
                }
            },
            { threshold: 0.3 } // triggers when ~30% of section is visible
        );

        if (sectionRef.current) observer.observe(sectionRef.current);

        return () => observer.disconnect();
    }, []);

    return (
        <section ref={sectionRef} className={styles.section}>
            <div className={styles.inner}>
                <h2 className={styles.label}>Project Timeline Overview</h2>

                <div className={styles.timelineGrid}>
                    {items.map((item, i) => (
                        <TimelineItem
                            key={item.label}
                            icon={item.icon}
                            label={item.label}
                            value={item.value}
                            visible={visible}
                            delay={800 + i * 180}
                        />
                    ))}
                </div>
            </div>
        </section>
    )
}
