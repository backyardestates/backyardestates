import Button from '../Button'
import style from './Catchall.module.css'

export default function Catchall() {
    return (
        <div className={style.base}>
            <h2 className={style.display2}>Start your ADU journey today</h2>
            <p className={style.intro}>
                Expand your income and livable space. Backyard Estates provides
                an all inclusive solution that maximizes your backyard while
                expediting the timeline to completion.
            </p>
            <Button isPrimary={false} href="/talk-to-an-adu-specialist">
                Talk to an ADU Specialist
            </Button>
            <p className={style.cta}>
                Or, call <a href="tel:+18182083113">(818) 208-3113</a> to
                Schedule a free ADU assessment today!
            </p>
        </div>
    )
}
