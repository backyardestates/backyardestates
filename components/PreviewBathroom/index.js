import { useContext } from 'react'
import { PreviewContext } from '@/components/InclusionsPanel'

import Image from 'next/image'
import { COLLECTIONS } from '@/content/inclusions'

import style from '../Preview/Preview.module.css'

export default function PreviewBathroom() {
    const { preview } = useContext(PreviewContext)

    let collectionID = 0

    switch (preview.collection) {
        case 'light':
            collectionID = 0
            break
        case 'dark':
            collectionID = 1
            break
        case 'blue':
            collectionID = 2
            break
        case 'monochrome':
            collectionID = 3
            break
        case 'olive':
            collectionID = 4
            break
        default:
            collectionID = 5
            break
    }

    return (
        <div className={style.base}>
            <Image
                src={`/images/inclusions/${preview.room}/hardware/${COLLECTIONS[collectionID].rooms[1].hardware}.png`}
                alt={`Preview of the ${preview.collection} ${preview.room}`}
                className={style.imageHardware}
                fill
                priority
            />
            <Image
                src={`/images/inclusions/${preview.room}/countertop/${COLLECTIONS[collectionID].rooms[1].countertop}.png`}
                alt={`Preview of the ${preview.collection} ${preview.room}`}
                className={style.imageCountertop}
                fill
                priority
            />
            <Image
                src={`/images/inclusions/${preview.room}/cabinet/${COLLECTIONS[collectionID].rooms[1].cabinet}.png`}
                alt={`Preview of the ${preview.collection} ${preview.room}`}
                className={style.imageCabinets}
                fill
                priority
            />
            <Image
                src={`/images/inclusions/${preview.room}/tub/${COLLECTIONS[collectionID].rooms[1].hardware}.png`}
                alt={`Preview of the ${preview.collection} ${preview.room}`}
                className={style.imageHardware}
                fill
                priority
            />
            <Image
                src={`/images/inclusions/${preview.room}/flooring/${COLLECTIONS[collectionID].rooms[1].flooring}.png`}
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
            />
        </div>
    )
}
