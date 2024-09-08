import type { Metadata } from 'next'

import Catchall from '@/components/Catchall'
import CustomerStory from '@/components/CustomerStory'
import Footer from '@/components/Footer'
import Nav from '@/components/Nav'
// import OpenGraph from '@/components/OpenGraph'
import PropertyInformation from '@/components/PropertyInformation'
import VideoPlayer from '@/components/VideoPlayer'
import RelatedContent from '@/components/RelatedContent'

import style from '../page.module.css'

const story = {
    title: 'Estate 800',
    date: '2023-12-22',
    city: 'Rancho Cucamonga',
    bed: 2,
    bath: 2,
    sqft: 800,
    img: 'estate350-cover.png',
    price: '299,999',
    portrait: 'portrait-02.jpg',
    images: [
        'vanessa-and-gabriel-01.jpg',
        'vanessa-and-gabriel-02.jpg',
        'vanessa-and-gabriel-03.jpg',
        'vanessa-and-gabriel-04.jpg',
        'vanessa-and-gabriel-05.jpg',
        'vanessa-and-gabriel-06.jpg',
        'vanessa-and-gabriel-07.jpg',
    ],
    related: ['750-000', '751-000', '950-000', '1200-000'],
    ogImage: 'backyard-estates-OG.png',
}

export const metadata: Metadata = {
    title: "Vanessa and Gabriel's customer story - Backyard Estates",
    description:
        "Gabriel and Vanessa, teamed up with Gabriel's parents, Grandma and Grandpa, to make a strategic move that benefited everyone involved. Seeking closer proximity to their grandchildren, Gabriel's parents sold their home and, along with Gabriel and Vanessa, purchased a new property in their ideal neighborhood. The plan? Build an ADU to maintain independence for Grandma and Grandpa, while creating a larger support system for the growing family.",
}

export default async function VanessaAndGabriel() {
    return (
        <>
            {/* <OpenGraph
                title={`Backyard Estates - Vanessa and Gabriel's customer story`}
            /> */}
            <Nav />
            <main className={style.base}>
                <div className={style.content}>
                    <h1>Vanessa and Gabriel</h1>
                    <p className={style.intro}>
                        Bringing family close, maintaining privacy, and building
                        intergenerational wealth.
                    </p>
                    <h2>Estate 800</h2>
                    <PropertyInformation floorplan={story} />
                    <VideoPlayer wistiaID="8qm3203jcf" />
                </div>
                <CustomerStory story={story}>
                    <blockquote>
                        <p>
                            &ldquo;I don&apos;t feel like we are customers; I
                            feel like Backyard Estates is taking a vested
                            interest in our family.&rdquo;
                        </p>
                    </blockquote>
                    <p>
                        Gabriel and Vanessa, teamed up with Gabriel&apos;s
                        parents, Grandma and Grandpa, to make a strategic move
                        that benefited everyone involved. Seeking closer
                        proximity to their grandchildren, Gabriel&apos;s parents
                        sold their home and, along with Gabriel and Vanessa,
                        purchased a new property in their ideal neighborhood.
                        The plan? Build an ADU to maintain independence for
                        Grandma and Grandpa, while creating a larger support
                        system for the growing family.
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
