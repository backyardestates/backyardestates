import StandaloneLink from '../StandaloneLink'
import style from './Advert.module.css'

export default function Advert() {
    return (
        <div className={style.base}>
            <div className={style.header}>
                <h2 className={style.title}>Need a custom ADU?</h2>
                <p className={style.description}>
                    We can deliver your ideal ADU for your unique needs. Any
                    ofour floor plans can be customized for a single flat fee.
                </p>
            </div>
            <StandaloneLink href="/talk-to-an-adu-specialist">
                <p>Talk to an ADU specialist</p>
            </StandaloneLink>
        </div>
    )
}
