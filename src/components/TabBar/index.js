import { useState } from 'react'

import TabBarButton from '../TabBarButton'
import style from './TabBar.module.css'

export default function TabBar() {
    const [collection, setCollection] = useState('light')

    function handleClick(rm) {
        setCollection(rm)
    }

    return (
        <ul className={style.base}>
            <li>
                <TabBarButton
                    handler={handleClick}
                    value="light"
                    collection={collection}
                >
                    Contemporary light
                </TabBarButton>
            </li>
            <li>
                <TabBarButton
                    handler={handleClick}
                    value="dark"
                    collection={collection}
                >
                    Contemporary dark
                </TabBarButton>
            </li>
            <li>
                <TabBarButton
                    handler={handleClick}
                    value="blue"
                    collection={collection}
                >
                    Modern Blue
                </TabBarButton>
            </li>
            <li>
                <TabBarButton
                    handler={handleClick}
                    value="monochrome"
                    collection={collection}
                >
                    Modern monochrome
                </TabBarButton>
            </li>
            <li>
                <TabBarButton
                    handler={handleClick}
                    value="olive"
                    collection={collection}
                >
                    Urban olive
                </TabBarButton>
            </li>
        </ul>
    )
}
