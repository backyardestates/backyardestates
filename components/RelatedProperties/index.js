import PropertyCard from "../PropertyCard"
import StandaloneLink from "../StandaloneLink"
import styles from "./RelatedProperties.module.css"

export default function RelatedProperties({ properties }) {
    if (!properties?.length) return null

    return (
        <section className={styles.section}>
            {/* Header */}
            <div className={styles.header}>
                <h2 className={styles.title}>
                    Projects with a similar approach
                </h2>
                <p className={styles.subtitle}>
                    A selection of ADUs shaped by thoughtful planning, refined details,
                    and spaces designed to live well.
                </p>
            </div>

            {/* Cards */}
            <div className={styles.scroller}>
                {properties.map((property) => (
                    <PropertyCard
                        key={property._id}
                        content={property}
                        variant="compact"
                    />
                ))}
            </div>

            {/* Footer CTA */}
            {/* <div className={styles.footer}>
                <StandaloneLink href="/properties">
                    View all properties
                </StandaloneLink>
            </div> */}
        </section>
    )
}
