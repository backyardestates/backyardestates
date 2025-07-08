import { useEffect, useRef, useState } from 'react'

import Divider from '@/components/Divider'

import { WistiaPlayer } from '@wistia/wistia-player-react'
import style from './VideoPlayerCarousel.module.css'

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faPlay, faPause } from '@fortawesome/pro-solid-svg-icons'

export default function VideoPlayerCarousel({
    story,
    wistiaId,
    isActive,
    setPlaying,
}) {
    const player = useRef(null)
    const [isPlaying, setIsPlaying] = useState(false)
    useEffect(() => {
        if (!isActive && player.current !== null) {
            player.current.pause()
            // player.current.currentTime = 0
            setIsPlaying(false)
            setPlaying(false)
        }
    }, [isActive])

    function handlePlay() {
        setIsPlaying(true)
        setPlaying(true)
        player.current.play()
    }
    function handlePause() {
        setIsPlaying(false)
        setPlaying(false)
        player.current.pause()
    }
    return (
        <div className={style.base}>
            {!isActive && <div className={style.blocker}></div>}
            <div className={style.estate}>{story.property.floorplan.name}</div>
            <WistiaPlayer
                ref={player}
                id={`video-player-${wistiaId}`}
                mediaId={wistiaId}
                playerColor="#405256"
                aspect={16 / 9}
                className={style.player}
                controlsVisibleOnLoad={false}
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
        </div>
    )
}
