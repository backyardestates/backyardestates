import Script from 'next/script'
import { GoogleTagManager } from '@next/third-parties/google'

import Head from 'next/head'

export default function Page() {
    return (
        <div>
            <Script
                id="attributer"
                src="https://d1b3llzbo1rqxo.cloudfront.net/attributer.js"
            />
            <Head>
                <link rel="icon" href="/favicon.ico" sizes="any" />
                <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
                <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
                <link rel="manifest" href="/site.webmanifest" />
                <meta name="theme-color" content="#ffffff" />
            </Head>
            <GoogleTagManager gtmId="GTM-WZR3TD5L" />
        </div>
    )
}
