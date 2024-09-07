import Catchall from '@/components/Catchall'
import CustomerStory from '@/components/CustomerStory'
import Footer from '@/components/Footer'
import Nav from '@/components/Nav'
import OpenGraph from '@/components/OpenGraph'
import PropertyInformation from '@/components/PropertyInformation'
import RelatedContent from '@/components/RelatedContent'
import VideoPlayer from '@/components/VideoPlayer'

import style from '../page.module.css'

const story = {
    title: 'Estate 500',
    date: '2023-12-22',
    city: 'Diamond Bar',
    bed: 2,
    bath: 1,
    sqft: 507,
    img: 'estate350-cover.png',
    price: '299,999',
    portrait: 'portrait-01.jpg',
    images: [
        'julie-and-betty-01.jpg',
        'julie-and-betty-02.jpg',
        'julie-and-betty-03.jpg',
        'julie-and-betty-04.jpg',
        'julie-and-betty-05.jpg',
        'julie-and-betty-06.jpg',
        'julie-and-betty-07.jpg',
        'julie-and-betty-08.jpg',
        'julie-and-betty-09.jpg',
    ],
    related: ['450-000', '750-000', '751-000', '950-000'],
    ogImage: 'backyard-estates-OG.png',
}

export default async function JulieAndBetty() {
    return (
        <>
            <OpenGraph
                title={`Backyard Estates - Julie and Betty's customer story`}
            />
            <Nav />
            <main className={style.base}>
                <div className={style.content}>
                    <h1>Julie and Betty</h1>
                    <p className={style.intro}>
                        Julie and Betty set themselves up for retirement with an
                        ADU.
                    </p>
                    <h2>Estate 500</h2>
                    <PropertyInformation floorplan={story} />
                    <VideoPlayer wistiaID="9lrx8heqgt" />
                </div>
                <CustomerStory story={story}>
                    <blockquote>
                        <p>
                            &ldquo;Backyard Estates had it all planned out…
                            everything has fallen into place. It was easy… so
                            easy.&rdquo;
                        </p>
                    </blockquote>
                    <p>
                        Meet Julie and Betty, a healthcare power couple who
                        secured their retirement with an ADU investment! Take
                        their lead, lock in your monthly payment today to avoid
                        rising construction costs and take advantage of
                        increasing rents!
                    </p>
                    <p>
                        Julie and Betty had a kitchen remodel that took over a
                        year. Backyard Estates built an entire home in the
                        backyard in just 12 weeks!
                    </p>
                    <blockquote>
                        <p>
                            &ldquo;We highly recommend Backyard Estates.&rdquo;
                        </p>
                    </blockquote>
                </CustomerStory>
                <RelatedContent properties={[1, 2]} />
                <Catchall />
            </main>
            <Footer />
        </>
    )
}
