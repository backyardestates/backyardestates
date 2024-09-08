import type { Metadata } from 'next'

import Catchall from '@/components/Catchall'
import Footer from '@/components/Footer'
import Masthead from '@/components/Masthead'
import Nav from '@/components/Nav'
// import OpenGraph from '@/components/OpenGraph'
import PropertiesGrid from '@/components/PropertiesGrid'

import style from './page.module.css'

import db from '@/utils/db'

const getProperties = async () => {
    const properties = await db.floorplan.findMany({
        orderBy: [
            {
                order: 'asc',
            },
            {
                title: 'asc',
            },
        ],
    })
    return properties
}

export const metadata: Metadata = {
    title: 'Gallery - Backyard Estates',
    description:
        'Browse recent projects and customer stories to discover the right Accessory Dwelling Unit (ADU) for your family',
}

export default async function Floorplan({ params }) {
    const properties = await getProperties()
    return (
        <>
            {/* <OpenGraph title={`Backyard Estates - Gallery`} /> */}
            <Masthead
                title="Gallery"
                explanation="Browse recent projects and customer stories to discover the right Accessory Dwelling Unit (ADU) for your family"
            />
            <Nav />
            <main className={style.base}>
                {/* <OpenGraph title={`Backyard Estates - Gallery`} /> */}
                <div className={style.content}>
                    <PropertiesGrid properties={properties} />
                </div>
                <Catchall />
            </main>
            <Footer />
        </>
    )
}
