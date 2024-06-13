import { createContext, useState } from 'react'

export const PreviewContext = createContext(null)

import TabBar from '@/components/TabBar'
import Image from 'next/image'
import style from './InclusionsPanel.module.css'
import ImageBar from '@/components/ImageBar'
import Accordion from '@/components/Accordion'
import AccordionPanel from '@/components/AccordionPanel'

export default function InclusionsPanel() {
    const [preview, setPreview] = useState({
        collection: 'light',
        room: 'kitchen',
    })

    const kitchen = [
        {
            header: 'Cabinets',
            text: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.',
        },
        {
            header: 'Counter tops',
            text: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.',
        },
        {
            header: 'Appliances',
            text: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.',
        },
    ]

    const bathroom = [
        {
            header: 'Shower',
            text: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.',
        },
        {
            header: 'Shower head',
            text: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.',
        },
    ]

    const features = preview.room === 'kitchen' ? kitchen : bathroom

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
                            alt="Picture of the author"
                            className={style.previewImage}
                        />
                    </div>
                    <div className={style.sidebar}>
                        <Accordion>
                            {features.map((feature, index) => (
                                <AccordionPanel
                                    label={feature.header}
                                    key={index}
                                >
                                    <p>{feature.text}</p>
                                </AccordionPanel>
                            ))}
                        </Accordion>
                    </div>
                    <div className={style.description}>
                        This contemporary look combines muted grays with white
                        accents, enhanced by a light off-white interior paint.
                        The result is a bold yet understated style.
                    </div>
                </div>
            </div>
        </PreviewContext.Provider>
    )
}
