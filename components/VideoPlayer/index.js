import { WistiaPlayer } from '@wistia/wistia-player-react'
import style from './VideoPlayer.module.css'

export default function VideoPlayer({ wistiaID }) {
    return (
        <div className={style.base}>
            <WistiaPlayer
                mediaId={wistiaID}
                playerColor="#405256"
                aspect={16 / 9}
            />
        </div>
    )
}
