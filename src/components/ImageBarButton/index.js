import { useState } from 'react'
import Image from 'next/image'
import Tooltip from '../Tooltip'

import style from './ImageBarButton.module.css'

export default function ImageBarButton({
    value,
    room,
    handler,
    showTooltip,
    tooltip,
}) {
    const [show, setShow] = useState(false)

    function handleMouseOver() {
        setShow(true)
    }

    function handleMouseOut() {
        setShow(false)
    }

    return (
        <div
            className={`${style.base} ${room === value ? style.selected : ''}`}
            onClick={() => handler(value)}
            onMouseOver={() => handleMouseOver()}
            onMouseOut={() => handleMouseOut()}
        >
            {!showTooltip && <Tooltip show={show}>{tooltip}</Tooltip>}
            <Image
                src="/images/preview/preview-FPO.png"
                alt="Picture of the author"
                width={100}
                height={100}
                className={style.image}
            />
        </div>
    )
}
