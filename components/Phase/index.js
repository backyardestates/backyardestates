import Pill from '../Pill'
import style from './Phase.module.css'

export default function Phase({ number, explanation, weeks }) {
    return (
        <div className={style.base}>
            <h2 className={style.title}>Phase {number}</h2>
            <p className={style.small_caps}>{explanation}</p>
            <Pill>{weeks} weeks</Pill>
        </div>
    )
}
