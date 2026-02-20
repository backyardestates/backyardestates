// components/GetStartedOfficeVisitSection.tsx
"use client";

import React from "react";
import Link from "next/link";
import styles from "./OfficeVisitSection.module.css";
import { CalendarDays, CheckCircle2, MapPin, Sparkles } from "lucide-react";
import VideoPlayer from "../VideoPlayer";

type GetStartedOfficeVisitSectionProps = {
    label?: string;
    headline?: string;
    subheadline?: string;

    // Use ONE of these (prefer wistiaId if you use Wistia a lot)
    wistiaId?: string;
    videoSrc?: string; // mp4/webm url
    posterSrc?: string;

    ctaHref?: string;
    ctaText?: string;
    secondaryHref?: string;
    secondaryText?: string;
};

export default function OfficeVisitSection({
    label = "GET STARTED",
    headline = "Start with an Office Visit.",
    subheadline = "A guided, educational session where we pull up your property on the big screen and show you what’s possible — with clear options, smarter placement, and zero surprises.",
    wistiaId,

    ctaHref = "/talk-to-an-adu-specialist/office-consultation",
    ctaText = "Schedule an Office Visit",
    secondaryHref = "/standard-inclusions",
    secondaryText = "See what’s included",
}: GetStartedOfficeVisitSectionProps) {
    return (
        <section className={styles.section} aria-label="How to get started">
            <div className={styles.container}>
                <header className={styles.header}>
                    <p className={styles.label}>{label}</p>
                    <h2 className={styles.h2}>{headline}</h2>
                    <p className={styles.subhead}>{subheadline}</p>
                </header>

                <div className={styles.grid}>
                    <div className={styles.videoCard}>
                        <div className={styles.videoFrame}>

                            <VideoPlayer wistiaID={wistiaId} />
                        </div>
                    </div>

                    <div className={styles.copyCard}>
                        <ul className={styles.bullets}>
                            <li className={styles.bullet}>
                                <span className={styles.iconWrap} aria-hidden="true">
                                    <MapPin className={styles.icon} />
                                </span>
                                <div>
                                    <p className={styles.bulletTitle}>See exactly what’s possible on your lot</p>
                                    <p className={styles.bulletText}>
                                        We pull up your property and map out layout, placement, and realistic options.
                                    </p>
                                </div>
                            </li>

                            <li className={styles.bullet}>
                                <span className={styles.iconWrap} aria-hidden="true">
                                    <Sparkles className={styles.icon} />
                                </span>
                                <div>
                                    <p className={styles.bulletTitle}>Avoid costly mistakes early</p>
                                    <p className={styles.bulletText}>
                                        Small decisions in utilities and placement can save major time, money, and
                                        headaches.
                                    </p>
                                </div>
                            </li>

                            <li className={styles.bullet}>
                                <span className={styles.iconWrap} aria-hidden="true">
                                    <CheckCircle2 className={styles.icon} />
                                </span>
                                <div>
                                    <p className={styles.bulletTitle}>Clear scope, clear expectations</p>
                                    <p className={styles.bulletText}>
                                        We’ll show what’s included in our all-in approach — and what’s outside scope,
                                        so there are no surprises later.
                                    </p>
                                </div>
                            </li>
                        </ul>

                        <div className={styles.ctaRow}>
                            <Link href={ctaHref} className={styles.primaryCta}>
                                <CalendarDays className={styles.ctaIcon} aria-hidden="true" />
                                {ctaText}
                            </Link>

                            <Link href={secondaryHref} className={styles.secondaryCta}>
                                {secondaryText}
                            </Link>
                        </div>

                        <p className={styles.finePrint}>
                            Bring your address — we’ll do the rest.
                        </p>
                    </div>
                </div>
            </div>
        </section>
    );
}
