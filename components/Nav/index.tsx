'use client'

import { useState } from 'react'

import { usePathname } from 'next/navigation'

import Button from '@/components/Button'
import Logo from '@/components/Logo'
import Menu from '@/components/Menu'
import NavMenu from '@/components/Nav/NavMenu'
import { NAV_GROUPS, CONTACT } from '@/components/Nav/navItems'

import style from './Nav.module.css'

export default function Nav() {
    const [showMenu, setShowMenu] = useState(false)
    const pathname = usePathname() ?? ''

    return (
        <>
            <Menu showMenu={showMenu} toggleMenu={setShowMenu} />
            <nav className={style.page}>
                <div className={style.container}>
                    <div className={style.left}>
                        <Logo mode={'light'} />
                        <ul className={style.links}>
                            {NAV_GROUPS.map((group, i) => (
                                <NavMenu
                                    key={group.eyebrow}
                                    group={group}
                                    pathname={pathname}
                                    alignRight={i === NAV_GROUPS.length - 1}
                                />
                            ))}
                        </ul>
                    </div>

                    <div className={style.right}>
                        <div className={style.cta}>
                            <Button
                                isPrimary
                                href={CONTACT.specialistHref}
                            >
                                Talk to an ADU specialist
                            </Button>
                        </div>

                        <button
                            type="button"
                            className={`${style.menu_light} ${
                                showMenu ? style.menu_open : ''
                            }`}
                            aria-label="Open menu"
                            aria-expanded={showMenu}
                            aria-controls="site-menu"
                            onClick={() => {
                                setShowMenu(true)
                            }}
                        >
                            <span className={style.label}>Menu</span>
                            <svg
                                width="20"
                                height="28"
                                viewBox="0 0 20 28"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                                aria-hidden="true"
                            >
                                <path
                                    d="M0 6H20"
                                    strokeWidth="2"
                                    strokeLinejoin="round"
                                    className={`${style.icon_hamburger_bar} ${style.bar_top}`}
                                />
                                <path
                                    d="M0 14H20"
                                    strokeWidth="2"
                                    strokeLinejoin="round"
                                    className={`${style.icon_hamburger_bar} ${style.bar_mid}`}
                                />
                                <path
                                    d="M0 22H20"
                                    strokeWidth="2"
                                    strokeLinejoin="round"
                                    className={`${style.icon_hamburger_bar} ${style.bar_bot}`}
                                />
                            </svg>
                        </button>
                    </div>
                </div>
            </nav>
        </>
    )
}
