import style from './NavigationTabs.module.css'

export default function NavigationTabs({ tab = 1 }) {
    return (
        <ul className={style.base}>
            <li className={tab === 1 ? style.selected : ''}>
                Your information
            </li>
            <li className={tab === 2 ? style.selected : ''}>
                Their information
            </li>
            <li className={tab === 3 ? style.selected : ''}>
                How can we help?
            </li>
        </ul>
    )
}
