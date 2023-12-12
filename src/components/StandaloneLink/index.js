import Link from 'next/link'
import style from './StandaloneLink.module.css'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
    faArrowRight,
    faArrowDownToLine,
} from '@fortawesome/pro-solid-svg-icons'

export default function StandaloneLink({
    theme = 'blue',
    href = '#',
    children,
    icon = 'arrow',
}) {
    return (
        <Link
            href={href}
            className={`${style.base} ${
                theme === 'blue' ? style.theme_blue : style.theme_beige
            }`}
        >
            <span>{children}</span>

            <FontAwesomeIcon
                icon={icon === 'arrow' ? faArrowRight : faArrowDownToLine}
            />
        </Link>
    )
}
