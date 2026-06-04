'use client'

import { useEffect, useRef } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faXmark } from '@fortawesome/pro-solid-svg-icons'
import { Phone, CalendarDays, Home } from 'lucide-react'

import Button from '@/components/Button'
import { NAV_GROUPS, CONTACT } from '@/components/Nav/navItems'

import style from './Menu.module.css'

export default function Menu({ showMenu, toggleMenu }) {
    const pathname = usePathname()
    const panelRef = useRef(null)
    const groupsRef = useRef(null)

    const close = () => toggleMenu(false)

    // Escape to close + lock background scroll while open.
    useEffect(() => {
        if (!showMenu) return

        const onKeyDown = (e) => {
            if (e.key === 'Escape') close()
        }
        document.addEventListener('keydown', onKeyDown)

        const previousOverflow = document.body.style.overflow
        document.body.style.overflow = 'hidden'

        // Always reveal the menu from the first question.
        if (groupsRef.current) groupsRef.current.scrollTop = 0

        // Move focus into the panel for keyboard/screen-reader users
        // (preventScroll so focusing doesn't jump the scroll region).
        panelRef.current?.focus({ preventScroll: true })

        return () => {
            document.removeEventListener('keydown', onKeyDown)
            document.body.style.overflow = previousOverflow
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [showMenu])

    const isActive = (href) =>
        pathname === href || pathname?.startsWith(`${href}/`)

    return (
        <div
            id="site-menu"
            className={`${style.base} ${showMenu ? style.open : ''}`}
            aria-hidden={!showMenu}
        >
            <div
                className={style.scrim}
                onClick={close}
                aria-hidden="true"
            />
            <div
                className={style.modal}
                role="dialog"
                aria-modal="true"
                aria-label="Site menu"
                tabIndex={-1}
                ref={panelRef}
            >
                <div className={style.top}>
                    <Link href="/" className={style.logo} onClick={close}>
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="36"
                            height="36"
                            viewBox="0 0 40 40"
                            aria-hidden="true"
                        >
                            <path d="m23.837,1.014L7.235,12.816v10.362h-3.133v-10.993l7.851-5.711.829.905,3.338-2.475-3.617-3.904L0,10.097v17.183h23.025v-14.229l-3.67-3.993,4.32-2.961,12.222,9.566v14.559h-3.324v-6.347h-5.58v6.347h-15.655v-1.742h-4.103v5.844h32.765V13.663L23.837,1.014Zm-4.914,22.164h-7.585v-8.293l4.643-3.435,2.942,3.201v8.528Z" />
                        </svg>
                        <span className={style.logotype}>Backyard Estates</span>
                    </Link>

                    <button
                        type="button"
                        className={style.close}
                        onClick={close}
                        aria-label="Close menu"
                    >
                        <FontAwesomeIcon icon={faXmark} size="xl" />
                    </button>
                </div>

                <nav className={style.groups} aria-label="Primary" ref={groupsRef}>
                    {NAV_GROUPS.map((group) => (
                        <section key={group.eyebrow} className={style.group}>
                            <header className={style.groupHead}>
                                <span className={style.eyebrow}>
                                    {group.eyebrow}
                                </span>
                                <h2 className={style.heading}>
                                    {group.heading}
                                </h2>
                            </header>
                            <ul className={style.links}>
                                {group.links.map((link) => (
                                    <li key={link.href}>
                                        <Link
                                            href={link.href}
                                            onClick={close}
                                            className={`${style.link} ${
                                                isActive(link.href)
                                                    ? style.linkActive
                                                    : ''
                                            }`}
                                            aria-current={
                                                isActive(link.href)
                                                    ? 'page'
                                                    : undefined
                                            }
                                        >
                                            {link.label}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </section>
                    ))}
                </nav>

                <div className={style.contact}>
                    <Button
                        theme="beige"
                        href={CONTACT.specialistHref}
                        onClick={close}
                    >
                        Talk to an ADU specialist
                    </Button>

                    <div className={style.quickActions}>
                        <Link
                            href={CONTACT.scheduleCallHref}
                            onClick={close}
                            className={style.quickAction}
                        >
                            <CalendarDays size={18} aria-hidden="true" />
                            Schedule a call
                        </Link>
                        <Link
                            href={CONTACT.officeConsultHref}
                            onClick={close}
                            className={style.quickAction}
                        >
                            <Home size={18} aria-hidden="true" />
                            Free office consultation
                        </Link>
                    </div>

                    <a href={CONTACT.PHONE_TEL} className={style.phone}>
                        <Phone size={18} aria-hidden="true" />
                        <span className={style.phoneNumber}>
                            {CONTACT.PHONE_DISPLAY}
                        </span>
                        <span className={style.phoneHours}>
                            {CONTACT.HOURS}
                        </span>
                    </a>
                </div>
            </div>
        </div>
    )
}
