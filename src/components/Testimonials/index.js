import Testimonial from '@/components/Testimonial'
// import Layout from '../src/layouts/Homepage'
import style from './Testimonials.module.css'

export default function Testimonials() {
    return (
        <div className={style.root}>
            <h2>Trusted by Californian homeowners</h2>
            <p className="small-caps">greater los angeles area</p>
            <div className={style.carousel}>
                <Testimonial name="Kyle and Joy" location="Arcadia, CA">
                    We were looking for ways to invest our money. My wife
                    thought, why do not we build an ADU for rental income?
                </Testimonial>
                <Testimonial name="Tamara" location="Los Angeles, CA">
                    We were looking for ways to invest our money. My wife
                    thought, why do not we build an ADU for rental income?
                </Testimonial>
            </div>
        </div>
    )
}
