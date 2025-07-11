import { useEffect, useRef, useState } from 'react'

import Divider from '@/components/Divider'

import { WistiaPlayer } from '@wistia/wistia-player-react'
import style from './VideoPlayerCarousel.module.css'

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faPlay, faPause } from '@fortawesome/pro-solid-svg-icons'

export default function VideoPlayerCarousel({ story, wistiaId, isActive }) {
    const player = useRef(null)
    const [isPlaying, setIsPlaying] = useState(false)
    const [showInformation, setShowInformation] = useState(true)

    if (isActive && !isPlaying && player.current !== null) {
        player.current.bigPlayButton = true
    }

    useEffect(() => {
        if (isActive && player.current !== null) {
            player.current.bigPlayButton = true
        } else if (!isActive && player.current !== null) {
            player.current.bigPlayButton = false
            player.current.pause()
        }
    }, [isActive, showInformation])

    function handlePlay() {
        setIsPlaying(true)
        player.current.play()
        setShowInformation(false)
    }

    function handlePause() {
        setIsPlaying(false)
        player.current.pause()
        setShowInformation(true)
    }

    return (
        <div className={style.base}>
            {!isActive && <div className={style.blocker}></div>}
            {showInformation && (
                <div className={style.names}>{`${story.names}`}</div>
            )}
            {showInformation && (
                <div className={style.estate}>
                    {story.property.floorplan.name}
                </div>
            )}
            <WistiaPlayer
                ref={player}
                id={`video-player-${wistiaId}`}
                mediaId={wistiaId}
                playerColor="#1da4ba"
                aspect={16 / 9}
                className={style.player}
                onPlay={handlePlay}
                onPause={handlePause}
            />
            {isActive && (
                <div className={style.buttons}>
                    {!isPlaying && (
                        <button onClick={handlePlay} className={style.btn}>
                            <FontAwesomeIcon icon={faPlay} size="lg" />
                        </button>
                    )}
                    {isPlaying && (
                        <button onClick={handlePause} className={style.btn}>
                            <FontAwesomeIcon icon={faPause} size="lg" />
                        </button>
                    )}
                </div>
            )}

            {showInformation && (
                <ul className={style.infoBase}>
                    <li>
                        {story.property.bed === 'Studio'
                            ? `${story.property.bed}`
                            : `${story.property.bed} Bed`}
                    </li>
                    <li>
                        <Divider size="short" />
                    </li>
                    <li>{`${story.property.bath} Bath`}</li>
                    <li>
                        <Divider size="short" />
                    </li>
                    <li>{`${story.property.sqft} sq. ft.`}</li>
                </ul>
            )}
        </div>
    )
}
