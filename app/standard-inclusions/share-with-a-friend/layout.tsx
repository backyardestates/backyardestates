import { Suspense } from 'react'
import Script from 'next/script'
import type { Metadata } from 'next'

// import { GoogleTagManager } from '@next/third-parties/google'

import { config } from '@fortawesome/fontawesome-svg-core'
import '@fortawesome/fontawesome-svg-core/styles.css'
config.autoAddCss = false

import { Roboto, Roboto_Slab } from 'next/font/google'

const roboto = Roboto({
    variable: '--font-sans',
    subsets: ['latin'],
    weight: ['100', '300', '400', '500', '700', '900'],
    display: 'swap',
})

const robotoSlab = Roboto_Slab({
    variable: '--font-serif',
    subsets: ['latin'],
    weight: ['100', '300', '400', '500', '700', '900'],
    display: 'swap',
})

export const metadata: Metadata = {
    title: { absolute: 'Standard Inclusions | Backyard Estates' },
    description:
        'See what comes standard in a Backyard Estates ADU build.',
    robots: { index: false, follow: true },
}

import '/public/styles.css'

export default function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <Suspense>
            <html lang="en">
                <head>
                    <Script
                        src={`https://cdn-cookieyes.com/client_data/24eab17e9999169b37112646/script.js`}
                        strategy="beforeInteractive"
                    />
                </head>
                <body className={`${roboto.variable} ${robotoSlab.variable}`}>
                    {children}
                </body>
            </html>
        </Suspense>
    )
}
