import StandaloneLink from '../StandaloneLink'
import style from './RelatedContent.module.css'
import Property from '../Property'
import Card from '../Card'
import SectionTitle from '../SectionTitle'

import db from '@/utils/db'

const getProperties = async (related) => {
    // console.log(related)
    const properties = await db.floorplan.findMany({
        where: {
            id: {
                in: related,
            },
        },
    })
    return properties
}

export default async function RelatedContent({ properties }) {
    const relatedProperties = await getProperties(properties)

    // console.log(relatedProperties)

    return (
        <div className={style.base}>
            <SectionTitle
                title="Explore properties we&rsquo;ve built"
                explanation=""
            />
            <div className={style.properties}>
                {relatedProperties.map((property, index) => (
                    <Card key={index} estate={property}></Card>
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
