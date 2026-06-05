import type { MouseEventHandler, ReactNode } from 'react'
import Link from 'next/link'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faChevronRight } from '@fortawesome/pro-solid-svg-icons'

import style from './Button.module.css'

interface ButtonProps {
    theme?: 'blue' | 'beige'
    isPrimary?: boolean
    children: ReactNode
    href?: string
    showIcon?: boolean
    newWindow?: boolean
    onClick?: MouseEventHandler<HTMLAnchorElement>
}

export default function Button({
    theme = 'blue',
    isPrimary = true,
    children,
    href = '#',
    showIcon = true,
    newWindow = false,
    onClick,
}: ButtonProps) {
    return (
        <Link
            href={href}
            onClick={onClick}
            className={`${isPrimary ? style.primary : style.secondary} ${
                theme === 'blue' ? style.theme_blue : style.theme_beige
            }`}
            target={newWindow ? '_blank' : '_self'}
        >
            <span>{children}</span>

            {showIcon && <FontAwesomeIcon icon={faChevronRight} />}
        </Link>
    )
}
