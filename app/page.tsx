// import { useState } from 'react'
// import { useInView } from 'react-intersection-observer'

import Benefits from '@/components/Benefits'
import Floorplans from '@/components/Floorplans'
import Footer from '@/components/Footer'
// import Hero from '@/components/Hero'
// import Navbar from '@/components/Navbar'
// import Menu from '@/components/Menu'
import OpenGraph from '@/components/OpenGraph'
import Process from '@/components/Process'
import Properties from '@/components/Properties'
import Testimonials from '@/components/Testimonials'

import '../public/styles.css'
// import style from './page.module.css'

export default function Home() {
    // const { ref, inView } = useInView({ initialInView: true })
    // const [showMenu, setShowMenu] = useState(false)

    // function toggleMenu() {
    //     // document.body.scrollTop = 0
    //     if (!showMenu) {
    //         document.body.style.overflow = 'hidden'
    //     } else {
    //         document.body.style.overflow = 'auto'
    //     }
    //     setShowMenu(!showMenu)
    // }

    return (
        <>
            <OpenGraph />
            {/* <Menu showMenu={showMenu} toggleMenu={toggleMenu} /> */}
            {/* <Navbar
                toggleMenu={toggleMenu}
                isHomepage={true}
                mode={inView ? 'dark' : 'light'}
            /> */}
            {/* <div ref={ref} className={style.wrapper}>
                <Hero />
            </div> */}
            <Testimonials />
            <Floorplans showNav />
            <Benefits />
            <Process />
            <Properties />
            <Footer />
        </>
    )
}
