// 'use server'

import { sanityFetch } from '@/sanity/live'

const STORIES_QUERY = `*[_type == "story" && featured]|order(publishedAt desc){names,portrait,property->{location,floorplan->{name}},slug,quote}`

import Testimonial from '@/components/Testimonial'
import style from './TestimonialsCarousel.module.css'

export default async function TestimonialsCarousel() {
    const { data: stories } = await sanityFetch({ query: STORIES_QUERY })

    return (
        <div className={style.base}>
            {stories.map((story, index) => (
                <Testimonial story={story} key={index} />
            ))}
        </div>
    )
}
