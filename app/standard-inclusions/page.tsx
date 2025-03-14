// import TabPanel from '@/components/TabPanel'
import Tabs from '@/components/Tabs'
import InclusionsPanel from '@/components/InclusionsPanel'

import { ROOMS } from '../../content/inclusions'

import Catchall from '@/components/Catchall'
import Footer from '@/components/Footer'
import Masthead from '@/components/Masthead'
import Nav from '@/components/Nav'

// import db from '@/utils/db'
import style from './StandardInclusions.module.css'

// const getFloorplans = async () => {
//     const floorplans = await db.floorplan.findMany({
//         where: {
//             isFloorplan: true,
//         },
//     })
//     return floorplans
// }

export default async function StandardInclusions() {
    // const floorplans = await getFloorplans()

    return (
        <>
            <Masthead
                title="Standard inclusions"
                explanation="We provide complete transparency on the exact inclusions of our standard and custom ADU builds"
            />
            <Nav />
            <InclusionsPanel />
            <main className={style.base}>
                <Tabs tabs={ROOMS} />
                <Catchall />
            </main>
            <Footer />
        </>
    )
}
