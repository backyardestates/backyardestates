import style from './TabBar.module.css'

export default function TabBar() {
    return (
        <ul className={style.base}>
            <li>
                <a href="#">Contemporary light</a>
            </li>
            <li>
                <a href="#">Contemporary dark</a>
            </li>
            <li>
                <a href="#">Modern Blue</a>
            </li>
            <li>
                <a href="#">Modern monochrome</a>
            </li>
            <li>
                <a href="#">Urban olive</a>
            </li>
        </ul>
    )
}
