// import { useState } from 'react'

import Button from '../Button'
import Logo from '../Logo'
import style from './Menu.module.css'
import Link from 'next/link'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'

import { faXmark } from '@fortawesome/pro-solid-svg-icons'

export default function Menu({ showMenu, toggleMenu }) {
    // const [show, setShow] = useState(true)
    return (
        <div className={showMenu ? style.base_show : style.base_hide}>
            <div className={style.modal}>
                <div className={style.top}>
                    <Logo />
                    <FontAwesomeIcon
                        icon={faXmark}
                        size="xl"
                        className={style.icon}
                        onClick={() => {
                            toggleMenu()
                        }}
                    />
                </div>
                <ul>
                    <li>
                        <Link href="/floor-plans">Floor plans</Link>
                    </li>
                    <li>
                        <Link href="/pricing">Pricing</Link>
                    </li>
                    <li>
                        <ul>
                            <li>Company</li>
                            <li>
                                <Link href="/about-us">About us</Link>
                            </li>
                            <li>
                                <Link href="/about-us/our-team">Our team</Link>
                            </li>
                            <li>
                                <Link href="/about-us/our-process">
                                    Our process
                                </Link>
                            </li>
                            <li>
                                <Link href="/roi">
                                    Return On Investment (ROI)
                                </Link>
                            </li>
                        </ul>
                    </li>
                    <li>
                        <Link href="/contact-us">Contact us</Link>
                    </li>
                </ul>
                <div className={style.bottom}>
                    <Button href="/talk-to-an-adu-specialist">
                        Talk to an ADU specialist
                    </Button>
                </div>
            </div>
        </div>
    )
}
