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
                <TabBarButton
                    // handler={handleClick}
                    value="light"
                    // collection={collection}
                >
                    Contemporary light
                </TabBarButton>
            </li>
            <li>
                <TabBarButton
                    // handler={handleClick}
                    value="dark"
                    // collection={collection}
                >
                    Contemporary dark
                </TabBarButton>
            </li>
        </ul>
    )
}
