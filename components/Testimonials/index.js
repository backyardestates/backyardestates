// 'use client'

// import { useState, useEffect, useRef } from 'react'
import ArrowButton from '../ArrowButton'
import TestimonialsCarousel from '@/components/TestimonialsCarousel'
import style from './Testimonials.module.css'

export default function Testimonials() {
    // const [position, setPosition] = useState(1)
    // const [buttonLeftVisible, setButtonLeftVisible] = useState(false)
    // const [buttonRightVisible, setButtonRightVisible] = useState(true)
    // const slidesViewerRef = useRef()
    // const slidesRef = useRef()

    function moveLeft() {
        console.log('move left')
        // const temp = position - 1
        // setPosition(temp)
    }

    function moveRight() {
        console.log('move right')
        // const temp = position + 1
        // setPosition(temp)
    }

    // useEffect(() => {
    //     if (count !== 1) {
    //         switch (position) {
    //             case 1:
    //                 setButtonLeftVisible(false)
    //                 setButtonRightVisible(true)
    //                 break
    //             case imageCount:
    //                 setButtonLeftVisible(true)
    //                 setButtonRightVisible(false)
    //                 break
    //             default:
    //                 setButtonLeftVisible(true)
    //                 setButtonRightVisible(true)
    //         }
    //     } else {
    //         setButtonLeftVisible(false)
    //         setButtonRightVisible(false)
    //     }

    //     const imageWidth = slidesRef.current.getBoundingClientRect().width
    //     let xPos = imageWidth * -1 * (position - 1)
    //     gsap.to(slidesRef.current, {
    //         x: xPos,
    //         duration: 0.5,
    //         ease: 'power2.out',
    //     })
    // }, [position, imageCount])

    return (
        <div className={style.base}>
            <h2>Trusted by Californian homeowners</h2>
            <p className="small-caps">greater los angeles area</p>
            <div className={style.container}>
                {/* <ArrowButton direction="left" /> */}
                <div className={style.spacer} />
                <TestimonialsCarousel />
                <div className={style.spacer} />
                {/* <ArrowButton direction="right" /> */}
            </div>
        </div>
    )
}
