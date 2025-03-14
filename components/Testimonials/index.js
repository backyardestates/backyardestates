import { sanityFetch } from '@/sanity/live'

import TestimonialsCarousel from '@/components/TestimonialsCarousel'
import style from './Testimonials.module.css'

const STORIES_QUERY = `*[_type == "story" && featured]|order(publishedAt desc){names,portrait,property->{location,floorplan->{name}},slug,quote}`

export default async function Testimonials() {
    const { data: stories } = await sanityFetch({ query: STORIES_QUERY })

    return (
        <div className={style.base}>
            <h2>Trusted by Californian homeowners</h2>
            <p className="small-caps">greater los angeles area</p>
            <div className={style.container}>
                <TestimonialsCarousel testimonials={stories} />
            </div>
        </div>
    )
}
