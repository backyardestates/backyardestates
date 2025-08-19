import style from './BlogTag.module.css'

export default function BlogTag({ tag }) {
    return (
        <a className={style.base} href={`/blog/tag/${tag.slug.current}`}>
            {tag.title}
        </a>
    )
}
