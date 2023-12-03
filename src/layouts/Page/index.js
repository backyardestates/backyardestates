import { Roboto, Roboto_Slab } from 'next/font/google'
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

export default function Page({ title, explanation, children }) {
    return (
        <div className={`${roboto.variable} ${robotoSlab.variable}`}>
            <Navbar />
            <Masthead title={title} explanation={explanation} />
            <main className={style.root}>
                {children}
                <Catchall />
            </main>

            <Footer />
        </div>
    )
}
