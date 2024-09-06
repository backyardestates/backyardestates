import Divider from '../Divider'

import style from './PropertyInformation.module.css'

export default function PropertyInformation({ floorplan, showPrice = false }) {
    // Format the price above to USD using the locale, style, and currency.
    let USDollar = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        maximumSignificantDigits: 3,
    })

    const bed = floorplan.bed
    const bath = floorplan.bath
    const sqft = floorplan.sqft
    const price = USDollar.format(floorplan.price)

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
