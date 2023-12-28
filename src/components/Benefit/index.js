import { useState, useRef } from 'react'
import BenefitTag from '../BenefitTag'
import style from './Benefit.module.css'

// import { gsap } from 'gsap'
// import { Flip } from 'gsap/Flip'
// gsap.registerPlugin(Flip)

export default function Benefit({
    position,
    type = 'Process',
    subtle = false,
    title,
    children,
}) {
    let positionStyle = style.b0

    const inputRef = useRef()

    const [selected, setSelected] = useState(false)

    // returns a state object containing data about the elements' current position/size/rotation in the viewport
    // const start = Flip.getState(inputRef.current)

    switch (position) {
        case 0:
            if (selected) {
                positionStyle = style.b0_selected
            } else {
                positionStyle = style.b0
            }
            // type = 'Process'
            break
        case 1:
            if (selected) {
                positionStyle = style.b1_selected
            } else {
                positionStyle = style.b1
            }
            break
        case 2:
            if (selected) {
                positionStyle = style.b2_selected
            } else {
                positionStyle = style.b2
            }
            break
        case 3:
            if (selected) {
                positionStyle = style.b3_selected
            } else {
                positionStyle = style.b3
            }
            break
        case 4:
            if (selected) {
                positionStyle = style.b4_selected
            } else {
                positionStyle = style.b4
            }
            break

        default:
            positionStyle = style.b0
            type = 'Process'
    }

    // Flip.from(start, {
    //     duration: 1,
    //     ease: 'power1.inOut',
    //     absolute: true,
    // })

    return (
        <div
            ref={inputRef}
            className={`${
                subtle ? style.subtle : style.prominent
            } ${positionStyle}`}
            onClick={() => setSelected(!selected)}
            onMouseLeave={() => setSelected(false)}
        >
            <BenefitTag>{type}</BenefitTag>
            <p className={style.title}>{title}</p>
            <div className={selected ? style.content_show : style.content_hide}>
                {children}
            </div>
        </div>
    )
}
