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

    return (
        <div
            href="#"
            className={`${style.base} ${
                preview.collection === value ? style.selected : ''
            }`}
            onClick={() => {
                // console.log(preview)
                setPreview({
                    collectionID: id,
                    collection: value,
                    room: preview.room,
                    isCustom: false,
                    kitchenCabinets: COLLECTIONS[id].rooms[0].cabinet,
                })
            }}
        >
            {children}
        </div>
    )
}
