import Step from '../Step'
import style from './Process.module.css'
import StandaloneLink from '@/components/StandaloneLink'

export default function Process() {
    return (
        <div className={style.base}>
            <div className={style.content}>
                <p className={style.subhead}>our process commitment</p>
                <h2 className={style.display2}>
                    We deliver on-time and within budget
                </h2>
                <div className={style.timeline}>
                    <div className={style.timelineStart}>Start</div>
                    <div className={style.timelineMiddle}>~ 12 months</div>
                    <div className={style.timelineEnd}>End</div>
                </div>
                <div className={style.column}>
                    <p className={style.small_caps}>Phase 1</p>
                    <p className={style.weeks}>2-3 weeks</p>
                    <Step title="Virtual site visit" />
                    <Step title="Formal property analysis" />
                    <Step title="Proposal review" />
                    <Step title="Sign your ADU agreement" showArrow={false} />
                </div>
                <div className={style.column}>
                    <p className={style.small_caps}>Phase 2</p>
                    <p className={style.weeks}>8-16 weeks</p>
                    <Step title="Site visit" />
                    <Step title="Permit submittal" />
                    <Step title="Permit approval" showArrow={false} />
                </div>
                <div className={style.column}>
                    <p className={style.small_caps}>Phase 3</p>
                    <p className={style.weeks}>12-14 weeks</p>
                    <Step title="Pre-construction" />
                    <Step title="Home build" />
                    <Step title="Move in" showArrow={false} />
                </div>
                <div className={style.cta}>
                    <StandaloneLink>Download process PDF</StandaloneLink>
                </div>
            </div>
        </div>
    )
}
