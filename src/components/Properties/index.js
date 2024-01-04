import StandaloneLink from '@/components/StandaloneLink'
import style from './Properties.module.css'
import Property from '../Property'

export default function Properties({ data }) {
    const filteredProperties = data.filter(
        (property) =>
            property.frontmatter.id === '1200-001' ||
            property.frontmatter.id === '800-001' ||
            property.frontmatter.id === '800-002' ||
            property.frontmatter.id === '950-001' ||
            property.frontmatter.id === '450-003' ||
            property.frontmatter.id === '450-005' ||
            property.frontmatter.id === '751-001'
    )

    filteredProperties.sort((b, a) => {
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
            <div className={style.properties}>
                {filteredProperties.map((estate, index) => (
                    <Property
                        key={index}
                        floorplan={estate}
                        img={estate.frontmatter.img}
                        title={estate.frontmatter.title}
                        bed={estate.frontmatter.bed}
                        bath={estate.frontmatter.bath}
                        sqft={estate.frontmatter.sqft}
                    />
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
