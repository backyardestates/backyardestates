import { useContext } from 'react'
import { PreviewContext } from '@/components/InclusionsPanel'

import { useState } from 'react'
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

    let roomID = 0

    switch (value) {
        case 'kitchen':
            roomID = 0
            break
        case 'living':
            roomID = 1
            break
        case 'bedroom':
            roomID = 2
            break
        case 'bathroom':
            roomID = 3
            break
        case 'exterior':
            roomID = 4
            break
        case 'construction':
            roomID = 5
            break
        default:
            roomID = 0
            break
    }

    const updatePreview = (changes) => {
        setPreview({ ...preview, ...changes })
    }

    return (
        <div
            className={`${style.base} ${
                preview.room === value ? style.selected : ''
            }`}
            onMouseOver={() => handleMouseOver()}
            onMouseOut={() => handleMouseOut()}
            onClick={() => {
                updatePreview({
                    collectionID: preview.collectionID,
                    collection: preview.collection,
                    roomID: roomID,
                    room: value,
                })
            }}
        >
            {!showTooltip && <Tooltip show={show}>{tooltip}</Tooltip>}
            {children}
        </div>
    )
}
