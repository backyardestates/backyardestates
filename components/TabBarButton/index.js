import { useContext } from 'react'
import { PreviewContext } from '@/components/InclusionsPanel'
import { PreviewHomeContext } from '@/components/InclusionsHomePanel'

import style from './TabBarButton.module.css'

import { usePathname } from 'next/navigation'

export default function TabBarButton({ children, handler, collection, value }) {
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
                setPreview({
                    collection: value,
                    room: preview.room,
                    isCustom: false,
                    kitchenCabinets: 'White',
                })
            }}
        >
            {children}
        </div>
    )
}
