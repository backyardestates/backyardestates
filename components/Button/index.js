import Link from 'next/link'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faChevronRight } from '@fortawesome/pro-solid-svg-icons'

import style from './Button.module.css'

export default function Button({
    theme = 'blue',
    isPrimary = true,
    children,
    href = '#',
    showIcon = true,
    newWindow = false,
}) {
    return (
        <Link
            href={href}
            className={`${isPrimary ? style.primary : style.secondary} ${theme === 'blue' ? style.theme_blue : style.theme_beige
                }`} target={newWindow ? '_blank' : '_self'}
        >
            <span>{children}</span>

            {showIcon && <FontAwesomeIcon icon={faChevronRight} />}
        </Link>
    )
}
