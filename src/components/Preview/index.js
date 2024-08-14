import { useContext } from 'react'
import { PreviewContext } from '@/panels/InclusionsPanel'

import Image from 'next/image'

import style from './Preview.module.css'

export default function Preview() {
    const { preview, setPreview } = useContext(PreviewContext)

    let collectionIndex = 0
    let roomID = 0

    switch (preview.collection) {
        case 'light':
            collectionIndex = 0
            break
        case 'dark':
            collectionIndex = 1
            break
        case 'blue':
            collectionIndex = 2
            break
        case 'monochrome':
            collectionIndex = 3
            break
        case 'olive':
            collectionIndex = 4
            break
        default:
            collectionIndex = 5
            break
    }

    switch (preview.room) {
        case 'kitchen':
            roomID = 0
            break
        case 'bathroom':
            roomID = 1
            break
        default:
            roomID = 0
            break
    }

    const collections = [
        {
            name: 'light',
            rooms: [
                {
                    name: 'kitchen',
                    flooring: 'oyster',
                    cabinet: 'light',
                    countertop: 'fairy-white',
                    hardware: 'brushed-nickel',
                },
                {
                    name: 'bathroom',
                    flooring: 'oyster',
                    cabinet: 'light',
                    countertop: 'fairy-white',
                    hardware: 'brushed-nickel',
                },
            ],
        },
        {
            name: 'dark',
            rooms: [
                {
                    name: 'kitchen',
                    flooring: 'espresso',
                    cabinet: 'dark',
                    countertop: 'calacatta-vega',
                    hardware: 'black-matte',
                },
                {
                    name: 'bathroom',
                    flooring: 'espresso',
                    cabinet: 'dark',
                    countertop: 'calacatta-vega',
                    hardware: 'black-matte',
                },
            ],
        },
        {
            name: 'blue',
            rooms: [
                {
                    name: 'kitchen',
                    flooring: 'malibu',
                    cabinet: 'blue',
                    countertop: 'galant-gray',
                    hardware: 'black-matte',
                },
                {
                    name: 'bathroom',
                    flooring: 'malibu',
                    cabinet: 'blue',
                    countertop: 'galant-gray',
                    hardware: 'black-matte',
                },
            ],
        },
        {
            name: 'monochrome',
            rooms: [
                {
                    name: 'kitchen',
                    flooring: 'gentry',
                    cabinet: 'monochrome',
                    countertop: 'calacatta-miraggio-gold',
                    hardware: 'brushed-nickel',
                },
                {
                    name: 'bathroom',
                    flooring: 'gentry',
                    cabinet: 'monochrome',
                    countertop: 'calacatta-miraggio-gold',
                    hardware: 'brushed-nickel',
                },
            ],
        },
        {
            name: 'olive',
            rooms: [
                {
                    name: 'kitchen',
                    flooring: 'fox-and-hound',
                    cabinet: 'olive',
                    countertop: 'pure-white',
                    hardware: 'brushed-nickel',
                },
                {
                    name: 'bathroom',
                    flooring: 'fox-and-hound',
                    cabinet: 'olive',
                    countertop: 'pure-white',
                    hardware: 'brushed-nickel',
                },
            ],
        },
    ]

    return (
        <div className={style.base}>
            {/* <p>{`${preview.collection}-${preview.room}`}</p> */}
            {/* countertop */}
            <Image
                src={`/images/inclusions/${preview.room}/hardware/${collections[collectionIndex].rooms[roomID].hardware}.png`}
                width={790}
                height={527}
                alt={`Preview of the ${preview.collection} ${preview.room}`}
                className={style.imageHardware}
            />
            {/* countertop */}
            <Image
                src={`/images/inclusions/${preview.room}/countertop/${collections[collectionIndex].rooms[roomID].countertop}.png`}
                width={790}
                height={527}
                alt={`Preview of the ${preview.collection} ${preview.room}`}
                className={style.imageCountertop}
            />
            {/* cabinets */}
            <Image
                src={`/images/inclusions/${preview.room}/cabinet/${collections[collectionIndex].rooms[roomID].cabinet}.png`}
                width={790}
                height={527}
                alt={`Preview of the ${preview.collection} ${preview.room}`}
                className={style.imageCabinets}
            />

            {preview.room === 'bathroom' && (
                <Image
                    src={`/images/inclusions/${preview.room}/tub/${collections[collectionIndex].rooms[roomID].hardware}.png`}
                    width={790}
                    height={527}
                    alt={`Preview of the ${preview.collection} ${preview.room}`}
                    className={style.imageCabinets}
                />
            )}

            {/* flooring */}
            <Image
                src={`/images/inclusions/${preview.room}/flooring/${collections[collectionIndex].rooms[roomID].flooring}.png`}
                width={790}
                height={527}
                alt={`Preview of the ${preview.collection} ${preview.room}`}
                className={style.imageFlooring}
            />
        </div>
    )
}
