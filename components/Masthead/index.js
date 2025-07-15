import style from './Masthead.module.css'

export default function Masthead({
    title,
    showExplanation = true,
    explanation,
}) {
    return (
        <div className={style.base}>
            <h1 className={style.title}>{title}</h1>
            {showExplanation && (
                <p className={style.explanation}>{explanation}</p>
            )}
        </div>
    )
}
