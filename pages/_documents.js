import { Html, Head, Main, NextScript } from 'next/document'
import Script from 'next/script'

export default function Document() {
    return (
        <Html>
            <Head />
            <body>
                <Main />
                <NextScript />
                <Script
                    src={`https://cdn-cookieyes.com/client_data/24eab17e9999169b37112646/script.js`}
                    strategy="beforeInteractive"
                ></Script>
            </body>
        </Html>
    )
}
