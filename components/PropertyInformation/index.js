import Divider from '../Divider'

import style from './PropertyInformation.module.css'

import { USDollar } from '@/utils/currency'

export default function PropertyInformation({ property, showPrice = false }) {
    const bed = property.floorplan.bed
    const bath = property.floorplan.bath
    const sqft = property.sqft
    const price = USDollar.format(property.floorplan.price)

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
            {showPrice && <li>{`${price}`}</li>}
        </ul>
    )
}
