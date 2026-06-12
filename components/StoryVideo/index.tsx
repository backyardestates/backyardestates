'use client'

import { WistiaPlayer } from '@wistia/wistia-player-react'
import style from './StoryVideo.module.css'

/**
 * Responsive 16:9 Wistia embed that always fills its container (unlike the
 * legacy VideoPlayer, which caps at 640px on wide screens and clips).
 */
export default function StoryVideo({ id }: { id: string }) {
    return (
        <div className={style.frame}>
            <WistiaPlayer
                mediaId={id}
                playerColor="#36484b"
                aspect={16 / 9}
            />
        </div>
    )
}
