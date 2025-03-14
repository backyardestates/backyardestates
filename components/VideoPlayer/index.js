// 'use client'

// import React, { useEffect, useState } from 'react'
import style from './VideoPlayer.module.css'

// import { WistiaProvider, WistiaPlayer } from '@wistia/react-embeds'

import { WistiaPlayer } from '@wistia/wistia-player-react'

export default function VideoPlayer({ wistiaID }) {
    // const [showComponent, setShowComponent] = useState(false)
    // console.log('Wistia ID:', typeof wistiaID)

    // useEffect(() => {
    //     const timeout = setTimeout(() => {
    //         setShowComponent(true)
    //         console.log('Wistia component mounted')
    //         console.log('Bang')
    //     }, 500)
    //     return () => clearTimeout(timeout)
    // }, [])

    return (
        <div className={style.base}>
            {/* <WistiaProvider> */}
            <WistiaPlayer
                mediaId={wistiaID}
                playerColor="#405256"
                aspect={16 / 9}
            />
            {/* </WistiaProvider> */}
        </div>
    )
}
