import { useContext } from 'react'
import { PreviewContext } from '@/components/InclusionsPanel'

import style from './Preview.module.css'
import PreviewKitchen from '../PreviewKitchen'
import PreviewBedroom from '../PreviewBedroom'
import PreviewBathroom from '../PreviewBathroom'
import PreviewInterior from '../PreviewInterior'
import PreviewExterior from '../PreviewExterior'
import PreviewConstruction from '../PreviewConstruction'

export default function Preview() {
    const { preview } = useContext(PreviewContext)

    return (
        <div className={style.base}>
            {preview.roomID === 0 && <PreviewKitchen preview={preview} />}
            {preview.roomID === 1 && <PreviewInterior />}
            {preview.roomID === 2 && <PreviewBedroom />}
            {preview.roomID === 3 && <PreviewBathroom preview={preview} />}
            {preview.roomID === 4 && <PreviewExterior />}
            {preview.roomID === 5 && <PreviewConstruction />}
        </div>
    )
}
