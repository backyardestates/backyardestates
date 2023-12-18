import Link from 'next/link'
import style from './Footer.module.css'
import Newsletter from '../Newsletter'

export default function Footer({ estates }) {
    return (
        <footer className={style.root}>
            <div className={style.container}>
                <div className={style.columnLeft}>
                    <div>
                        <div className={style.logo}>
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="39"
                                height="32"
                                viewBox="0 0 39 32"
                                fill="none"
                            >
                                <g clipPath="url(#clip0_205_325)">
                                    <path
                                        d="M22.9128 0L7.11044 11.3803V21.9456H3.04125V10.2125L13.199 2.5364L11.4533 0.261547L0 8.67364V24.9869H21.6354V11.5507L17.7609 7.28075L22.7911 3.78331L35.2785 13.6856V28.9588H31.0207V22.1159H26.5258V28.9588H7.11044V32H38.3197V12.2136L22.9128 0ZM18.5942 12.7246V21.9456H10.1517V12.901L15.2731 9.06292L18.5942 12.7246Z"
                                        fill="white"
                                    />
                                </g>
                                <defs>
                                    <clipPath id="clip0_205_325">
                                        <rect
                                            width="38.3197"
                                            height="32"
                                            fill="white"
                                        />
                                    </clipPath>
                                </defs>
                            </svg>
                            Backyard Estates
                        </div>
                        <p className={style.intro}>
                            Premier Accessory Dwelling Unit (ADU) builder for
                            the greater Los Angeles area.
                        </p>
                        <ul>
                            <li className={style.contact}>
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="24"
                                    height="24"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                >
                                    <g opacity="0.5">
                                        <path
                                            d="M4 4H20C21.1 4 22 4.9 22 6V18C22 19.1 21.1 20 20 20H4C2.9 20 2 19.1 2 18V6C2 4.9 2.9 4 4 4Z"
                                            stroke="white"
                                            strokeWidth="2"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        />
                                        <path
                                            d="M22 6L12 13L2 6"
                                            stroke="white"
                                            strokeWidth="2"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        />
                                    </g>
                                </svg>
                                contact@backyardestates.com
                            </li>
                            <li className={style.contact}>
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="24"
                                    height="24"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                >
                                    <g opacity="0.5">
                                        <path
                                            d="M22 16.9201V19.9201C22.0011 20.1986 21.9441 20.4743 21.8325 20.7294C21.7209 20.9846 21.5573 21.2137 21.3521 21.402C21.1469 21.5902 20.9046 21.7336 20.6408 21.8228C20.3769 21.912 20.0974 21.9452 19.82 21.9201C16.7428 21.5857 13.787 20.5342 11.19 18.8501C8.77383 17.3148 6.72534 15.2663 5.19 12.8501C3.49998 10.2413 2.44824 7.27109 2.12 4.1801C2.09501 3.90356 2.12788 3.62486 2.2165 3.36172C2.30513 3.09859 2.44757 2.85679 2.63477 2.65172C2.82196 2.44665 3.04981 2.28281 3.30379 2.17062C3.55778 2.05843 3.83234 2.00036 4.11 2.0001H7.11C7.59531 1.99532 8.06579 2.16718 8.43376 2.48363C8.80173 2.80008 9.04208 3.23954 9.11 3.7201C9.23662 4.68016 9.47145 5.62282 9.81 6.5301C9.94455 6.88802 9.97366 7.27701 9.89391 7.65098C9.81415 8.02494 9.62886 8.36821 9.36 8.6401L8.09 9.9101C9.51356 12.4136 11.5865 14.4865 14.09 15.9101L15.36 14.6401C15.6319 14.3712 15.9752 14.1859 16.3491 14.1062C16.7231 14.0264 17.1121 14.0556 17.47 14.1901C18.3773 14.5286 19.3199 14.7635 20.28 14.8901C20.7658 14.9586 21.2094 15.2033 21.5265 15.5776C21.8437 15.9519 22.0122 16.4297 22 16.9201Z"
                                            stroke="white"
                                            strokeWidth="2"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        />
                                    </g>
                                </svg>
                                (818) 208-3113
                            </li>
                        </ul>
                    </div>
                    <Newsletter />
                </div>
                <div className={style.columnRight}>
                    <div className={style.columnRightTop}>
                        <div className={style.linkColumn}>
                            <h3 className={style.display3}>Floor plans</h3>
                            <ul>
                                <li>
                                    <Link href="/floor-plans/estate-350">
                                        Estate 350
                                    </Link>
                                </li>
                                <li>
                                    <Link href="/floor-plans/estate-450">
                                        Estate 450
                                    </Link>
                                </li>
                                <li>
                                    <Link href="/floor-plans/estate-500">
                                        Estate 500
                                    </Link>
                                </li>
                                <li>
                                    <Link href="/floor-plans/estate-750">
                                        Estate 750
                                    </Link>
                                </li>
                                <li>
                                    <Link href="/floor-plans/estate-750-plus">
                                        Estate 750+
                                    </Link>
                                </li>
                                <li>
                                    <Link href="/floor-plans/estate-800">
                                        Estate 800
                                    </Link>
                                </li>
                                <li>
                                    <Link href="/floor-plans/estate-900">
                                        Estate 900
                                    </Link>
                                </li>
                                <li>
                                    <Link href="/floor-plans/estate-1200">
                                        Estate 1200
                                    </Link>
                                </li>
                            </ul>
                        </div>
                        <div className={style.linkColumn}>
                            <h3 className={style.display3}>Resources</h3>
                            <ul>
                                <li>
                                    <Link href="/pricing">Pricing</Link>
                                </li>
                                <li>
                                    <Link href="/roi">Investment ROI</Link>
                                </li>
                            </ul>
                        </div>
                        <div className={style.linkColumn}>
                            <h3 className={style.display3}>Company</h3>
                            <ul>
                                <li>
                                    <Link href="/about-us">About us</Link>
                                </li>
                                <li>
                                    <Link href="/about-us/our-team">
                                        Our team
                                    </Link>
                                </li>
                                <li>
                                    <Link href="/about-us/our-process">
                                        Our process
                                    </Link>
                                </li>
                                <li>
                                    <Link href="/contact-us">Contact us</Link>
                                </li>
                            </ul>
                        </div>
                    </div>
                    <div className={style.columnRightBottom}>
                        <ul className={style.legal}>
                            <li>
                                © 2023 Backyard Estates. All Rights Reserved.
                            </li>
                            <li>
                                <Link href="/legal/privacy-policy">
                                    Privacy policy
                                </Link>
                            </li>
                            <li>
                                <Link href="/legal/terms-of-use">
                                    Terms of use
                                </Link>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        </footer>
    )
}
