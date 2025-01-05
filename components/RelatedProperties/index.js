import PropertyCard from '../PropertyCard'
import SectionTitle from '../SectionTitle'
import StandaloneLink from '../StandaloneLink'

import style from './RelatedProperties.module.css'

export default function RelatedProperties({ properties }) {
    // const relatedProperties = await getProperties(properties)

    //console.log(properties)

    return (
        <div className={style.base}>
            <SectionTitle
                title="Explore properties we&rsquo;ve built"
                explanation=""
            />
            <div className={style.properties}>
                {properties.map((property, index) => (
                    // <p key={index}>{property.name}</p>
                    <PropertyCard key={index} content={property} />
                ))}
            </div>
            <div className={style.centered}>
                <StandaloneLink href="/properties">View all</StandaloneLink>
            </div>
        </div>
    )
}
