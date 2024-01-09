import Benefit from '../Benefit'
import StandaloneLink from '../StandaloneLink'
import style from './Benefits.module.css'

export default function Benefits() {
    return (
        <div className={style.base}>
            <div className={style.content}>
                <h2 className={style.subhead}>Why choose Backyard Estates?</h2>
                <p className={style.intro}>
                    From start to finish, we&apos;ve simplified the Accessory
                    Dwelling Unit (ADU) build process. We take care of
                    everything, so you don&apos;t have to worry.
                </p>
            </div>

            <div className={style.benefits}>
                <Benefit
                    position={0}
                    title="Effortless experience"
                    type="process"
                >
                    <p>
                        At Backyard Estates, you choose your pre-designed ADU
                        floorplan and watch your dream become a reality.
                    </p>
                    <StandaloneLink href="/about-us/our-process">
                        View our process
                    </StandaloneLink>
                </Benefit>
                <Benefit
                    position={1}
                    title="Superior quality"
                    type="quality"
                    subtle
                >
                    <p>
                        Each ADU is built to the Backyard Estate standard with
                        high-quality and durable materials that not only enhance
                        its overall value but also ensure long-term utility with
                        minimal maintenace costs. This results in a stunning
                        home, perfect for your family or future tenants.
                    </p>
                    <StandaloneLink href="/gallery">
                        View floor plans
                    </StandaloneLink>
                </Benefit>
                <Benefit
                    position={2}
                    title="Transparent pricing"
                    type="pricing"
                >
                    <p>
                        Enjoy peace of mind with our all-in pricing, covering
                        every aspect of your ADU project: from design and
                        engineering to city fees, pre-development, construction,
                        solar where required, interior finishes, and kitchen
                        appliances. And that&rsquo;s not all - we even take care
                        of utility connections up to 50 feet of dirt, ensuring a
                        seamless and hassle-free experience.
                    </p>
                    <StandaloneLink href="/pricing">
                        View pricing
                    </StandaloneLink>
                </Benefit>
                <Benefit
                    position={3}
                    title="Over 100 years of combined experience"
                    type="team"
                >
                    <p>
                        Our team of experts is comprised of skilled architects,
                        engineers, and developers working alongside dedicated
                        custom home builders and seasoned track home builders,
                        ensuring the perfect blend of precision and creativity
                        to bring your ADU project to life.
                    </p>
                    <StandaloneLink href="/about-us/our-team">
                        View team profiles
                    </StandaloneLink>
                </Benefit>
                <Benefit
                    position={4}
                    title="Swift move-in"
                    type="timeline"
                    subtle
                >
                    <p>
                        Benefit from our streamlined ADU processes—from design
                        and permitting to construction. Homeowners working with
                        Backyard Estates are experiencing move in timelines that
                        are half that of the industry average. We ensure swift
                        progress while maintaining a commitment to constructing
                        enduring, quality homes for generations to come.
                    </p>
                    <StandaloneLink href="/about-us/our-process">
                        View our process
                    </StandaloneLink>
                </Benefit>
            </div>
        </div>
    )
}
