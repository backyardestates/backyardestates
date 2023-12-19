import Divider from '@/components/Divider'

import style from './PropertyInformation.module.css'

export default function PropertyInformation({ floorplan }) {
    const bed = floorplan.frontmatter.bed
    const bath = floorplan.frontmatter.bath
    const sqft = floorplan.frontmatter.sqft

    return (
        <ul className={style.base}>
            <li>{bed === 'Studio' ? `${bed}` : `${bed} Bed`}</li>
            <li>
                <Divider />
            </li>
            <li>{`${bath} Bath`}</li>
            <li>
                <Divider />
            </li>
            <li>{`${sqft} sq. ft.`}</li>
        </ul>
    )
}
