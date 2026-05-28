'use client'

import Link from 'next/link'
import { Monitor, MessageSquare, Sparkles } from 'lucide-react'

import VideoPlayer from '@/components/VideoPlayer'
import Button from '@/components/Button'

import styles from './OfficeVisitShowcase.module.css'

interface OfficeVisitShowcaseProps {
    floorplanName: string
    wistiaId?: string
    ctaHref?: string
    secondaryHref?: string
}

export default function OfficeVisitShowcase({
    floorplanName,
    wistiaId = 'zezemmgiam',
    ctaHref = '/talk-to-an-adu-specialist/office-consultation',
    secondaryHref = '/standard-inclusions',
}: OfficeVisitShowcaseProps) {
    const bullets = [
        {
            icon: Monitor,
            title: 'Your property on the big screen',
            text: `We pull your actual lot up in our software and explore it together — placement, setbacks, and exactly how the ${floorplanName} fits.`,
        },
        {
            icon: MessageSquare,
            title: 'A personalized consultation',
            text: 'A free, educational session. We answer your questions and find the smartest way to build for your goals and budget.',
        },
        {
            icon: Sparkles,
            title: 'Visualize the outcome before you commit',
            text: "Leave knowing what's possible, what it costs, and what to avoid.",
        },
    ]

    return (
        <section className={styles.wrapper}>
            <div className={`${styles.intro} ${styles.fadeInUp}`}>
                <span className={styles.eyebrow}>The office visit</span>
                <h2 className={styles.title}>
                    See the {floorplanName} on your property
                </h2>
                <p className={styles.lede}>
                    Our office visit is a free, personalized consultation. We pull
                    your lot up on the big screen and explore it with our software,
                    so you can picture exactly how the {floorplanName} fits before
                    you build.
                </p>
            </div>

            <div className={styles.grid}>
                <div className={styles.videoCard}>
                    <VideoPlayer wistiaID={wistiaId} />
                </div>

                <div className={styles.copyCard}>
                    <ul className={styles.bullets}>
                        {bullets.map((b) => {
                            const Icon = b.icon
                            return (
                                <li key={b.title} className={styles.bullet}>
                                    <span
                                        className={styles.iconWrap}
                                        aria-hidden="true"
                                    >
                                        <Icon className={styles.icon} />
                                    </span>
                                    <div>
                                        <p className={styles.bulletTitle}>
                                            {b.title}
                                        </p>
                                        <p className={styles.bulletText}>
                                            {b.text}
                                        </p>
                                    </div>
                                </li>
                            )
                        })}
                    </ul>

                    <div className={styles.actions}>
                        <Button isPrimary href={ctaHref}>
                            Schedule your office visit
                        </Button>
                    </div>
                </div>
            </div>
        </section>
    )
}
