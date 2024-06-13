import { useState, useContext } from 'react'
import { PreviewContext } from '@/panels/InclusionsPanel'

import TabBarButton from '../TabBarButton'
import style from './TabBar.module.css'

export default function TabBar() {
    // const [collection, setCollection] = useState('light')

    // function handleClick(rm) {
    //     setCollection(rm)
    // }

    const { preview, setPreview } = useContext(PreviewContext)

    return (
        <ul className={style.base}>
            <li>
                <TabBarButton value="light">Contemporary light</TabBarButton>
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
        </ul>
    )
}
