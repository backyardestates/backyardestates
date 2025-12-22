'use client'

import { useState } from 'react'

import ButtonTags from '../ButtonTags'
import PropertyCard from '../PropertyCard'

import style from './PropertiesGrid.module.css'
import { NormalizedProperty } from '@/lib/normalizedProperty'

interface Props {
    properties: NormalizedProperty[]
}

export default function PropertiesGrid({ properties }: Props) {
    const [selected, setSelected] = useState(99)
    const bedroomCounts = [
        { id: 0, title: 'Studio' },
        { id: 1, title: '1 bedroom' },
        { id: 2, title: '2 bedrooms' },
        { id: 3, title: '3 bedrooms' },
    ]

    let filteredProperties: NormalizedProperty[] = []

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
                        <PropertyCard content={property} />
                    </li>
                ))}
            </ul>
        </>
    )
}
