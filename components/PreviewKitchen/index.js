// import { useContext } from 'react'
// import { PreviewContext } from '@/components/InclusionsPanel'

import Image from 'next/image'
import { COLLECTIONS } from '@/content/inclusions'

import style from '../Preview/Preview.module.css'

export default function PreviewKitchen({ preview }) {
    const imageWidth = 640
    const imageHeight = 426

    return (
        <div className={style.base}>
            <Image
                src={`/images/inclusions/${preview.room}/hardware/${
                    COLLECTIONS[preview.collectionID].rooms[preview.roomID]
                        .hardware
                }.png`}
                alt={`Preview of the ${preview.collection} ${preview.room} hardware`}
                className={style.imageHardware}
                fill
                priority
            />
            <Image
                src={`/images/inclusions/${preview.room}/countertop/${
                    COLLECTIONS[preview.collectionID].rooms[preview.roomID]
                        .countertop
                }.png`}
                alt={`Preview of the ${preview.collection} ${preview.room}`}
                className={style.imageCountertop}
                fill
                priority
            />
            <Image
                src={`/images/inclusions/${preview.room}/cabinet/${preview.kitchenCabinets}.png`}
                alt={`Preview of the ${preview.collection} ${preview.room}`}
                className={style.imageCabinets}
                fill
                priority
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
            <Image
                src={`/images/inclusions/${preview.room}/flooring/${
                    COLLECTIONS[preview.collectionID].rooms[preview.roomID]
                        .flooring
                }.png`}
                alt={`Preview of the ${preview.collection} ${preview.room}`}
                className={style.imageFlooring}
                fill
                priority
            />
            <Image
                src={`/images/inclusions/${preview.room}/background.jpg`}
                alt={`Preview of the ${preview.collection} ${preview.room}`}
                className={style.imageBackground}
                fill
                priority
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
        </div>
    )
}
