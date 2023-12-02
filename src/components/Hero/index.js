import Button from '../Button'
import style from './Hero.module.css'

export default function Hero({ children }) {
    return (
        <div className={style.root}>
            <div className={style.content}>
                <h1>Build a backyard ADU to bring parents closer</h1>
                <p className={style.intro}>
                    With the quickest and only fixed-price Accessory Dwelling
                    Unit (ADU) builder in the greater Los Angeles area.
                </p>
                <Button href="/talk-to-an-adu-specialist">
                    Talk to an ADU specialist
                </Button>
            </div>
        </div>
    )
}
