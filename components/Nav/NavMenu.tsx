'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import {
    LayoutGrid,
    Home,
    ListChecks,
    Palette,
    Tag,
    TrendingUp,
    Route,
    HelpCircle,
    Building2,
    Users,
    CalendarDays,
    type LucideIcon,
} from 'lucide-react'

import type { NavGroup } from './navItems'
import style from './NavMenu.module.css'

// Presentation-only: map each destination to its mega-menu icon.
const ICONS: Record<string, LucideIcon> = {
    '/floorplans': LayoutGrid,
    '/properties': Home,
    '/standard-inclusions': ListChecks,
    '/selections': Palette,
    '/pricing': Tag,
    '/roi': TrendingUp,
    '/about-us/our-process': Route,
    '/frequently-asked-questions': HelpCircle,
    '/about-us': Building2,
    '/about-us/our-team': Users,
    '/events': CalendarDays,
}

const isActiveHref = (pathname: string, href: string) =>
    pathname === href || pathname.startsWith(`${href}/`)

export default function NavMenu({
    group,
    pathname,
    alignRight = false,
}: {
    group: NavGroup
    pathname: string
    alignRight?: boolean
}) {
    const [open, setOpen] = useState(false)
    const wrapRef = useRef<HTMLLIElement>(null)
    const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

    // The top-level item is "active" when the current route is any page in the group.
    const sectionActive = group.links.some((l) => isActiveHref(pathname, l.href))

    const cancelClose = () => {
        if (closeTimer.current) {
            clearTimeout(closeTimer.current)
            closeTimer.current = null
        }
    }
    const scheduleClose = () => {
        cancelClose()
        closeTimer.current = setTimeout(() => setOpen(false), 120)
    }

    // Escape closes and returns focus to the trigger; outside-click closes.
    useEffect(() => {
        if (!open) return
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                setOpen(false)
                wrapRef.current
                    ?.querySelector<HTMLAnchorElement>(`.${style.trigger}`)
                    ?.focus()
            }
        }
        const onPointerDown = (e: PointerEvent) => {
            if (!wrapRef.current?.contains(e.target as Node)) setOpen(false)
        }
        document.addEventListener('keydown', onKeyDown)
        document.addEventListener('pointerdown', onPointerDown)
        return () => {
            document.removeEventListener('keydown', onKeyDown)
            document.removeEventListener('pointerdown', onPointerDown)
        }
    }, [open])

    useEffect(() => cancelClose, [])

    return (
        <li
            ref={wrapRef}
            className={style.wrap}
            onMouseEnter={() => {
                cancelClose()
                setOpen(true)
            }}
            onMouseLeave={scheduleClose}
            onFocus={() => {
                cancelClose()
                setOpen(true)
            }}
            onBlur={(e) => {
                if (!wrapRef.current?.contains(e.relatedTarget as Node)) {
                    setOpen(false)
                }
            }}
        >
            <Link
                href={group.href}
                className={`${style.trigger} ${
                    sectionActive ? style.triggerActive : ''
                }`}
                aria-haspopup="true"
                aria-expanded={open}
            >
                {group.label}
                <svg
                    className={style.chevron}
                    width="10"
                    height="10"
                    viewBox="0 0 10 10"
                    fill="none"
                    aria-hidden="true"
                >
                    <path
                        d="M1 3.5L5 7L9 3.5"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                </svg>
            </Link>

            <div
                className={`${style.panel} ${
                    alignRight ? style.alignRight : ''
                } ${open ? style.panelOpen : ''}`}
            >
                <ul className={style.list}>
                    {group.links.map((link) => {
                        const Icon = ICONS[link.href]
                        const active = isActiveHref(pathname, link.href)
                        return (
                            <li key={link.href}>
                                <Link
                                    href={link.href}
                                    className={`${style.item} ${
                                        active ? style.itemActive : ''
                                    }`}
                                    aria-current={active ? 'page' : undefined}
                                    tabIndex={open ? 0 : -1}
                                >
                                    {Icon && (
                                        <span className={style.iconWrap}>
                                            <Icon size={18} aria-hidden="true" />
                                        </span>
                                    )}
                                    <span className={style.itemText}>
                                        <span className={style.itemLabel}>
                                            {link.label}
                                        </span>
                                        {link.description && (
                                            <span className={style.itemDesc}>
                                                {link.description}
                                            </span>
                                        )}
                                    </span>
                                </Link>
                            </li>
                        )
                    })}
                </ul>
            </div>
        </li>
    )
}
