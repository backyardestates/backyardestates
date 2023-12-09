import BenefitTag from '../BenefitTag'
import style from './Benefit.module.css'

export default function Benefit({
    position,
    type = 'Process',
    subtle = false,
    children,
}) {
    let positionStyle = style.b0

    switch (position) {
        case 0:
            positionStyle = style.b0
            // type = 'Process'
            break
        case 1:
            positionStyle = style.b1
            // type = 'Process'
            break
        case 2:
            positionStyle = style.b2
            // type = 'Process'
            break
        case 3:
            positionStyle = style.b3
            // type = 'Process'
            break
        case 4:
            positionStyle = style.b4
            // type = 'Process'
            break

        default:
            positionStyle = style.b0
            type = 'Process'
    }

    return (
        <div
            className={`${
                subtle ? style.subtle : style.prominent
            } ${positionStyle}`}
        >
            <BenefitTag>{type}</BenefitTag>
            <p>{children}</p>
        </div>
    )
}
