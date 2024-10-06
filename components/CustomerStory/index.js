'use client'

import style from './CustomerStory.module.css'
import Carousel from '../Carousel'

export default function CustomerStory({
    story,
    hideDetails = false,
    children,
}) {
    return (
        <div className={style.base}>
            <div className={style.columnLeft}>{children}</div>
            <div className={style.columnRight}>
                <Carousel images={story.images} />
            </div>
        </div>
    )
}
