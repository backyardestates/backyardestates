import { useContext } from 'react'

import Image from 'next/image'

import { PreviewContext } from '@/panels/InclusionsPanel'
import { COLLECTIONS } from '../../../content/inclusions'
import style from '../Preview/Preview.module.css'

export default function PreviewBedroom() {
    const { preview } = useContext(PreviewContext)

    const imageWidth = 639
    const imageHeight = 426

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
                src={`/images/inclusions/${preview.room}/hardware/${COLLECTIONS[collectionID].rooms[3].hardware}.png`}
                width={imageWidth}
                height={imageHeight}
                alt={`Preview of the ${preview.collection} ${preview.room}`}
                className={style.imageHardware}
            />
            <Image
                src={`/images/inclusions/${preview.room}/flooring/${COLLECTIONS[collectionID].rooms[3].flooring}.png`}
                width={imageWidth}
                height={imageHeight}
                alt={`Preview of the ${preview.collection} ${preview.room}`}
                className={style.imageFlooring}
            />
            <Image
                src={`/images/inclusions/${preview.room}/background.jpg`}
                width={imageWidth}
                height={imageHeight}
                alt={`Preview of the ${preview.collection} ${preview.room}`}
                className={style.imageBackground}
            />
        </div>
    )
}
