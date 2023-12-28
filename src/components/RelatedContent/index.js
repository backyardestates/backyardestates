import StandaloneLink from '@/components/StandaloneLink'
import style from './RelatedContent.module.css'
import Property from '../Property'
import Card from '../Card'
import SectionTitle from '../SectionTitle'

export default function RelatedContent({ properties }) {
    return (
        <div className={style.base}>
            <SectionTitle
                title="Explore properties we&rsquo;ve built"
                explanation="Sed tortor eu placerat porta sed nec fames volutpat.
                    Ultricies fermentum donec pulvinar a mollis. Pellentesque
                    eget non mattis sit massa eu a magna."
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
