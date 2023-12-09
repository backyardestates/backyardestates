import Layout from '../src/layouts/Homepage'
import Testimonials from '@/components/Testimonials'
import Properties from '@/components/Properties'
import Benefits from '@/components/Benefits'
import style from './Homepage.module.css'

export default function Home() {
    return (
        <Layout>
            <Testimonials />
            <Properties />
            <Benefits />
            <div className={style.content}>Process placeholder</div>
            <div className={style.content}>
                Explore our floorplans placeholder
            </div>
        </Layout>
    )
}
