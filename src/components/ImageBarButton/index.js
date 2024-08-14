import { useContext } from 'react'
import { PreviewContext } from '@/panels/InclusionsPanel'

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
    children,
}) {
    const [show, setShow] = useState(false)

    function handleMouseOver() {
        setShow(true)
    }

    function handleMouseOut() {
        setShow(false)
    }

    const { preview, setPreview } = useContext(PreviewContext)

    return (
        <div
            className={`${style.base} ${
                preview.room === value ? style.selected : ''
            }`}
            onMouseOver={() => handleMouseOver()}
            onMouseOut={() => handleMouseOut()}
            onClick={() => {
                setPreview({ collection: preview.collection, room: value })
            }}
        >
            {!showTooltip && <Tooltip show={show}>{tooltip}</Tooltip>}
            {children}
        </div>
    )
}
