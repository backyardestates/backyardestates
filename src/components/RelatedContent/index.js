import StandaloneLink from '@/components/StandaloneLink'
import style from './RelatedContent.module.css'
import Property from '../Property'
import Card from '../Card'
import SectionTitle from '../SectionTitle'

export default function RelatedContent({ estates }) {
    // const properties = ['Estate 350', 'Estate 350', 'Estate 350', 'Estate 350']

    const filteredProperties = estates.filter(
        (property) =>
            property.frontmatter.order !== 'A' &&
            property.frontmatter.order !== 'D' &&
            property.frontmatter.order !== 'E' &&
            property.frontmatter.order !== 'F' &&
            property.frontmatter.order !== 'H'
    )

    filteredProperties.sort((a, b) => {
        const nameA = a.frontmatter.order
        const nameB = b.frontmatter.order
        if (nameA < nameB) {
            return -1
        }
        if (nameA > nameB) {
            return 1
        }
        return 0
    })

    return (
        <div className={style.base}>
            <SectionTitle
                title="Explore our properties"
                explanation="Sed tortor eu placerat porta sed nec fames volutpat.
                    Ultricies fermentum donec pulvinar a mollis. Pellentesque
                    eget non mattis sit massa eu a magna."
            />
            <div className={style.properties}>
                {filteredProperties.map((filteredProperty, index) => (
                    <Card key={index} estate={filteredProperty}></Card>
                ))}
            </div>
            <div className={style.centered}>
                <StandaloneLink href="/floor-plans">
                    View all floor plans
                </StandaloneLink>
            </div>
        </div>
    )
}
