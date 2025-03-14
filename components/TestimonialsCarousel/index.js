'use client'

import { useState, useEffect, useRef } from 'react'
import gsap from 'gsap'
import useViewport from '@/hooks/useViewport'

import ArrowButton from '@/components/ArrowButton'
import Testimonial from '@/components/Testimonial'

import style from './TestimonialsCarousel.module.css'

export default function TestimonialsCarousel({ testimonials }) {
    const stories = testimonials
    const slideCount = stories.length
    const slidesPerView = 1
    // const slidesToScroll = slideCount - slidesPerView
    const [position, setPosition] = useState(1)
    const [buttonLeftVisible, setButtonLeftVisible] = useState(false)
    const [buttonRightVisible, setButtonRightVisible] = useState(true)
    const slidesViewerRef = useRef()
    const slidesRef = useRef()
    const [isMobile, setIsMobile] = useState(true)
    const { width } = useViewport()

    function moveLeft() {
        const temp = position - 1
        setPosition(temp)
    }

    function moveRight() {
        const temp = position + 1
        setPosition(temp)
    }

    useEffect(() => {
        if (width > 768) {
            setIsMobile(false)
        }

        switch (position) {
            case 1:
                setButtonLeftVisible(false)
                setButtonRightVisible(true)
                break
            case slideCount:
                setButtonLeftVisible(true)
                setButtonRightVisible(false)
                break
            default:
                setButtonLeftVisible(true)
                setButtonRightVisible(true)
        }

        const imageWidth = slidesRef.current.getBoundingClientRect().width
        let xPos = (imageWidth / slidesPerView) * -1 * (position - 1)
        gsap.to(slidesRef.current, {
            x: xPos,
            duration: 0.5,
            ease: 'power2.out',
        })
    }, [position, slideCount])

    return (
        <div className={style.base}>
            {!isMobile && (
                <div className={style.btnLeft}>
                    {buttonLeftVisible && (
                        <div onMouseUp={moveLeft}>
                            <ArrowButton direction="left" />
                        </div>
                    )}
                </div>
            )}
            <div ref={slidesViewerRef} className={style.carousel}>
                <div ref={slidesRef} className={style.slides}>
                    {stories.map((story, index) => (
                        <Testimonial story={story} key={index} />
                    ))}
                </div>
            </div>
            {!isMobile && (
                <div className={style.btnRight}>
                    {buttonRightVisible && (
                        <div onMouseUp={moveRight}>
                            <ArrowButton direction="right" />
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
