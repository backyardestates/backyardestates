import { useContext } from 'react'
import { PreviewContext } from '@/panels/InclusionsPanel'

import style from './TabBarButton.module.css'

export default function TabBarButton({ children, handler, collection, value }) {
    const { preview, setPreview } = useContext(PreviewContext)
    return (
        <div
            href="#"
            className={`${style.base} ${
                preview.collection === value ? style.selected : ''
            }`}
            onClick={() => {
                setPreview({ collection: value, room: preview.room })
            }}
        >
            {children}
        </div>
    )
}
