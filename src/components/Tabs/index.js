import React, { useState } from 'react'
import Tab from '@/components/Tab'
import style from './Tabs.module.css'
import TabPanel from '../TabPanel'

export default function Tabs({ tabs, children }) {
    const [selectedTab, setSelectedTab] = useState(0)

    function handleClick(index) {
        setSelectedTab(index)
    }

    return (
        <div className={style.base}>
            <div className={style.tabs}>
                {tabs.map((tab, index) => (
                    <Tab
                        key={index}
                        index={index}
                        isSelected={index === selectedTab ? true : false}
                        handler={handleClick}
                    >
                        {tab}
                    </Tab>
                ))}
            </div>
            <div className={style.tabContent}>
                {children.map((child, index) => {
                    if (selectedTab === index)
                        return (
                            <TabPanel key={index}>
                                {child.props.children}
                            </TabPanel>
                        )
                })}
            </div>
        </div>
    )
}
