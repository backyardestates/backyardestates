import { createContext, useState } from 'react'

export const PreviewContext = createContext(null)

import TabBar from '@/components/TabBar'
import Image from 'next/image'
import style from './InclusionsPanel.module.css'
import ImageBar from '@/components/ImageBar'
import Accordion from '@/components/Accordion'

import { ROOMS } from '../../../content/inclusions'
import StandaloneLink from '@/components/StandaloneLink'

export default function InclusionsPanel() {
    const [preview, setPreview] = useState({
        collection: 'light',
        room: 'kitchen',
        isCustom: false,
        kitchenCabinets: 'White',
    })

    const collectionDescriptions = [
        'In this modern aesthetic, soft greys and white elements are combined with offwhite interior paint, resulting in a style that is bold yet subtly so.',
        'This modern blend boasts captivating contrasts between dark and light elements! With dark flooring complementing white cabinetry, black matte hardware, and white countertops adorned with intricate black and dark gray veining, all set against a backdrop of soft off-white interior paint.',
        'Achieve a daring and contemporary aesthetic with navy blue lower cabinets, white upper cabinets, softly speckled offwhite countertops, oak-colored flooring, soft white interior paint, and black matte hardware.',
        'A harmonious array of various shades of gray. From soft gray to rich charcoal tones, this palette offers a sophisticated and versatile backdrop. Together, these layers of grey create a timeless and elegant atmosphere throughout the space, inviting comfort and style in equal measure.',
        'An appealing themed design featuring olive green cabinetry at the base, white cabinetry above, white quartz countertops, brushed nickel hardware, rustic brown flooring, and a soft, creamy off-white interior paint color throughout the house.',
    ]

    let collectionDescription = 0

    switch (preview.collection) {
        case 'light':
            collectionDescription = 0
            break
        case 'dark':
            collectionDescription = 1
            break
        case 'blue':
            collectionDescription = 2
            break
        case 'monochrome':
            collectionDescription = 3
            break
        case 'olive':
            collectionDescription = 4
            break
        default:
            collectionDescription = 0
            break
    }

    let roomIndex = 0

    switch (preview.room) {
        case 'kitchen':
            roomIndex = 0
            break
        case 'bathroom':
            roomIndex = 1
            break
        case 'interior':
            roomIndex = 2
            break
        case 'exterior':
            roomIndex = 3
            break
        case 'construction':
            roomIndex = 4
            break
        default:
            roomIndex = 0
            break
    }

    return (
        <PreviewContext.Provider
            value={{
                preview,
                setPreview,
            }}
        >
            <div className={style.base}>
                <div className={style.interface}>
                    <div className={style.header}>
                        <p className={style.subhead}>
                            Choose your preferred package
                        </p>
                        <TabBar />
                    </div>
                    <div className={style.rooms}>
                        <ImageBar />
                    </div>
                    <div className={style.preview}>
                        <Image
                            src={`/images/preview/${preview.collection}-${preview.room}@2x.png`}
                            width={790}
                            height={790}
                            alt={`Preview of the ${preview.collection} ${preview.room}`}
                            className={style.previewImage}
                        />
                    </div>
                    <div className={style.sidebar}>
                        <Accordion content={ROOMS[roomIndex]} />
                        <div className={style.ctas}>
                            <StandaloneLink
                                theme="beige"
                                href="/standard-inclusions/share-with-a-friend/"
                            >
                                Share with a friend
                            </StandaloneLink>
                        </div>
                    </div>
                    <div className={style.description}>
                        {collectionDescriptions[collectionDescription]}
                    </div>
                </div>
            </div>
        </PreviewContext.Provider>
    )
}
