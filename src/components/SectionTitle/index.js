import style from './SectionTitle.module.css'

export default function SectionTitle({
    title = 'Title',
    explanation = 'facilisis sed odio morbi quis commodo odio aenean sed adipiscing diam donec adipiscing tristique risus nec feugiat in fermentum posuere urna nec tincidunt praesent semper feugiat nibh sed pulvinar proin',
    theme = style.theme_beige,
}) {
    return (
        <div className={style.base}>
            <h2 className={`${style.title} ${theme}`}>{title}</h2>
            <p className={`${style.explanation} ${theme}`}>{explanation}</p>
        </div>
    )
}
