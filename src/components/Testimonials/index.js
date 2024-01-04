import Testimonial from '@/components/Testimonial'
import style from './Testimonials.module.css'

export default function Testimonials() {
    return (
        <div className={style.base}>
            <h2>Trusted by Californian homeowners</h2>
            <p className="small-caps">greater los angeles area</p>
            <div className={style.carousel}>
                <Testimonial
                    name="Vanessa and Gabriel"
                    portrait="portrait-02.jpg"
                    location="Rancho Cucamonga, CA"
                    floorplan="Estate 800"
                >
                    I feel like Backyard Estates is taking a vested interest in
                    our family
                </Testimonial>
                <Testimonial
                    name="Julie and Betty"
                    portrait="portrait-01.jpg"
                    location="Diamond Bar, CA"
                    floorplan="Estate 500"
                >
                    Everything has fallen into place. It was easy&hellip; so
                    easy
                </Testimonial>
            </div>
        </div>
    )
}
