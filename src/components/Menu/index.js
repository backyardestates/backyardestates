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
                    <Link href="/" className={style.logo}>
                        <svg
                            id="Layer_1"
                            data-name="Layer 1"
                            xmlns="http://www.w3.org/2000/svg"
                            width="40"
                            height="40"
                            viewBox="0 0 40 40"
                            className={style.logo}
                            fill="black"
                        >
                            <path d="m23.837,1.014L7.235,12.816v10.362h-3.133v-10.993l7.851-5.711.829.905,3.338-2.475-3.617-3.904L0,10.097v17.183h23.025v-14.229l-3.67-3.993,4.32-2.961,12.222,9.566v14.559h-3.324v-6.347h-5.58v6.347h-15.655v-1.742h-4.103v5.844h32.765V13.663L23.837,1.014Zm-4.914,22.164h-7.585v-8.293l4.643-3.435,2.942,3.201v8.528Z" />
                        </svg>
                        <span className={style.logotype}>Backyard Estates</span>
                    </Link>

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
                        <Link href="/gallery">Gallery</Link>
                    </li>
                    <li>
                        <Link href="/standard-inclusions">
                            Standard inclusions
                        </Link>
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
                        </ul>
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
