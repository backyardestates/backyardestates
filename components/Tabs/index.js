'use client'

import React, { useState } from 'react'

import Tab from '@/components/Tab'
import TabPanel from '@/components/TabPanel'
import Feature from '@/components/Feature'

import style from './Tabs.module.css'

export default function Tabs({ tabs }) {
    const [selectedTab, setSelectedTab] = useState(0)

    // console.log(tabs[selectedTab])

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
                        handler={handleClick}
                        isSelected={selectedTab === index ? true : false}
                    >
                        {tab.title}
                    </Tab>
                ))}
            </div>
            <div className={style.tabContent}>
                <TabPanel>
                    {tabs[selectedTab].features.map((feature, index) => (
                        <Feature key={index} content={feature} />
                    ))}
                </TabPanel>
            </div>
        </div>
    )
}
