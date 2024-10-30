import { useState, useEffect } from 'react'

import ImageBarButton from '@/components/ImageBarButton'
import style from './ImageBar.module.css'

export default function ImageBar() {
    const size = useWindowSize()

    // const [room, setRoom] = useState('kitchen')
    const [showTooltip, setShowTooltip] = useState(true)

    // function handleClick(rm) {
    //     setRoom(rm)
    // }

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
                // console.log(isMobile)
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
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        height="28"
                        viewBox="0 0 576 512"
                    >
                        <path d="M144 256a112 112 0 1 0 0-224 112 112 0 1 0 0 224zm143.1-96c-8 72-69 128-143.1 128C64.5 288 0 223.5 0 144S64.5 0 144 0c74.1 0 135.2 56 143.1 128l67.6 0c6.6-18.6 24.4-32 45.3-32l96 0c26.5 0 48 21.5 48 48s-21.5 48-48 48l-96 0c-20.9 0-38.7-13.4-45.3-32l-67.6 0zM272 320l16 0 32 0 0-32c0-17.7 14.3-32 32-32l96 0c17.7 0 32 14.3 32 32l0 32 32 0 16 0c8.8 0 16 7.2 16 16s-7.2 16-16 16l-16 0 0 112c0 26.5-21.5 48-48 48l-128 0c-26.5 0-48-21.5-48-48l0-112-16 0c-8.8 0-16-7.2-16-16s7.2-16 16-16zm80 0l96 0 0-32-96 0 0 32zm-32 32l0 112c0 8.8 7.2 16 16 16l128 0c8.8 0 16-7.2 16-16l0-112-160 0zM496 128l-96 0c-8.8 0-16 7.2-16 16s7.2 16 16 16l96 0c8.8 0 16-7.2 16-16s-7.2-16-16-16zM192 144a48 48 0 1 0 -96 0 48 48 0 1 0 96 0zM64 144a80 80 0 1 1 160 0A80 80 0 1 1 64 144zM0 496c0-8.8 7.2-16 16-16l192 0c8.8 0 16 7.2 16 16s-7.2 16-16 16L16 512c-8.8 0-16-7.2-16-16zM160 352l0 32 16 0c8.8 0 16-7.2 16-16s-7.2-16-16-16l-16 0zm0-32l16 0c26.5 0 48 21.5 48 48s-21.5 48-48 48l-16 0c0 17.7-14.3 32-32 32l-64 0c-17.7 0-32-14.3-32-32l0-80c0-8.8 7.2-16 16-16l80 0 16 0 16 0zm-32 64l0-32-64 0 0 64 64 0 0-32z" />
                    </svg>
                </ImageBarButton>
            </li>
            <li>
                <ImageBarButton
                    value="living"
                    showTooltip={showTooltip}
                    tooltip="Living room"
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        height="28"
                        viewBox="0 0 640 512"
                    >
                        <path d="M448 64c53 0 96 43 96 96l0 37.5c10-3.5 20.8-5.5 32-5.5l0-32c0-70.7-57.3-128-128-128L192 32C121.3 32 64 89.3 64 160l0 32c11.2 0 22 1.9 32 5.5L96 160c0-53 43-96 96-96l256 0zM96 320l0 96 0 16c0 8.8-7.2 16-16 16l-32 0c-8.8 0-16-7.2-16-16l0-144c0-17.7 14.3-32 32-32s32 14.3 32 32l0 32zM80 480c20.9 0 38.7-13.4 45.3-32l389.5 0c6.6 18.6 24.4 32 45.3 32l32 0c26.5 0 48-21.5 48-48l0-144c0-35.3-28.7-64-64-64s-64 28.7-64 64l-384 0c0-35.3-28.7-64-64-64s-64 28.7-64 64L0 432c0 26.5 21.5 48 48 48l32 0zm48-64l0-96 384 0 0 96-384 0zm416 16l0-16 0-96 0-32c0-17.7 14.3-32 32-32s32 14.3 32 32l0 144c0 8.8-7.2 16-16 16l-32 0c-8.8 0-16-7.2-16-16z" />
                    </svg>
                </ImageBarButton>
            </li>
            <li>
                <ImageBarButton
                    value="bedroom"
                    showTooltip={showTooltip}
                    tooltip="Bedroom"
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        height="28"
                        viewBox="0 0 512 512"
                    >
                        <path d="M64 96l0 40.6c9.4-5.4 20.3-8.6 32-8.6l112 0c19.1 0 36.3 8.4 48 21.7c11.7-13.3 28.9-21.7 48-21.7l112 0c11.7 0 22.6 3.1 32 8.6L448 96c0-17.7-14.3-32-32-32L96 64C78.3 64 64 78.3 64 96zm416 96l0 48c19.4 14.6 32 37.8 32 64l0 96 0 64c0 8.8-7.2 16-16 16s-16-7.2-16-16l0-48L32 416l0 48c0 8.8-7.2 16-16 16s-16-7.2-16-16l0-64 0-96c0-26.2 12.6-49.4 32-64l0-48 0-96c0-35.3 28.7-64 64-64l320 0c35.3 0 64 28.7 64 64l0 96zm-32 33.6l0-33.6c0-17.7-14.3-32-32-32l-112 0c-17.7 0-32 14.3-32 32l0 32 160 0c5.5 0 10.8 .6 16 1.6zM240 224l0-32c0-17.7-14.3-32-32-32L96 160c-17.7 0-32 14.3-32 32l0 33.6c5.2-1 10.5-1.6 16-1.6l160 0zm240 80c0-26.5-21.5-48-48-48L80 256c-26.5 0-48 21.5-48 48l0 80 448 0 0-80z" />
                    </svg>
                </ImageBarButton>
            </li>
            <li>
                <ImageBarButton
                    value="bathroom"
                    showTooltip={showTooltip}
                    tooltip="Bathroom"
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        height="28"
                        viewBox="0 0 512 512"
                    >
                        <path d="M93.3 32C77.1 32 64 45.1 64 61.3L64 256l384 0 32 0 16 0c8.8 0 16 7.2 16 16s-7.2 16-16 16l-16 0-32 0L64 288l-32 0-16 0c-8.8 0-16-7.2-16-16s7.2-16 16-16l16 0L32 61.3C32 27.4 59.4 0 93.3 0c16.2 0 31.8 6.5 43.3 17.9L161.7 43c11.1-7 24.2-11 38.3-11c20.2 0 38.5 8.3 51.6 21.8l1.1-1.1c6.2-6.2 16.4-6.2 22.6 0s6.2 16.4 0 22.6l-104 104c-6.2 6.2-16.4 6.2-22.6 0s-6.2-16.4 0-22.6l1.1-1.1C136.3 142.5 128 124.2 128 104c0-14.1 4-27.2 11-38.3L113.9 40.6C108.5 35.1 101 32 93.3 32zM32 320l32 0 0 48c0 26.2 12.6 49.4 32 64c0 0 0 0 0 0s0 0 0 0c13.4 10 30 16 48 16l224 0c18 0 34.6-6 48-16c0 0 0 0 0 0s0 0 0 0c19.4-14.6 32-37.8 32-64l0-48 32 0 0 48c0 30.5-12.2 58.2-32 78.4l0 49.6c0 8.8-7.2 16-16 16s-16-7.2-16-16l0-26.8c-14.5 6.9-30.8 10.8-48 10.8l-224 0c-17.2 0-33.5-3.9-48-10.8L96 496c0 8.8-7.2 16-16 16s-16-7.2-16-16l0-49.6C44.2 426.2 32 398.5 32 368l0-48zM200 64c-22.1 0-40 17.9-40 40c0 11.4 4.8 21.7 12.4 29L229 76.4C221.7 68.8 211.4 64 200 64z" />
                    </svg>
                </ImageBarButton>
            </li>
            <li>
                <ImageBarButton
                    value="exterior"
                    showTooltip={showTooltip}
                    tooltip="Exterior features"
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        height="28"
                        viewBox="0 0 640 512"
                    >
                        <path d="M277.4 4c6-5.3 15.1-5.3 21.2 0L512.5 192.8c-5.4-.5-10.9-.8-16.5-.8c-10.2 0-20.2 .9-29.9 2.5L288 37.3 96 206.7 96 432c0 26.5 21.5 48 48 48l64 0 0-160c0-17.7 14.3-32 32-32l96 0c1 0 2.1 .1 3.1 .1c-5.1 10.1-9.3 20.7-12.5 31.9L240 320l0 160 16 0 80 0 24.2 0c10 12.1 21.7 22.9 34.6 32L144 512c-44.2 0-80-35.8-80-80l0-197L26.6 268C20 273.8 9.8 273.2 4 266.6S-1.2 249.8 5.4 244L277.4 4zM496 480a112 112 0 1 0 0-224 112 112 0 1 0 0 224zm0-256a144 144 0 1 1 0 288 144 144 0 1 1 0-288zm67.3 100.7c6.2 6.2 6.2 16.4 0 22.6l-72 72c-6.2 6.2-16.4 6.2-22.6 0l-40-40c-6.2-6.2-6.2-16.4 0-22.6s16.4-6.2 22.6 0L480 385.4l60.7-60.7c6.2-6.2 16.4-6.2 22.6 0z" />
                    </svg>
                </ImageBarButton>
            </li>
            <li>
                <ImageBarButton
                    value="construction"
                    showTooltip={showTooltip}
                    tooltip="Construction specifications"
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        height="28"
                        viewBox="0 0 640 512"
                    >
                        <path d="M128 0C110.3 0 96 14.3 96 32l0 128-48 0c-26.5 0-48 21.5-48 48l0 64c0 26.5 21.5 48 48 48l288 0c26.5 0 48-21.5 48-48l0-48 0-16 0-18.7c0-11.6-3.2-23-9.1-32.9L295 23.3C286.4 8.8 270.7 0 253.9 0L128 0zM339.8 160.2c-1.3-.1-2.5-.2-3.8-.2l-208 0 0-128 125.9 0c5.6 0 10.8 2.9 13.7 7.8l72.2 120.4zM32 272l0-64c0-8.8 7.2-16 16-16l288 0c8.8 0 16 7.2 16 16l0 16 0 48c0 8.8-7.2 16-16 16L48 288c-8.8 0-16-7.2-16-16zM336 384c26.5 0 48 21.5 48 48s-21.5 48-48 48L80 480c-26.5 0-48-21.5-48-48s21.5-48 48-48l256 0zM80 352c-44.2 0-80 35.8-80 80s35.8 80 80 80l256 0c44.2 0 80-35.8 80-80s-35.8-80-80-80L80 352zM480.6 476.7L608 349.3l0 2.7 0 32 0 48c0 26.5-21.5 48-48 48l-78.1 0c-1.1 0-1.9-.9-1.9-1.9c0-.5 .2-1 .6-1.4zm-22.6-22.6c-6.4 6.4-9.9 15-9.9 24c0 18.7 15.2 33.9 33.9 33.9l78.1 0c44.2 0 80-35.8 80-80l0-48 0-32 0-32 0-2.7 0-45.3 0-144 0-70.9 0-10.5C640 20.9 619.1 0 593.4 0c-11.2 0-22.1 4-30.5 11.4L416 138.7l0 42.3L583.8 35.6c2.7-2.3 6.1-3.6 9.6-3.6c8.1 0 14.6 6.5 14.6 14.6l0 38.7L586.8 104 416 254.7l0 42.7L576 156.2 608 128l0 42.7L608 304 457.9 454.1zM112 456a24 24 0 1 0 0-48 24 24 0 1 0 0 48zm120-24a24 24 0 1 0 -48 0 24 24 0 1 0 48 0zm72 24a24 24 0 1 0 0-48 24 24 0 1 0 0 48z" />
                    </svg>
                </ImageBarButton>
            </li>
        </ul>
    )
}
