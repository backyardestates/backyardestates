'use client'

import { useEffect, useState } from 'react'

import Link from 'next/link'

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faXmark } from '@fortawesome/pro-light-svg-icons'

import style from './Announcement.module.css'

const PRICING = [
    { name: 'Estate 350', current: 199000, updated: 207000 },
    { name: 'Estate 400', current: 215000, updated: 224000 },
    { name: 'Estate 450', current: 235000, updated: 245000 },
    { name: 'Estate 500', current: 255000, updated: 266000 },
    { name: 'Estate 600', current: 279000, updated: 290000 },
    { name: 'Estate 615', current: 283000, updated: 294000 },
    { name: 'Estate 715+', current: 320000, updated: 333000 },
    { name: 'Estate 750', current: 315000, updated: 328000 },
    { name: 'Estate 750+', current: 325000, updated: 338000 },
    { name: 'Estate 800', current: 339000, updated: 353000 },
    { name: 'Estate 950', current: 379000, updated: 395000 },
    { name: 'Estate 1200', current: 419000, updated: 436000 },
]

const formatPrice = (value: number) =>
    `$${value.toLocaleString('en-US')}`

export default function Announcement() {
    const [showModal, setShowModal] = useState(false)

    useEffect(() => {
        const isModalDismissed = localStorage.getItem('isModalDismissed')
        const isModalDismissedExpired = localStorage.getItem(
            'isModalDismissedExpired'
        )

        if (isModalDismissedExpired) {
            const now = Date.now()
            const elapsedTime = now - parseInt(isModalDismissedExpired, 10)

            // Check if 24 hours (in milliseconds) have passed
            if (elapsedTime > 24 * 60 * 60 * 1000) {
                localStorage.removeItem('isModalDismissed')
                localStorage.removeItem('isModalDismissedExpired')
            }
        }

        if (!isModalDismissed) {
            const timer = setTimeout(() => {
                setShowModal(true)
            }, 1000)

            return () => clearTimeout(timer)
        }
    }, [])

    const handleClose = () => {
        setShowModal(false)
        localStorage.setItem('isModalDismissed', 'true')
        localStorage.setItem('isModalDismissedExpired', Date.now().toString())
    }

    useEffect(() => {
        if (!showModal) return

        const previousOverflow = document.body.style.overflow
        document.body.style.overflow = 'hidden'

        const handleKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') handleClose()
        }
        document.addEventListener('keydown', handleKey)

        return () => {
            document.body.style.overflow = previousOverflow
            document.removeEventListener('keydown', handleKey)
        }
    }, [showModal])

    return (
        <>
            {showModal && (
                <div
                    className={style.overlay}
                    onClick={handleClose}
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="announcement-title"
                >
                    <div
                        className={style.modal}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            type="button"
                            aria-label="Close announcement"
                            className={style.close}
                            onClick={handleClose}
                        >
                            <FontAwesomeIcon
                                icon={faXmark}
                                size="lg"
                                className={style.icon}
                            />
                        </button>
                        <div className={style.content}>
                            <h2
                                id="announcement-title"
                                className={style.title}
                            >
                                Pricing Update
                            </h2>
                            <p className={style.eyebrow}>
                                Effective June 15, 2026
                            </p>
                            <p className={style.message}>
                                Due to current industry-wide economic changes,
                                our Standard Estate pricing will increase by 4%.
                            </p>
                            <ul
                                className={style.priceList}
                                aria-label="Updated pricing"
                            >
                                {PRICING.map((item) => (
                                    <li
                                        key={item.name}
                                        className={style.priceRow}
                                    >
                                        <span className={style.estateName}>
                                            {item.name}
                                        </span>
                                        <span className={style.priceGroup}>
                                            <span
                                                className={style.currentPrice}
                                            >
                                                {formatPrice(item.current)}
                                            </span>
                                            <span
                                                className={style.arrow}
                                                aria-hidden="true"
                                            >
                                                →
                                            </span>
                                            <span
                                                className={style.updatedPrice}
                                            >
                                                {formatPrice(item.updated)}
                                            </span>
                                        </span>
                                    </li>
                                ))}
                            </ul>
                            <p className={style.message}>
                                <Link
                                    href="/talk-to-an-adu-specialist"
                                    className={style.cta}
                                >
                                    Talk to an ADU specialist
                                </Link>{' '}
                                to lock in your price before June 15th.
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}
