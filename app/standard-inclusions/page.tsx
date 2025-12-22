// import TabPanel from '@/components/TabPanel'
import Tabs from '@/components/Tabs'
import InclusionsPanel from '@/components/InclusionsPanel'

import { ROOMS } from '../../content/inclusions'

import Catchall from '@/components/AttentionCTA'
import Footer from '@/components/Footer'
import Masthead from '@/components/Masthead'
import Nav from '@/components/Nav'

// import db from '@/utils/db'
import style from './StandardInclusions.module.css'
import AttentionCTA from '@/components/AttentionCTA'

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
                <AttentionCTA
                    eyebrow="Get Started"
                    title="Start your ADU journey today"
                    description="Expand your income and livable space with a thoughtfully designed ADU. Our team handles everything — from feasibility to final build."
                    primaryLabel="Talk to an ADU Specialist"
                    primaryHref="/talk-to-an-adu-specialist"
                    secondaryText="Or call (425) 494-4705"
                    secondaryHref="tel:+4254944705"
                />
            </main>
            <Footer />
        </>
    )
}
