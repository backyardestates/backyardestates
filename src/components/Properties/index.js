import StandaloneLink from '@/components/StandaloneLink'
import style from './Properties.module.css'
import Property from '../Property'

export default function Properties({ data }) {
    const filteredProperties = data.filter(
        (property) =>
            property.frontmatter.id === '400-000' ||
            property.frontmatter.id === '450-000' ||
            property.frontmatter.id === '750-001' ||
            property.frontmatter.id === '751-000' ||
            property.frontmatter.id === '800-001' ||
            property.frontmatter.id === '950-000' ||
            property.frontmatter.id === '1200-000'
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
                <StandaloneLink href="/gallery">
                    View all projects
                </StandaloneLink>
            </div>
        </div>
    )
}
