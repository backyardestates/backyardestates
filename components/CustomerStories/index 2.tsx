'use client'

import { useRef, useState, useEffect } from 'react'

import { useKeenSlider } from 'keen-slider/react'
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
    const [loaded, setLoaded] = useState(false)
    const [playing, setPlaying] = useState(false)

    const [sliderRef, instanceRef] = useKeenSlider(
        {
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
            created() {
                setLoaded(true)
            },
            slideChanged(s) {
                setCurrent(s.track.details.rel)
            },
        },
        [
            (slider) => {
                let timeout
                let mouseOver = false
                function clearNextTimeout() {
                    clearTimeout(timeout)
                }
                function nextTimeout() {
                    clearTimeout(timeout)
                    if (mouseOver) return
                    timeout = setTimeout(() => {
                        slider.next()
                    }, 5000)
                }
                slider.on('created', () => {
                    // slider.container.addEventListener('mouseover', () => {
                    //     mouseOver = true
                    //     clearNextTimeout()
                    //     console.log('playing:', playing)
                    // })
                    // slider.container.addEventListener('mouseout', () => {
                    //     mouseOver = false
                    //     nextTimeout()
                    //     console.log('playing:', playing)
                    // })
                    // nextTimeout()
                })
                slider.on('dragStarted', clearNextTimeout)
                // slider.on('animationEnded', nextTimeout)
                // slider.on('updated', () => {
                //     console.log('slider updated')
                // })
            },
        ]
    )

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

    useEffect(() => {
        console.log('>>> playing:', playing)
    }, [playing])

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
            {/* <p>{playing ? 'Playing' : 'Paused'}</p> */}
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
                            setPlaying={setPlaying}
                        />
                    </div>
                ))}
            </div>
            {loaded && instanceRef.current && (
                <div className={style.dots}>
                    {/* <p>{`current: ${current}`}</p> */}
                    {[
                        ...Array(
                            instanceRef.current.track.details.slides.length
                        ).keys(),
                    ].map((index) => {
                        return (
                            <button
                                key={index}
                                onClick={() => {
                                    instanceRef.current?.moveToIdx(index)
                                }}
                                className={
                                    current === index
                                        ? style.dot_active
                                        : style.dot
                                }
                            ></button>
                        )
                    })}
                </div>
            )}

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
