'use client'

import { useKeenSlider } from 'keen-slider/react'

import { useRef, useState } from 'react'
import { gsap } from 'gsap/dist/gsap'
import { TextPlugin } from 'gsap/dist/TextPlugin'
import { useGSAP } from '@gsap/react'
import Button from '../Button'
import VideoPlayerCarousel from '@/components/VideoPlayerCarousel'

gsap.registerPlugin(TextPlugin)

import 'keen-slider/keen-slider.min.css'
import style from './CustomerStories.module.css'

export default function CustomerStories({ stories }) {
    const [current, setCurrent] = useState(0)

    const [sliderRef] = useKeenSlider({
        loop: true,
        slides: {
            perView: 4,
            spacing: 32,
            origin: 'center',
        },
        breakpoints: {
            '(max-width: 500px)': {
                loop: true,
                slides: {
                    perView: 1,
                    spacing: 16,
                    origin: 'center',
                },
            },
        },
        slideChanged(s) {
            setCurrent(s.track.details.rel)
            console.log('dragStart')
        },
        // dragStart() {
        //     console.log('dragStart')
        //     // setDragging(true)
        // },
        // dragEnd() {
        //     console.log('dragEnd')
        //     // setDragging(false)
        // },
    })

    const phrases = [
        'bring parents closer',
        'house family members',
        'generate rental income',
        'create a hobby studio',
        'create an office',
    ]

    const titleRef = useRef(null)
    const phraseRef = useRef(null)
    const cursorRef = useRef(null)

    useGSAP(
        () => {
            gsap.to(cursorRef.current, {
                opacity: 0,
                repeat: -1,
                yoyo: true,
                duration: 0.5,
                ease: 'power2.inOut',
            })

            let masterTimeline = gsap.timeline({ repeat: -1 })

            phrases.forEach((phrase) => {
                let textTimeline = gsap.timeline({
                    repeat: 1,
                    yoyo: true,
                    repeatDelay: 2,
                })
                textTimeline.to(phraseRef.current, {
                    duration: 2,
                    text: phrase,
                })
                masterTimeline.add(textTimeline, '>1')
            })
        },
        { scope: titleRef }
    )

    return (
        <div className={style.base}>
            <div ref={sliderRef} className={`keen-slider ${style.slider}`}>
                {stories.map((story, index) => (
                    <div
                        className={`keen-slider__slide ${index === current ? style.video : style.slide}`}
                        key={index}
                    >
                        <VideoPlayerCarousel
                            story={story}
                            wistiaId={story.wistiaId}
                            isActive={index === current ? true : false}
                        />
                    </div>
                ))}
            </div>
            <div className={style.bottom}>
                <h1 ref={titleRef}>
                    <span className={style.title}>Build an ADU to</span>
                    <span ref={phraseRef}></span>
                    <span ref={cursorRef}>_</span>
                </h1>
                <Button href="/talk-to-an-adu-specialist">
                    Talk to an ADU specialist
                </Button>
                <p className={style.small_caps}>
                    premier adu builder
                    <br />
                    <span>Los Angeles county</span>
                </p>
            </div>
        </div>
    )
}
