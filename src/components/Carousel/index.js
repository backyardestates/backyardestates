import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import style from './Carousel.module.css'
import ArrowButton from '@/components/ArrowButton'

// import { gsap } from 'gsap'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'

export default function Carousel(images) {
    const [position, setPosition] = useState(1)

    const [buttonLeftVisible, setButtonLeftVisible] = useState(false)
    const [buttonRightVisible, setButtonRightVisible] = useState(true)
    const img = useRef()

    function moveLeft() {
        const temp = position - 1
        setPosition(temp)
    }

    function moveRight() {
        const temp = position + 1
        setPosition(temp)
    }

    useEffect(() => {
        // console.log(`The current position is ${position}`)
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

        // console.log(img.current.offsetWidth)
        // console.log(img.current.getBoundingClientRect().width)
        const imageWidth = img.current.getBoundingClientRect().width
        let xPos = imageWidth * -1 * (position - 1)
        gsap.to(img.current, {
            x: xPos,
            duration: 0.5,
            ease: 'power2.out',
        })
    }, [position, images.images.length])

    // useGSAP(() => {
    //     console.log('Bang')
    //     let xPos = -320 * (position - 1)
    //     gsap.to(img.current, {
    //         x: xPos,
    //         duration: 0.5,
    //         // ease: 'power2.out',
    //     })
    // })

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
            <div className={style.slideViewer}>
                <div ref={img} className={style.slides}>
                    {images.images.map((image, index) => (
                        // console.log(image)
                        <Image
                            key={index}
                            src={`/images/property/${image}`}
                            alt={`Image of ADU`}
                            width={320}
                            height={90}
                            className={style.img}
                        />
                    ))}
                </div>
            </div>
            <div className={style.content}>
                <p>
                    <mark>
                        <strong>Lorem ipsum dolor sit amet, </strong>
                        consectetur adipiscing elit, sed do eiusmod tempor
                        incididunt ut labore et dolore magna aliqua.
                    </mark>
                </p>
                <p className={style.folio}>
                    {position} / {images.images.length}
                </p>
            </div>
        </div>
    )
}
