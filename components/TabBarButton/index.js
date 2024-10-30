import { useContext, useEffect } from 'react'
import { PreviewContext } from '@/components/InclusionsPanel'
import { PreviewHomeContext } from '@/components/InclusionsHomePanel'

import style from './TabBarButton.module.css'

import { usePathname } from 'next/navigation'
import { COLLECTIONS } from '@/content/inclusions'
export default function TabBarButton({ id, children, value }) {
    const pathname = usePathname()
    const context = pathname === '/' ? PreviewHomeContext : PreviewContext

    const { preview, setPreview } = useContext(context)

    const updatePreview = (changes) => {
        setPreview({ ...preview, ...changes })
    }

    return (
        <div
            href="#"
            className={`${style.base} ${
                preview.collection === value ? style.selected : ''
            }`}
            onClick={() => {
                updatePreview({
                    collectionID: id,
                    collection: value,
                    roomID: preview.roomID,
                    room: preview.room,
                    isCustom: false,
                    kitchenCabinets: COLLECTIONS[id].rooms[0].cabinet,
                    bathroomCabinets: COLLECTIONS[id].rooms[3].cabinet,
                })
            }}
        >
            {children}
        </div>
    )
}
