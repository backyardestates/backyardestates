// app/layout.tsx
import Script from 'next/script'
import type { Metadata } from 'next'
import { config } from '@fortawesome/fontawesome-svg-core'
import '@fortawesome/fontawesome-svg-core/styles.css'
import { Analytics } from '@vercel/analytics/next'
import { SpeedInsights } from '@vercel/speed-insights/next'
config.autoAddCss = false

import { Roboto, Roboto_Slab } from 'next/font/google'
import FloatingButtonWrapper from '@/components/FloatingButtonWrapper'

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
    title: 'Backyard Estates',
    description:
        'Backyard Estates - Premier Accessory Dwelling Unit (ADU) builder for the greater Los Angeles area.',
}

import '../public/styles.css'

export default function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <html lang="en">
            <head>
                <Script
                    src={`https://cdn-cookieyes.com/client_data/24eab17e9999169b37112646/script.js`}
                    strategy="beforeInteractive"
                />
            </head>
            <body className={`${roboto.variable} ${robotoSlab.variable}`}>
                {children}
                <Analytics />
                <SpeedInsights />
                <FloatingButtonWrapper /> {/* ✅ Handles conditional logic */}
                <Script id="clarity-script" strategy="afterInteractive">
                    {`
            (function(c,l,a,r,i,t,y){
                c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
                t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
                y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
            })(window, document, "clarity", "script", "${process.env.NEXT_PUBLIC_CLARITY_PROJECT_ID}");
          `}
                </Script>
            </body>
        </html>
    )
}
