import style from './Masthead.module.css'

export default function Masthead({ title, explanation }) {
    return (
        <div className={style.root}>
            <h1 className={style.title}>{title}</h1>
            <p className={style.explanation}>{explanation}</p>
        </div>
    )
}
