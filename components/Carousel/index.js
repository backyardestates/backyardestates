import { useState, useEffect, useRef } from 'react'

import { CldImage } from 'next-cloudinary'
import gsap from 'gsap'

import ArrowButton from '../ArrowButton'

import style from './Carousel.module.css'

export default function Carousel(content) {
    const images = content.content
    const imageCount = images.length
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
        if (imageCount !== 1) {
            switch (position) {
                case 1:
                    setButtonLeftVisible(false)
                    setButtonRightVisible(true)
                    break
                case imageCount:
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

        const imageWidth = slidesRef.current.getBoundingClientRect().width
        let xPos = imageWidth * -1 * (position - 1)
        gsap.to(slidesRef.current, {
            x: xPos,
            duration: 0.5,
            ease: 'power2.out',
        })
    }, [position, imageCount])

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
                    {images.map((image, index) => (
                        <div className={style.slide} key={index}>
                            <CldImage
                                src={image.secure_url}
                                width="640"
                                height="360"
                                alt={`Image of ADU`}
                                className={style.image}
                            />
                        </div>
                    ))}
                </div>
            </div>
            <div className={style.content}>
                <p>Floor plans designed for optimal space utilization.</p>
                <p className={style.folio}>
                    {position} / {imageCount}
                </p>
            </div>
        </div>
    )
}
