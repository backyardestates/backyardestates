import Layout from '../src/layouts/Homepage'
import Testimonials from '@/components/Testimonials'
import Properties from '@/components/Properties'
import Benefits from '@/components/Benefits'
import style from './Homepage.module.css'
import Process from '@/components/Process'

export default function Home() {
    return (
        <Layout>
            <Testimonials />
            <Properties />
            <Benefits />
            <Process />
            <div className={style.content}>
                Explore our floorplans placeholder
            </div>
        </Layout>
    )
}
