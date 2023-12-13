import { useState } from 'react'
import { Roboto, Roboto_Slab } from 'next/font/google'
import style from './Floorplan.module.css'

import Floorplans from '@/components/Floorplans'

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

import Navbar from '../../components/Navbar'
import Footer from '../../components/Footer'
import Catchall from '@/components/Catchall'
import RelatedContent from '@/components/RelatedContent'
import Menu from '@/components/Menu'

export default function Floorplan({ title, explanation, children }) {
    const [showMenu, setShowMenu] = useState(false)
    function toggleMenu() {
        setShowMenu(!showMenu)
    }
    return (
        <div className={`${roboto.variable} ${robotoSlab.variable}`}>
            <Menu showMenu={showMenu} toggleMenu={toggleMenu} />
            <Navbar toggleMenu={toggleMenu} />

            <main className={style.root}>{children}</main>
            <Floorplans showNav={false} />
            <RelatedContent />
            <Catchall />
            <Footer />
        </div>
    )
}
