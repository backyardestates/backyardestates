import { useState, useEffect, useRef } from 'react'

import Image from 'next/image'

import gsap from 'gsap'

import ArrowButton from '../ArrowButton'

import style from './Carousel.module.css'

export default function Carousel(images) {
    const [position, setPosition] = useState(1)
    const [buttonLeftVisible, setButtonLeftVisible] = useState(false)
    const [buttonRightVisible, setButtonRightVisible] = useState(true)
    const slidesViewerRef = useRef()
    const slidesRef = useRef()

    function moveLeft() {
        const temp = position - 1
        setPosition(temp)
    }

    function moveRight() {
        const temp = position + 1
        setPosition(temp)
    }

    useEffect(() => {
        if (images.images.length !== 1) {
            switch (position) {
                case 1:
                    setButtonLeftVisible(false)
                    setButtonRightVisible(true)
                    break
                case images.images.length:
                    setButtonLeftVisible(true)
                    setButtonRightVisible(false)
                    break
                default:
                    setButtonLeftVisible(true)
                    setButtonRightVisible(true)
            }
        } else {
            setButtonLeftVisible(false)
            setButtonRightVisible(false)
        }

        // w = slidesRef.current.getBoundingClientRect().width
        // const w = slidesViewerRef.current.offsetWidth

        const imageWidth = slidesRef.current.getBoundingClientRect().width
        // console.log(imageWidth)
        let xPos = imageWidth * -1 * (position - 1)
        gsap.to(slidesRef.current, {
            x: xPos,
            duration: 0.5,
            ease: 'power2.out',
        })
    }, [position, images.images.length])

    return (
        <div className={style.base}>
            {buttonLeftVisible && (
                <div className={style.buttonLeft} onMouseUp={moveLeft}>
                    <ArrowButton direction="left" />
                </div>
            )}
            {buttonRightVisible && (
                <div className={style.buttonRight} onMouseUp={moveRight}>
                    <ArrowButton direction="right" />
                </div>
            )}
            <div ref={slidesViewerRef} className={style.slideViewer}>
                <div ref={slidesRef} className={style.slides}>
                    {images.images.map((image, index) => (
                        <div className={style.slide} key={index}>
                            <Image
                                src={`/images/property/${image}`}
                                alt={`Image of ADU`}
                                width={640}
                                height={360}
                                className={style.image}
                            />
                        </div>
                    ))}
                </div>
            </div>
            <div className={style.content}>
                <p>Floor plans designed for optimal space utilization.</p>
                <p className={style.folio}>
                    {position} / {images.images.length}
                </p>
            </div>
        </div>
    )
}
