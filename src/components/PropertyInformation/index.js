import Divider from '@/components/Divider'

import style from './PropertyInformation.module.css'

export default function PropertyInformation({ floorplan, showPrice = false }) {
    const bed = floorplan.bed
    const bath = floorplan.bath
    const sqft = floorplan.sqft
    const price = floorplan.price

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
            {showPrice && (
                <li>
                    <Divider />
                </li>
            )}
            {showPrice && <li>{`$${price}`}</li>}
        </ul>
    )
}
