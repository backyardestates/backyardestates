import { Roboto, Roboto_Slab } from 'next/font/google'
import style from './LeadForm.module.css'
// import Masthead from '@/components/Masthead'

import Script from 'next/script'

import { GoogleTagManager } from '@next/third-parties/google'
// import { SpeedInsights } from '@vercel/speed-insights/next'

import Head from 'next/head'

import { config } from '@fortawesome/fontawesome-svg-core'
import '@fortawesome/fontawesome-svg-core/styles.css'
config.autoAddCss = false

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
import Logo from '@/components/Logo'

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faXmark } from '@fortawesome/pro-solid-svg-icons'

function goBack() {
    // console.log('Go back one page')
    history.back()
}

export default function LeadForm({ children }) {
    return (
        <div className={`${roboto.variable} ${robotoSlab.variable}`}>
            <Script
                id="attributer"
                src="https://d1b3llzbo1rqxo.cloudfront.net/attributer.js"
            />
            <Head>
                <title>Talk to an ADU specialist - Backyard Estates</title>
                <meta
                    name="viewport"
                    content="width=device-width, initial-scale=1.0"
                />
                <link rel="icon" href="/favicon.ico" sizes="any" />
                <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
                <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
                <link rel="manifest" href="/site.webmanifest" />
                <meta name="theme-color" content="#ffffff" />
            </Head>
            <div className={style.topBar}>
                <Logo />
                <FontAwesomeIcon
                    icon={faXmark}
                    size="xl"
                    className={style.icon}
                    onClick={goBack}
                />
            </div>

            <main className={style.root}>{children}</main>
            {/* <SpeedInsights /> */}

            <GoogleTagManager gtmId="GTM-WZR3TD5L" />
        </div>
    )
}
