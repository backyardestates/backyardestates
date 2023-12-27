import Image from 'next/image'
import style from './CustomerStory.module.css'
import Divider from '@/components/Divider'
import StandaloneLink from '../StandaloneLink'
import Carousel from '../Carousel'
import PropertyInformation from '../PropertyInformation'

export default function CustomerStory({
    story,
    hideDetails = false,
    children,
}) {
    return (
        <div className={style.base}>
            <div className={style.columnLeft}>
                <div className={style.markdown}>{children}</div>
            </div>
            <div className={style.columnRight}>
                <Carousel images={story.images} />
            </div>
        </div>
    )
}
