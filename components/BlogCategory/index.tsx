import style from './BlogCategory.module.css'

export default function BlogCategory({ category }) {
    return <div className={style.base}>{category}</div>
}
