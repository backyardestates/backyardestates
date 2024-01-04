import StandaloneLink from '@/components/StandaloneLink'
import style from './RelatedContent.module.css'
import Property from '../Property'
import Card from '../Card'
import SectionTitle from '../SectionTitle'

export default function RelatedContent({ properties }) {
    properties.sort((a, b) => {
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
                title="Explore properties we&rsquo;ve built"
                explanation=""
            />
            <div className={style.properties}>
                {properties.map((property, index) => (
                    <Card key={index} estate={property}></Card>
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
