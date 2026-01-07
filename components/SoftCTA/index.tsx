import Link from "next/link"
import styles from "./SoftCTA.module.css"

interface SoftCTAProps {
    text?: string
    linkText: string
    href: string
    align?: "center" | "left"
}

export default function SoftCTA({
    text,
    linkText,
    href,
    align = "center",
}: SoftCTAProps) {
    return (
        <div
            className={`${styles.ctaSection} ${align === "left" ? styles.left : ""
                }`}
        >
            {
                text && <p className={styles.ctaText}>{text}</p>
            }
            <Link href={href} className={styles.inlineLink}>
                {linkText} →
            </Link>
        </div>
    )
}
