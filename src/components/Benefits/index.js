import Benefit from '../Benefit'
import style from './Benefits.module.css'

export default function WhyChoose() {
    return (
        <div className={style.root}>
            <div className={style.content}>
                <h2 className={style.subhead}>Why choose Backyard Estates?</h2>
                <p className={style.intro}>
                    From start to finish, we&apos;ve simplified the Accessory
                    Dwelling Unit (ADU) build process. We take care of
                    everything, so you don&apos;t have to worry.
                </p>
            </div>
            <div className={style.benefits}>
                <Benefit position={0} type="process">
                    We&rsquo;re meticulous planners
                </Benefit>
                <Benefit position={1} type="price" subtle>
                    We&rsquo;re affordable
                </Benefit>
                <Benefit position={2} type="architecture">
                    We aim for beauty
                </Benefit>
                <Benefit position={3} type="timeline">
                    We eliminate delays
                </Benefit>
                <Benefit position={4} type="timeline" subtle>
                    We&rsquo;re quicker
                </Benefit>
            </div>
        </div>
    )
}
