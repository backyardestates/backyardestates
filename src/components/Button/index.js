import Link from 'next/link'
import style from './Button.module.css'

export default function Button({
    theme = 'blue',
    isPrimary = true,
    children,
    href = '#',
}) {
    // const theme =
    return (
        <Link
            href={href}
            className={`${isPrimary ? style.primary : style.secondary} ${
                theme === 'blue' ? style.theme_blue : style.theme_beige
            }`}
            id="cta"
        >
            <span>{children}</span>
            <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
            >
                <path
                    d="M9 18L15 12L9 6"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
            </svg>
        </Link>
    )
}
