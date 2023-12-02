import Link from 'next/link'
import style from './StandaloneLink.module.css'

export default function Testimonial({ href = '#', children }) {
    return (
        <Link href={href} className={style.root}>
            <span>{children}</span>
            <svg
                xmlns="http://www.w3.org/2000/svg"
                width="17"
                height="17"
                viewBox="0 0 17 17"
                fill="none"
            >
                <path
                    d="M3.83331 8.5H13.1666"
                    stroke="#1DA3BA"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
                <path
                    d="M8.5 3.83337L13.1667 8.50004L8.5 13.1667"
                    stroke="#1DA3BA"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
            </svg>
        </Link>
    )
}
