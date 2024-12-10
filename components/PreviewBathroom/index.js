import Image from 'next/image'
import { COLLECTIONS } from '@/content/inclusions'

import style from '../Preview/Preview.module.css'

export default function PreviewBathroom({ preview }) {
    return (
        <div className={style.base}>
            <Image
                src={`/images/inclusions/${preview.room}/hardware/${
                    COLLECTIONS[preview.collectionID].rooms[preview.roomID]
                        .hardware
                }.png`}
                alt={`Preview of the ${preview.collection} ${preview.room}`}
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
                src={`/images/inclusions/${preview.room}/cabinet/${preview.bathroomCabinets}.png`}
                alt={`Preview of the ${preview.collection} ${preview.room}`}
                className={style.imageCabinets}
                fill
                priority
            />
            <Image
                src={`/images/inclusions/${preview.room}/tub/${
                    COLLECTIONS[preview.collectionID].rooms[preview.roomID]
                        .hardware
                }.png`}
                alt={`Preview of the ${preview.collection} ${preview.room}`}
                className={style.imageHardware}
                fill
                priority
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
            />
        </div>
    )
}
