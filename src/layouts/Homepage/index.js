import { useInView } from 'react-intersection-observer'
import { Roboto, Roboto_Slab } from 'next/font/google'

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
import Hero from '../../components/Hero'

export default function Homepage({ children }) {
    const { ref, inView } = useInView()
    return (
        <div className={`${roboto.variable} ${robotoSlab.variable}`}>
            <Navbar isHomepage={true} mode={inView ? 'dark' : 'light'} />
            <div ref={ref}>
                <Hero />
            </div>
            <main>{children}</main>
            <Footer />
        </div>
    )
}
