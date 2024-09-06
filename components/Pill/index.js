import style from './Pill.module.css'

export default function Pill({ children }) {
    return <div className={style.base}>{children}</div>
}
