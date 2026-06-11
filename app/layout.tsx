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
import JsonLd from '@/components/JsonLd'
import { siteGraph } from '@/lib/jsonLd'
import { GoogleAnalytics } from '@next/third-parties/google'

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

import { SITE_URL, business } from '@/lib/business'

export const metadata: Metadata = {
    metadataBase: new URL(SITE_URL),
    title: {
        default:
            'Backyard Estates | ADU Builder in the Inland Empire & Los Angeles',
        template: '%s | Backyard Estates',
    },
    description: business.description,
    // NOTE: no default canonical here — a canonical set on the root layout would
    // be inherited by every page, collapsing them all to "/". Each page sets its
    // own canonical via buildMetadata (lib/seo.ts); the homepage sets '/'.
    openGraph: {
        siteName: business.name,
        type: 'website',
        locale: 'en_US',
        images: [{ url: '/images/backyard-estates-OG.png', width: 1200, height: 630 }],
    },
    twitter: {
        card: 'summary_large_image',
        images: ['/images/backyard-estates-Twitter.png'],
    },
    // TODO(real-data): paste verification tokens from Google Search Console and
    // Bing Webmaster Tools. Until filled, these meta tags are simply omitted.
    verification: {
        google: process.env.NEXT_PUBLIC_GSC_VERIFICATION || undefined,
        other: process.env.NEXT_PUBLIC_BING_VERIFICATION
            ? { 'msvalidate.01': process.env.NEXT_PUBLIC_BING_VERIFICATION }
            : {},
    },
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
                <JsonLd data={siteGraph()} />
                {children}
                <Analytics />
                <SpeedInsights />
                {/* GA4 — only loads when the measurement ID env var is set,
                    alongside Vercel Analytics and Microsoft Clarity. */}
                {process.env.NEXT_PUBLIC_GA_ID && (
                    <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_ID} />
                )}
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
