import Card from '../Card'
import SectionTitle from '../SectionTitle'
import StandaloneLink from '../StandaloneLink'

import style from './RelatedContent.module.css'

export default function RelatedContent({ properties }) {
    // const relatedProperties = await getProperties(properties)

    // console.log(properties)

    return (
        <div className={style.base}>
            <SectionTitle
                title="Explore properties we&rsquo;ve built"
                explanation=""
            />
            <div className={style.properties}>
                {properties.map((property, index) => (
                    // <p key={index}>{property.name}</p>
                    <Card key={index} property={property}></Card>
                ))}
            </div>
            <div className={style.centered}>
                <StandaloneLink href="/gallery">
                    View all projects
                </StandaloneLink>
            </div>
        </div>
    )
}
