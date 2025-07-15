'use client'

import { useEffect, useState } from 'react'

import Link from 'next/link'

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faXmark } from '@fortawesome/pro-light-svg-icons'

import style from './Announcement.module.css'

export default function Annoucement() {
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
        console.log('Modal closed')
        setShowModal(false)
        localStorage.setItem('isModalDismissed', 'true')
        localStorage.setItem('isModalDismissedExpired', Date.now().toString())
    }

    return (
        <>
            {showModal && (
                <div className={style.overlay} onClick={handleClose}>
                    <div
                        className={style.modal}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className={style.content}>
                            <div className={style.closeContent}>
                                <FontAwesomeIcon
                                    icon={faXmark}
                                    size="xl"
                                    className={style.icon}
                                    onClick={handleClose}
                                />
                            </div>
                            <p className={style.message}>
                                Due to current industry-wide economic changes,
                                it has unfortunately become necessary for us to
                                make an adjustment. As of June 15th, 2025, our
                                pricing will increase by 6% for each of our
                                Standard Estates.
                            </p>
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
