'use client'

import { createContext, useState } from 'react'

export const PreviewContext = createContext(null)

import TabBar from '@/components/TabBar'
import style from './InclusionsPanel.module.css'
import ImageBar from '@/components/ImageBar'
import Accordion from '@/components/Accordion'
import AccordionBathroom from '@/components/AccordionBathroom'

import { ROOMS } from '../../content/inclusions'
import StandaloneLink from '@/components/StandaloneLink'
import Preview from '@/components/Preview'

export default function InclusionsPanel() {
    const [preview, setPreview] = useState({
        collectionID: 0,
        collection: 'light',
        roomID: 0,
        room: 'kitchen',
        isCustom: false,
        kitchenCabinets: 'light',
        bathroomCabinets: 'light',
    })

    const collectionDescriptions = [
        'In this modern aesthetic, soft greys and white elements are combined with offwhite interior paint, resulting in a style that is bold yet subtly so.',
        'This modern blend boasts captivating contrasts between dark and light elements! With dark flooring complementing white cabinetry, black matte hardware, and white countertops adorned with intricate black and dark gray veining, all set against a backdrop of soft off-white interior paint.',
        'Achieve a daring and contemporary aesthetic with navy blue lower cabinets, white upper cabinets, softly speckled offwhite countertops, oak-colored flooring, soft white interior paint, and black matte hardware.',
        'A harmonious array of various shades of gray. From soft gray to rich charcoal tones, this palette offers a sophisticated and versatile backdrop. Together, these layers of grey create a timeless and elegant atmosphere throughout the space, inviting comfort and style in equal measure.',
        'An appealing themed design featuring olive green cabinetry at the base, white cabinetry above, white quartz countertops, brushed nickel hardware, rustic brown flooring, and a soft, creamy off-white interior paint color throughout the house.',
    ]

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
                    <div className={style.previewContainer}>
                        <div className={style.preview}>
                            <Preview />
                        </div>
                        <p className={style.description}>
                            {collectionDescriptions[preview.collectionID]}
                        </p>
                    </div>

                    <div className={style.sidebar}>
                        <div className={style.sidebarTop}>
                            {preview.roomID === 0 && (
                                <Accordion content={ROOMS[preview.roomID]} />
                            )}
                            {preview.roomID === 1 && (
                                <Accordion content={ROOMS[preview.roomID]} />
                            )}
                            {preview.roomID === 2 && (
                                <Accordion content={ROOMS[preview.roomID]} />
                            )}
                            {preview.roomID === 3 && (
                                <AccordionBathroom
                                    content={ROOMS[preview.roomID]}
                                />
                            )}
                            {preview.roomID === 4 && (
                                <Accordion content={ROOMS[preview.roomID]} />
                            )}
                            {preview.roomID === 5 && (
                                <Accordion content={ROOMS[preview.roomID]} />
                            )}
                        </div>
                        <StandaloneLink
                            href={`/standard-inclusions/share-with-a-friend?package=${preview.collection}`}
                            theme="beige"
                        >
                            Share with a friend
                        </StandaloneLink>
                    </div>
                </div>
            </div>
        </PreviewContext.Provider>
    )
}
