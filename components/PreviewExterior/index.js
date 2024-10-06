import { useContext } from 'react'
import { PreviewContext } from '@/components/InclusionsPanel'
import Image from 'next/image'

import style from '../Preview/Preview.module.css'

export default function PreviewKitchen() {
    const { preview, setPreview } = useContext(PreviewContext)

    const imageWidth = 640
    const imageHeight = 426

    return (
        <div className={style.base}>
            <Image
                src={`/images/inclusions/exterior.jpg`}
                alt={`Preview of the ADU exterior features`}
                className={style.imageBackground}
                fill
                priority
            />
        </div>
    )
}
