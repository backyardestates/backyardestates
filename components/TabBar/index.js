import { useState, useContext } from 'react'
import { PreviewContext } from '@/components/InclusionsPanel'
import { PreviewHomeContext } from '@/components/InclusionsHomePanel'

import TabBarButton from '@/components/TabBarButton'
import style from './TabBar.module.css'

import { usePathname } from 'next/navigation'

export default function TabBar() {
    const pathname = usePathname()
    const context = pathname === '/' ? PreviewHomeContext : PreviewContext

    const { preview } = useContext(context)

    const collections = [
        { id: 0, name: 'Contemporary light', value: 'light' },
        { id: 1, name: 'Contemporary dark', value: 'dark' },
        { id: 2, name: 'Modern blue', value: 'blue' },
        { id: 3, name: 'Modern monochrome', value: 'monochrome' },
        { id: 4, name: 'Urban olive', value: 'olive' },
    ]

    return (
        <>
            <ul className={style.base}>
                {collections.map((collection, index) => (
                    <li key={index}>
                        <TabBarButton
                            id={collection.id}
                            value={collection.value}
                        >
                            {collection.name}
                        </TabBarButton>
                    </li>
                ))}
                {preview.isCustom && (
                    <li>
                        <TabBarButton id={99} value="custom">
                            Custom package
                        </TabBarButton>
                    </li>
                )}
            </ul>
        </>
    )
}
