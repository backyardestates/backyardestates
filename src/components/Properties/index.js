import StandaloneLink from '@/components/StandaloneLink'
import style from './Properties.module.css'
import Property from '../Property'

export default function Properties({ data }) {
    // console.log(data)

    const filteredProperties = data.filter(
        (property) =>
            property.frontmatter.order !== 'A' &&
            property.frontmatter.order !== 'D'
    )

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
                    View all properties
                </StandaloneLink>
            </div>
        </div>
    )
}
