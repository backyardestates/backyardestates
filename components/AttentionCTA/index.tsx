import Link from "next/link"
import styles from "./AttentionCTA.module.css"
import Button from "../Button"

interface AttentionCTAProps {
    eyebrow?: string
    title: string
    description: string
    primaryLabel: string
    primaryHref: string
    secondaryText?: string
    secondaryHref?: string
}

export default function AttentionCTA({
    eyebrow,
    title,
    description,
    primaryLabel,
    primaryHref,
    secondaryText,
    secondaryHref,
}: AttentionCTAProps) {
    return (
        <section className={styles.wrapper}>
            <div className={styles.inner}>
                {eyebrow && <span className={styles.eyebrow}>{eyebrow}</span>}

                <h2 className={styles.title}>{title}</h2>

                <p className={styles.description}>{description}</p>

                <div className={styles.actions}>
                    <Button isPrimary href={primaryHref}>
                        {primaryLabel}
                    </Button>

                    {secondaryText && secondaryHref && (
                        <Link href={secondaryHref} className={styles.secondaryLink}>
                            {secondaryText} →
                        </Link>
                    )}
                </div>
            </div>
        </section>
    )
}
