import Link from 'next/link'
import style from './Logo.module.css'

export default function Logo() {
    return (
        <div className={style.root}>
            <Link href="/">
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="39"
                    height="32"
                    viewBox="0 0 39 32"
                    fill="none"
                >
                    <g clip-path="url(#clip0_302_871)">
                        <path
                            d="M22.9128 0L7.11044 11.3803V21.9456H3.04125V10.2125L13.199 2.5364L11.4533 0.261547L0 8.67364V24.9869H21.6354V11.5507L17.7609 7.28075L22.7911 3.78331L35.2785 13.6856V28.9588H31.0207V22.1159H26.5258V28.9588H7.11044V32H38.3197V12.2136L22.9128 0ZM18.5942 12.7246V21.9456H10.1517V12.901L15.2731 9.06292L18.5942 12.7246Z"
                            fill="#1DA4BA"
                        />
                    </g>
                    <defs>
                        <clipPath id="clip0_302_871">
                            <rect width="38.3197" height="32" fill="white" />
                        </clipPath>
                    </defs>
                </svg>
                <span>Backyard Estates</span>
            </Link>
        </div>
    )
}
