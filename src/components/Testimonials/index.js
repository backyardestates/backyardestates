import Testimonial from '@/components/Testimonial'
import style from './Testimonials.module.css'

export default function Testimonials() {
    return (
        <div className={style.base}>
            <h2>Trusted by Californian homeowners</h2>
            <p className="small-caps">greater los angeles area</p>
            <div className={style.carousel}>
                <Testimonial
                    name="Name"
                    location="Rancho Cucamonga, CA"
                    floorplan="Estate 800"
                >
                    I don&rsquo;t feel like we are customers; I feel like
                    Backyard Estates is taking a vested interest in our family
                </Testimonial>
                <Testimonial
                    name="Name"
                    location="Diamond Bar, CA"
                    floorplan="Estate 500"
                >
                    Backyard Estates had it all planned out&hellip;everything
                    has fallen into place
                </Testimonial>
            </div>
        </div>
    )
}
