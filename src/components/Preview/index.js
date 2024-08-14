import { useContext } from 'react'
import { PreviewContext } from '@/panels/InclusionsPanel'

import style from './Preview.module.css'
import PreviewKitchen from '../PreviewKitchen'
import PreviewBedroom from '../PreviewBedroom'
import PreviewBathroom from '../PreviewBathroom'
import PreviewInterior from '../PreviewInterior'

export default function Preview() {
    const { preview, setPreview } = useContext(PreviewContext)

    let collectionIndex = 0
    let roomID = 0

    switch (preview.collection) {
        case 'light':
            collectionIndex = 0
            break
        case 'dark':
            collectionIndex = 1
            break
        case 'blue':
            collectionIndex = 2
            break
        case 'monochrome':
            collectionIndex = 3
            break
        case 'olive':
            collectionIndex = 4
            break
        default:
            collectionIndex = 5
            break
    }

    switch (preview.room) {
        case 'kitchen':
            roomID = 0
            break
        case 'bathroom':
            roomID = 1
            break
        case 'interior':
            roomID = 2
            break
        default:
            roomID = 0
            break
    }

    return (
        <div className={style.base}>
            {preview.room === 'kitchen' && <PreviewKitchen />}
            {preview.room === 'living' && <PreviewInterior />}
            {preview.room === 'bedroom' && <PreviewBedroom />}
            {preview.room === 'bathroom' && <PreviewBathroom />}
        </div>
    )
}
