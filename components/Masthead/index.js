import style from './Masthead.module.css'

export default function Masthead({
    eyebrow = '',
    title,
    showExplanation = true,
    explanation,
}) {
    return (
        <div className={style.base}>
            <p className={style.eyebrow}>{eyebrow}</p>
            <h1 className={style.title}>{title}</h1>
            {showExplanation && (
                <p className={style.explanation}>{explanation}</p>
            )}
        </div>
    )
}
