import Benefits from '@/components/Benefits'
import Floorplans from '@/components/Floorplans'
import Footer from '@/components/Footer'
import Hero from '@/components/Hero'
import HeroNav from '@/components/HeroNav'
import Process from '@/components/Process'
import Properties from '@/components/Properties'
import StandaloneLink from '@/components/StandaloneLink'
import Testimonials from '@/components/Testimonials'
import InclusionsHomePanel from '@/components/InclusionsHomePanel'

import '../public/styles.css'
import style from './page.module.css'

export default function Home() {
    return (
        <>
            <HeroNav />
            <Hero />
            <Testimonials />
            <Floorplans showNav />
            <div className={style.inclusions}>
                <h2 className={style.title}>Standard inclusions</h2>
                <p className={style.explanation}>
                    We provide complete transparency on the exact inclusions of
                    our standard and custom ADU builds
                </p>
                <StandaloneLink href="/standard-inclusions" theme="beige">
                    View inclusions
                </StandaloneLink>
                <InclusionsHomePanel />
            </div>
            <Benefits />
            <Process />
            <Properties />
            <Footer />
        </>
    )
}
