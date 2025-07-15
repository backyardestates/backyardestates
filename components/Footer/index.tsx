// sanity cms setup'
import { client } from '@/sanity/client'
import { FLOORPLANS_QUERY } from '@/sanity/queries'

import Link from 'next/link'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faEnvelope, faPhone } from '@fortawesome/pro-regular-svg-icons'

import Newsletter from '../Newsletter'

import style from './Footer.module.css'

type Floorplan = {
    name: string
    slug: {
        current: string
    }
}

export default async function Footer() {
    const floorplans = await client.fetch<Floorplan[]>(FLOORPLANS_QUERY)
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
                                <FontAwesomeIcon
                                    icon={faEnvelope}
                                    size="lg"
                                    className={style.icon}
                                />
                                <Link href="mailto:contact@backyardestates.com">
                                    contact@backyardestates.com
                                </Link>
                            </li>
                            <li className={style.contact}>
                                <FontAwesomeIcon
                                    icon={faPhone}
                                    size="lg"
                                    className={style.icon}
                                />
                                <Link href="tel:8182083113">
                                    (818) 208-3113
                                </Link>
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
                                {floorplans.map((floorplan, index) => (
                                    <li key={index}>
                                        <Link
                                            href={`/floorplans/${floorplan.slug.current}/`}
                                        >
                                            {floorplan.name}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <div className={style.linkColumn}>
                            <h3 className={style.display3}>Resources</h3>
                            <ul>
                                <li>
                                    <Link href="/blog">Blog</Link>
                                </li>
                                <li>
                                    <Link href="/properties">
                                        Completed ADUs
                                    </Link>
                                </li>
                                <li>
                                    <Link href="/pricing">Pricing</Link>
                                </li>
                                <li>
                                    <Link href="/standard-inclusions">
                                        Standard inclusions
                                    </Link>
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
                                    <Link href="/frequently-asked-questions">
                                        Frequently asked questions
                                    </Link>
                                </li>
                                <li>
                                    <Link href="/about-us/our-process">
                                        Our process
                                    </Link>
                                </li>
                                <li>
                                    <Link href="/about-us/our-team">
                                        Our team
                                    </Link>
                                </li>
                            </ul>
                        </div>
                    </div>
                    <div className={style.columnRightBottom}>
                        <ul className={style.legal}>
                            <li>
                                © 2025 Backyard Estates. All Rights Reserved.
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
