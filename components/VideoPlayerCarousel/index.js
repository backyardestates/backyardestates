import { WistiaPlayer } from '@wistia/wistia-player-react'
import style from './VideoPlayerCarousel.module.css'

export default function VideoPlayerCarousel({ wistiaId, isActive }) {
    return (
        <div className={style.base}>
            {!isActive && <div className={style.blocker}></div>}
            <WistiaPlayer
                id={`video-player-${wistiaId}`}
                mediaId={wistiaId}
                playerColor="#405256"
                aspect={16 / 9}
                className={style.player}
            />
        </div>
    )
}
