'use client'

import { PortableText } from 'next-sanity'

import Carousel from '../Carousel'

import style from './CustomerStory.module.css'

export default function CustomerStory({ story }) {
    return (
        <div className={style.base}>
            <div className={style.columnLeft}>
                <PortableText value={story.body} />
            </div>
            {story.images?.length > 0 && (
                <div className={style.columnRight}>
                    <Carousel content={story.images} />
                </div>
            )}
        </div>
    )
}
