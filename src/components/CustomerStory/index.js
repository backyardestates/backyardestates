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
                <div>
                    <div className={style.customer}>
                        {!hideDetails && (
                            <Image
                                src={`/portraits/customers/${story.portrait}`}
                                alt={`Portrait image of ${story.name}`}
                                width={120}
                                height={120}
                                className={style.portrait}
                            />
                        )}
                        {!hideDetails && (
                            <div className={style.details}>
                                <p className={style.name}>{story.name}</p>
                                <p className={style.location}>
                                    <strong className={style.estate}>
                                        {story.title}
                                    </strong>
                                </p>

                                <p className={style.location}>
                                    {`${story.city}, CA`}
                                </p>

                                <PropertyInformation floorplan={story} />
                            </div>
                        )}
                    </div>
                </div>

                <div className={style.markdown}>{children}</div>
            </div>
            <div className={style.columnRight}>
                <Carousel images={story.images} />
            </div>
        </div>
    )
}
