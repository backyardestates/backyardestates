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
            {imageCount > 1 && (
                <>
                    <button
                        type="button"
                        className={style.buttonLeft}
                        onClick={moveLeft}
                        disabled={!buttonLeftVisible}
                        aria-label="Previous image"
                    >
                        <ArrowButton direction="left" />
                    </button>
                    <button
                        type="button"
                        className={style.buttonRight}
                        onClick={moveRight}
                        disabled={!buttonRightVisible}
                        aria-label="Next image"
                    >
                        <ArrowButton direction="right" />
                    </button>
                </>
            )}
            <div ref={slidesViewerRef} className={style.slideViewer}>
                <div ref={slidesRef} className={style.slides}>
                    {images.map((image, index) => (
                        <div className={style.slide} key={index}>
                            <CldImage
                                src={image.secure_url}
                                width="640"
                                height="360"
                                alt={`Photo ${index + 1} of ${imageCount}`}
                                className={style.image}
                                loading="lazy"
                            />
                        </div>
                    ))}
                </div>
            </div>
            <div className={style.content}>
                <p className={style.folio}>
                    {position} / {imageCount}
                </p>
            </div>
        </div>
    )
}
