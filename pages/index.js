import Testimonial from '@/components/Testimonial'
import Layout from '../src/layouts/Homepage'
import Testimonials from '@/components/Testimonials'
import Properties from '@/components/Properties'
import WhyChoose from '@/components/WhyChoose'

export default function Home() {
    return (
        <Layout>
            <Testimonials />
            <Properties />
            <WhyChoose />
        </Layout>
    )
}
