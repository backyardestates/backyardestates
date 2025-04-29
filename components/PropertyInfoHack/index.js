import Divider from '../Divider'

import style from './PropertyInformation.module.css'

import { USDollar } from '@/utils/currency'

export default function PropertyInfoHack({ property, showPrice = false }) {
    const bed = property.bed
    const bath = property.bath
    const sqft = property.sqft
    const price = USDollar.format(property.price)

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
