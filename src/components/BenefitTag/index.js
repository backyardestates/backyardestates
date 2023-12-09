import style from './BenefitTag.module.css'

export default function Tag({ children }) {
    return <span className={style.base}>{children}</span>
}
