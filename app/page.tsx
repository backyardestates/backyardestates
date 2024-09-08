import Benefits from '@/components/Benefits'
import Floorplans from '@/components/Floorplans'
import Footer from '@/components/Footer'
import Hero from '@/components/Hero'
import HeroNav from '@/components/HeroNav'
// import OpenGraph from '@/components/OpenGraph'
import Process from '@/components/Process'
import Properties from '@/components/Properties'
import Testimonials from '@/components/Testimonials'

import '../public/styles.css'

export default function Home() {
    return (
        <>
            {/* <OpenGraph /> */}
            <HeroNav />
            <Hero />
            <Testimonials />
            <Floorplans showNav />
            <Benefits />
            <Process />
            <Properties />
            <Footer />
        </>
    )
}
