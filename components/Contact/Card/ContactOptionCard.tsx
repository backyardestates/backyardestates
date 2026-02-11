import Link from "next/link"
import styles from "@/components/Contact/Card/ContactOptionCard.module.css"

export function ContactOptionCard({
    title,
    description,
    href,
    cta,
}: {
    title: string
    description: string
    href: string
    cta: string
}) {
    return (
        <Link className={styles.card} href={href}>
            <div className={styles.cardTitle}>{title}</div>
            <div className={styles.cardDesc}>{description}</div>
            <div className={styles.cardCta}>{cta}</div>
        </Link>
    )
}
