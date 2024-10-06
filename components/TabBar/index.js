import { useState, useContext } from 'react'
import { PreviewContext } from '@/components/InclusionsPanel'
import { PreviewHomeContext } from '@/components/InclusionsHomePanel'

import TabBarButton from '@/components/TabBarButton'
import style from './TabBar.module.css'

import { usePathname } from 'next/navigation'

export default function TabBar() {
    const pathname = usePathname()
    const context = pathname === '/' ? PreviewHomeContext : PreviewContext

    const { preview, setPreview } = useContext(context)

    return (
        <>
            <ul className={style.base}>
                <li>
                    <TabBarButton value="light">
                        Contemporary light
                    </TabBarButton>
                </li>
                <li>
                    <TabBarButton value="dark">Contemporary dark</TabBarButton>
                </li>
                <li>
                    <TabBarButton value="blue">Modern blue</TabBarButton>
                </li>
                <li>
                    <TabBarButton value="monochrome">
                        Modern monochrome
                    </TabBarButton>
                </li>
                <li>
                    <TabBarButton value="olive">Urban olive</TabBarButton>
                </li>
                {preview.isCustom && (
                    <li>
                        <TabBarButton value="custom">
                            Custom package
                        </TabBarButton>
                    </li>
                )}
            </ul>
        </>
    )
}
