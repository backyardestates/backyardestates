import { useState } from 'react'
import { useInView } from 'react-intersection-observer'
import Script from 'next/script'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import Hero from '@/components/Hero'
import Menu from '@/components/Menu'

import { SpeedInsights } from '@vercel/speed-insights/next'

import { Roboto, Roboto_Slab } from 'next/font/google'
import Head from 'next/head'

import style from './Homepage.module.css'

const roboto = Roboto({
    variable: '--font-sans',
    subsets: ['latin'],
    weight: ['100', '300', '400', '500', '700', '900'],
})

const robotoSlab = Roboto_Slab({
    variable: '--font-serif',
    subsets: ['latin'],
    weight: ['100', '300', '400', '500', '700', '900'],
})

export const metadata = {
    title: 'Backyard Estates',
    description:
        'Backyard Estates - Premier Accessory Dwelling Unit (ADU) builder for the greater Los Angeles area.',
}

export default function Homepage({ children }) {
    const { ref, inView } = useInView()
    const [showMenu, setShowMenu] = useState(false)

    function toggleMenu() {
        if (!showMenu) {
            document.body.style.overflow = 'hidden'
        } else {
            document.body.style.overflow = 'auto'
        }
        setShowMenu(!showMenu)
    }

    return (
        <div className={`${roboto.variable} ${robotoSlab.variable}`}>
            <Script
                src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GOOGLE_TAG_MANAGER}`}
            />
            <Head>
                <title>
                    Backyard Estates - Premier Accessory Dwelling Unit (ADU)
                    builder for the greater Los Angeles area.
                </title>
                <meta
                    name="viewport"
                    content="width=device-width, initial-scale=1.0"
                />
                <link rel="icon" href="/favicon.ico" sizes="any" />
                <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
                <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
                <link rel="manifest" href="/site.webmanifest" />
                <meta name="theme-color" content="#4a4a4a" />
            </Head>
            <Menu showMenu={showMenu} toggleMenu={toggleMenu} />
            <Navbar
                toggleMenu={toggleMenu}
                isHomepage={true}
                mode={inView ? 'dark' : 'light'}
            />
            <div ref={ref} className={style.wrapper}>
                <Hero />
            </div>
            <main>{children}</main>
            <Footer />
            {/* <SpeedInsights /> */}
        </div>
    )
}
