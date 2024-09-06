import Image from 'next/image'
import SectionTitle from '../SectionTitle'
// import StandaloneLink from '../StandaloneLink'

import style from './Floorplans.module.css'
// import VideoPlayer from '../VideoPlayer'
// import PropertyInformation from '../PropertyInformation'
import ButtonTags from '../ButtonTags'

import db from '@/utils/db'
import ExploreFloorplans from '../ExploreFloorplans'

const getFloorplans = async () => {
    const floorplans = await db.floorplan.findMany({
        orderBy: [
            {
                id: 'asc',
            },
        ],
        where: {
            isFloorplan: true,
            isClickable: true,
        },
    })
    return floorplans
}

// export default async function Properties() {

export default async function Floorplans({ showNav = false }) {
    const floorplans = await getFloorplans()

    return (
        <div className={style.base}>
            <div className={style.content}>
                <SectionTitle
                    title="Explore our floor plans"
                    explanation="We offer customized ADU floorplans to accomodate your family's needs."
                />

                <ExploreFloorplans showNav floorplans={floorplans} />
            </div>

            <div className={style.bg}>
                <Image
                    src="/greater-los-angeles.svg"
                    alt="Accessory Dwelling Unit (ADU)"
                    fill
                    sizes="100vw"
                    style={{
                        objectFit: 'cover',
                        objectPosition: 'center center',
                        opacity: 0.15,
                    }}
                />
            </div>
        </div>
    )
}
