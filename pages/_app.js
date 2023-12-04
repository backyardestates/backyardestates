import { config } from '@fortawesome/fontawesome-svg-core'
// import '@fortawesome/fontawesome-svg-core/styles.css'
import '../node_modules/@fortawesome/fontawesome-svg-core/styles.css'
config.autoAddCss = false

import '../public/styles.css'

export default function MyApp({ Component, pageProps }) {
    return <Component {...pageProps} />
}
