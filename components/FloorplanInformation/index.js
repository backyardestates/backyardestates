import Divider from '@/components/Divider'

import style from './FloorplanInformation.module.css'

import { USDollar } from '@/utils/currency'

export default function FloorplanInformation({
    bed,
    bath,
    sqft,
    price = 0,
    showPrice = false,
}) {
    const priceFormatted = USDollar.format(price)

    return (
        <ul className={style.base}>
            <li>{bed === 0 ? `Studio` : `${bed} Bed`}</li>
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
            {showPrice && <li>{`${priceFormatted}`}</li>}
        </ul>
    )
}
