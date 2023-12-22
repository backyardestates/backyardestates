import { useRef } from 'react'
// import { gsap } from 'gsap'
// import { TextPlugin } from 'gsap/TextPlugin'
import { gsap } from 'gsap/dist/gsap'
import { TextPlugin } from 'gsap/dist/TextPlugin'
import { useGSAP } from '@gsap/react'
import Button from '../Button'
import style from './Hero.module.css'

gsap.registerPlugin(TextPlugin)

export default function Hero() {
    const phrases = [
        'bring parents closer',
        'house family members',
        'generate rental income',
        'create a hobby studio',
        'create an office',
    ]

    const titleRef = useRef()
    const phraseRef = useRef()
    const cursorRef = useRef()

    useGSAP(
        () => {
            // gsap.registerPlugin(Text)

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
                    // delay: 3,
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
            <div className={style.content}>
                <h1 ref={titleRef}>
                    <span className={style.title}>Build an ADU to</span>
                    <span ref={phraseRef}></span>
                    <span ref={cursorRef}>_</span>
                </h1>
                <p className={style.intro}>
                    With the quickest and only fixed-price Accessory Dwelling
                    Unit (ADU) builder in the greater Los Angeles area.
                </p>
                <Button href="/talk-to-an-adu-specialist">
                    Talk to an ADU specialist
                </Button>
            </div>
        </div>
    )
}
