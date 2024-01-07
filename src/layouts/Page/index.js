import { useState, useEffect } from 'react'
import { Roboto, Roboto_Slab } from 'next/font/google'

import Script from 'next/script'

import { config } from '@fortawesome/fontawesome-svg-core'
import '@fortawesome/fontawesome-svg-core/styles.css'
config.autoAddCss = false

import style from './Page.module.css'
import Masthead from '@/components/Masthead'

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

import Navbar from '../../components/Navbar'
import Footer from '../../components/Footer'
import Catchall from '@/components/Catchall'
import Menu from '@/components/Menu'
import Head from 'next/head'
import Inspector from '@/components/Inspector'

export default function Page({
    title,
    pageTitle,
    explanation,
    children,
    floorplans,
}) {
    const [showMenu, setShowMenu] = useState(false)

    function toggleMenu() {
        if (!showMenu) {
            document.body.style.overflow = 'hidden'
        } else {
            document.body.style.overflow = 'auto'
        }
        setShowMenu(!showMenu)
    }

    useEffect(() => {
        if (showMenu) {
            document.body.style.overflow = 'hidden'
        } else {
            document.body.style.overflow = 'auto'
        }
    })

    return (
        <div className={`${roboto.variable} ${robotoSlab.variable}`}>
            <Script
                src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GOOGLE_TAG_MANAGER}`}
            />
            <Head>
                <title>{pageTitle}</title>
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
            {/* <Inspector showMenu={showMenu} /> */}
            <Menu showMenu={showMenu} toggleMenu={toggleMenu} />
            <Navbar toggleMenu={toggleMenu} />
            <Masthead title={title} explanation={explanation} />
            <main className={style.base}>
                {children}
                <Catchall />
            </main>
            <Footer floorplans={floorplans} />
        </div>
    )
}
