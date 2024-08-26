import { useContext } from 'react'
import { PreviewContext } from '@/panels/InclusionsPanel'

import Image from 'next/image'
import { COLLECTIONS } from '../../../content/inclusions'

import style from '../Preview/Preview.module.css'

export default function PreviewKitchen() {
    const { preview, setPreview } = useContext(PreviewContext)

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
                src={`/images/inclusions/${preview.room}/hardware/${COLLECTIONS[collectionID].rooms[0].hardware}.png`}
                width={imageWidth}
                height={imageHeight}
                alt={`Preview of the ${preview.collection} ${preview.room}`}
                className={style.imageHardware}
            />
            <Image
                src={`/images/inclusions/${preview.room}/countertop/${COLLECTIONS[collectionID].rooms[0].countertop}.png`}
                width={imageWidth}
                height={imageHeight}
                alt={`Preview of the ${preview.collection} ${preview.room}`}
                className={style.imageCountertop}
            />
            <Image
                src={`/images/inclusions/${preview.room}/cabinet/${COLLECTIONS[collectionID].rooms[0].cabinet}.png`}
                width={imageWidth}
                height={imageHeight}
                alt={`Preview of the ${preview.collection} ${preview.room}`}
                className={style.imageCabinets}
            />
            <Image
                src={`/images/inclusions/${preview.room}/flooring/${COLLECTIONS[collectionID].rooms[0].flooring}.png`}
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
