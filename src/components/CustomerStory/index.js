import Image from 'next/image'
import style from './CustomerStory.module.css'
import Divider from '@/components/Divider'
import StandaloneLink from '../StandaloneLink'
import Carousel from '../Carousel'
import PropertyInformation from '../PropertyInformation'

export default function CustomerStory({ story, children }) {
    // const portrait =
    //     story.portrait !== null ? story.portrait : 'portrait-fpo.png'
    // const name = story.name !== null ? story.name : 'Name'
    // const title =
    //     story.title !== null ? story.title : 'portrait-fpo.png'
    // const city = story.city !== null ? story.city : 'portrait-fpo.png''
    // const bath = 1
    // const sqft = 350
    return (
        <div className={style.base}>
            <div className={style.columnLeft}>
                <div>
                    <div className={style.customer}>
                        <Image
                            src={`/portraits/customers/${story.portrait}`}
                            alt={`Portrait image of ${story.name}`}
                            width={120}
                            height={120}
                            className={style.portrait}
                        />
                        <div className={style.details}>
                            <p className={style.name}>{story.name}</p>
                            <p className={style.location}>
                                <strong className={style.estate}>
                                    {story.title}
                                </strong>
                                <br />
                                {`${story.city}, CA`}
                            </p>
                            <PropertyInformation floorplan={story} />
                        </div>
                    </div>
                </div>

                <div className={style.markdown}>{children}</div>
            </div>
            <div className={style.columnRight}>
                <Carousel />
            </div>
        </div>
    )
}
