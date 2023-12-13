import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import style from './Carousel.module.css'
import ArrowButton from '@/components/ArrowButton'

import { gsap } from 'gsap'

export default function Carousel() {
    const [position, setPosition] = useState(0)
    const img = useRef()
    let imgWidth = 0

    function moveLeft() {
        setPosition(0)
    }

    function moveRight() {
        setPosition(1)
    }

    useEffect(() => {
        imgWidth = img.current.offsetWidth
        // console.log('width', img.current ? img.current.offsetWidth : 0)
        switch (position) {
            case 0:
                // console.log('Set to 0')
                gsap.to('#target', { x: 0, duration: 0.5 })
                break
            case 1:
                // console.log('Set to 1')
                gsap.to('#target', { x: imgWidth * -1, duration: 0.5 })
                break
            default:
                console.log('Bang')
        }
    }, [position])

    // setButtons(position)
    return (
        <div className={style.base}>
            <div className={style.buttonLeft} onMouseDown={moveLeft}>
                <ArrowButton direction="left" />
            </div>
            <div className={style.buttonRight} onMouseDown={moveRight}>
                <ArrowButton direction="right" />
            </div>
            <div ref={img} className={style.slideViewer}>
                <div id="target" className={style.slides}>
                    <Image
                        src="/fpo.png"
                        alt="Hello"
                        width={320}
                        height={90}
                        className={style.img}
                        // style={{width}}
                    />
                    <Image
                        src="/fpo.png"
                        alt="Hello"
                        width={320}
                        height={90}
                        className={style.img}
                        // style={{width}}
                    />
                </div>
            </div>
            <div className={style.content}>
                <p>
                    <strong>Lorem ipsum dolor sit amet, </strong>
                    consectetur adipiscing elit, sed do eiusmod tempor
                    incididunt ut labore et dolore magna aliqua.
                </p>
                <p className={style.folio}>01 / 07</p>
            </div>
        </div>
    )
}
