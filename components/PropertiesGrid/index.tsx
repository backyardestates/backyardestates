'use client'

import { useState } from 'react'

import ButtonTags from '../ButtonTags'
import Card from '../Card'

import style from './PropertiesGrid.module.css'

export default function PropertiesGrid({ properties }) {
    const [selected, setSelected] = useState(99)
    const bedroomCounts = [
        { id: 0, title: 'Studio' },
        { id: 1, title: '1 bedroom' },
        { id: 2, title: '2 bedrooms' },
        { id: 3, title: '3 bedrooms' },
    ]

    let filteredProperties = []

    if (selected !== 99) {
        filteredProperties = properties.filter(
            (property) => property.bed === selected
        )
    } else {
        filteredProperties = properties
    }

    return (
        <>
            <ButtonTags
                tags={bedroomCounts}
                selectedID={selected}
                setSelected={setSelected}
                showAll={true}
            />
            <ul className={style.cards}>
                {filteredProperties.map((property, index) => (
                    <li key={index}>
                        <Card estate={property} />
                    </li>
                ))}
            </ul>
        </>
    )
}
