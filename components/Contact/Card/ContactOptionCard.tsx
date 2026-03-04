import Link from "next/link"
import styles from "@/components/Contact/Card/ContactOptionCard.module.css"
import type { LucideIcon } from "lucide-react"
export function ContactOptionCard({
    Logo,
    title,
    description,
    href,
    cta,
}: {
    Logo: LucideIcon
    title: string
    description: string
    href: string
    cta: string
}) {
    return (
        <Link className={styles.card} href={href}>
            <div className={styles.cardTitle}>
                <Logo className={styles.cardLogo} />
                <h3 className={styles.cardTitleText}>
                    {title}
                </h3>
            </div>
            <div className={styles.cardDesc}>{description}</div>
            <div className={styles.cardCta}>{cta}</div>
        </Link>
    )
}
