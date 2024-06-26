import { createContext, useState } from 'react'

export const PreviewHomeContext = createContext(null)

import TabBar from '@/components/TabBar'
import Image from 'next/image'
import style from './InclusionsHomePanel.module.css'

export default function InclusionsHomePanel() {
    const [preview, setPreview] = useState({
        collection: 'light',
    })

    return (
        <PreviewHomeContext.Provider
            value={{
                preview,
                setPreview,
            }}
        >
            <div className={style.base}>
                <div className={style.interface}>
                    <div className={style.header}>
                        <TabBar />
                    </div>
                    <div className={style.preview}>
                        <Image
                            src={`/images/preview/${preview.collection}-kitchen@2x.png`}
                            width={480}
                            height={480}
                            alt={`Preview of the ${preview.collection} kitchen`}
                            className={style.previewImage}
                        />
                    </div>
                </div>
            </div>
        </PreviewHomeContext.Provider>
    )
}
