import { useEffect, useRef } from 'react'

import Divider from '@/components/Divider'

import { WistiaPlayer } from '@wistia/wistia-player-react'
import style from './VideoPlayerCarousel.module.css'

export default function VideoPlayerCarousel({ story, wistiaId, isActive }) {
    const player = useRef(null)
    console.log(story)
    useEffect(() => {
        // This code runs every time isActive changes
        console.log('player.current:', player.current)
        // You can perform any action here
        if (!isActive && player.current !== null) {
            player.current.pause()
        }
    }, [isActive])
    return (
        <div className={style.base}>
            {!isActive && <div className={style.blocker}></div>}
            <div className={style.topBar}>Plan</div>
            <WistiaPlayer
                ref={player}
                id={`video-player-${wistiaId}`}
                mediaId={wistiaId}
                playerColor="#405256"
                aspect={16 / 9}
                className={style.player}
                controlsVisibleOnLoad={false}
            />
            <div className={style.bottomBar}>
                <button onClick={() => player.current.play()}>Play</button>
                <button onClick={() => player.current.pause()}>Pause</button>
                <ul className={style.infoBase}>
                    <li>
                        {story.property.bed === 'Studio'
                            ? `${story.property.bed}`
                            : `${story.property.bed} Bed`}
                    </li>
                    <li>
                        <Divider />
                    </li>
                    <li>{`${story.property.bath} Bath`}</li>
                    <li>
                        <Divider />
                    </li>
                    <li>{`${story.property.sqft} sq. ft.`}</li>
                </ul>
            </div>
        </div>
    )
}
