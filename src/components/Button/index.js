import Link from 'next/link'
import style from './Button.module.css'

export default function Button({ children, href = '#' }) {
    return (
        <Link href={href} className={style.root} id="cta">
            <span>{children}</span>
            <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
            >
                <g opacity="0.5">
                    <path
                        d="M9 18L15 12L9 6"
                        stroke="white"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                </g>
            </svg>
        </Link>
    )
}
