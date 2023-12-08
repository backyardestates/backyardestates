import Testimonial from '@/components/Testimonial'
import Layout from '../src/layouts/Homepage'
import Testimonials from '@/components/Testimonials'
import Properties from '@/components/Properties'
import WhyChoose from '@/components/WhyChoose'
import style from './Homepage.module.css'

export default function Home() {
    return (
        <Layout>
            <Testimonials />
            <Properties />
            <WhyChoose />
            <div className={style.content}>Process placeholder</div>
            <div className={style.content}>
                Explore our floorplans placeholder
            </div>
        </Layout>
    )
}
