'use client'

import React, { useEffect, useState } from 'react'
import style from './VideoPlayer.module.css'

import { WistiaProvider, WistiaPlayer } from '@wistia/react-embeds'

export default function VideoPlayer({ wistiaID }) {
    const [showComponent, setShowComponent] = useState(false)

    useEffect(() => {
        const timeout = setTimeout(() => {
            setShowComponent(true)
        }, 500)
        return () => clearTimeout(timeout)
    }, [])

    return (
        <div className={style.base}>
            {showComponent && (
                <WistiaProvider>
                    <WistiaPlayer hashedId={wistiaID} />
                </WistiaProvider>
            )}
        </div>
    )
}
