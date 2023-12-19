import StandaloneLink from '@/components/StandaloneLink'
import style from './Properties.module.css'
import Property from '../Property'

export default function Properties({ data }) {
    return (
        <div className={style.base}>
            <div className={style.properties}>
                {data.map((estate, index) => (
                    <Property
                        key={index}
                        floorplan={estate.frontmatter}
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
