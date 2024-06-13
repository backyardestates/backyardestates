import { useState, useEffect } from 'react'

import ImageBarButton from '@/components/ImageBarButton'
import style from './ImageBar.module.css'

export default function ImageBar() {
    const size = useWindowSize()

    const [room, setRoom] = useState('kitchen')
    const [showTooltip, setShowTooltip] = useState(true)

    function handleClick(rm) {
        setRoom(rm)
    }

    function useWindowSize() {
        // Initialize state with undefined width/height so server and client renders match
        // Learn more here: https://joshwcomeau.com/react/the-perils-of-rehydration/
        const [windowSize, setWindowSize] = useState({
            width: undefined,
            height: undefined,
        })

        useEffect(() => {
            // only execute all the code below in client side
            // Handler to call on window resize
            function handleResize() {
                // Set window width/height to state
                setWindowSize({
                    width: window.innerWidth,
                    height: window.innerHeight,
                })

                const isMobile = window.innerWidth < 1440
                setShowTooltip(isMobile)
                console.log(isMobile)
            }

            // Add event listener
            window.addEventListener('resize', handleResize)

            // Call handler right away so state gets updated with initial window size
            handleResize()

            // Remove event listener on cleanup
            return () => window.removeEventListener('resize', handleResize)
        }, []) // Empty array ensures that effect is only run on mount
        return windowSize
    }

    return (
        <ul className={style.base}>
            <li>
                <ImageBarButton
                    value="kitchen"
                    showTooltip={showTooltip}
                    tooltip="Kitchen"
                />
            </li>
            <li>
                <ImageBarButton
                    value="bathroom"
                    showTooltip={showTooltip}
                    tooltip="Bathroom"
                />
            </li>
            <li>
                <ImageBarButton
                    value="interior"
                    showTooltip={showTooltip}
                    tooltip="Interior features"
                />
            </li>
            <li>
                <ImageBarButton
                    value="exterior"
                    showTooltip={showTooltip}
                    tooltip="Exterior features"
                />
            </li>
            <li>
                <ImageBarButton
                    value="construction"
                    showTooltip={showTooltip}
                    tooltip="Construction specifications"
                />
            </li>
        </ul>
    )
}
