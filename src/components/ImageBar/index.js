import { useState } from 'react'

import ImageBarButton from '@/components/ImageBarButton'
import style from './ImageBar.module.css'

export default function ImageBar() {
    const [room, setRoom] = useState('kitchen')

    function handleClick(rm) {
        setRoom(rm)
    }

    return (
        <ul className={style.base}>
            <li>
                <ImageBarButton
                    value="kitchen"
                    handler={handleClick}
                    room={room}
                    tooltip="Kitchen"
                />
            </li>
            <li>
                <ImageBarButton
                    value="bathroom"
                    handler={handleClick}
                    room={room}
                    tooltip="Bathroom"
                />
            </li>
            <li>
                <ImageBarButton
                    value="interior"
                    handler={handleClick}
                    room={room}
                    tooltip="Interior features"
                />
            </li>
            <li>
                <ImageBarButton
                    value="exterior"
                    handler={handleClick}
                    room={room}
                    tooltip="Exterior features"
                />
            </li>
            <li>
                <ImageBarButton
                    value="construction"
                    handler={handleClick}
                    room={room}
                    tooltip="Construction specifications"
                />
            </li>
        </ul>
    )
}
