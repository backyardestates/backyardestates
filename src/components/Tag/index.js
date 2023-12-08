import Link from 'next/link'
import style from './Tag.module.css'

export default function Tag({ children }) {
    return <button className={style.base}>{children}</button>
}
