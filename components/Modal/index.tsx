'use client'

import { useEffect, useState } from 'react'

import Button from '@/components/Button'
import Image from 'next/image'
import DateTime from '@/components/DateTime'

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faXmark } from '@fortawesome/pro-light-svg-icons'

import style from './Modal.module.css'

export default function Modal() {
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

    const showImages = false

    const handleClose = () => {
        setShowModal(false)
        localStorage.setItem('isModalDismissed', 'true')
        localStorage.setItem('isModalDismissedExpired', Date.now().toString())
    }

    return (
        <>
            {showModal && (
                <div className={style.overlay} onClick={handleClose}>
                    <div className={style.modal}>
                        {showImages && (
                            <div className={style.top}>
                                <p className={style.close}>
                                    <FontAwesomeIcon icon={faXmark} size="xl" />
                                </p>
                                <Image
                                    src="/images/fpo/fpo-16-9@2x.png"
                                    layout="responsive"
                                    width={16}
                                    height={9}
                                    alt="Alternate text for image"
                                />
                            </div>
                        )}
                        {showImages && (
                            <div className={style.interiorImages}>
                                <div style={{ flex: 1 }}>
                                    <Image
                                        src="/images/fpo/fpo-4-3@2x.png"
                                        layout="responsive"
                                        width={4}
                                        height={3}
                                        alt="Alternate text for image"
                                    />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <Image
                                        src="/images/fpo/fpo-4-3@2x.png"
                                        layout="responsive"
                                        width={4}
                                        height={3}
                                        alt="Alternate text for image"
                                    />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <Image
                                        src="/images/fpo/fpo-4-3@2x.png"
                                        layout="responsive"
                                        width={4}
                                        height={3}
                                        alt="Picture of the author"
                                    />
                                </div>
                            </div>
                        )}
                        <div className={style.content}>
                            <div className={style.closeContent}>
                                <FontAwesomeIcon
                                    icon={faXmark}
                                    size="xl"
                                    className={style.icon}
                                    onClick={handleClose}
                                />
                            </div>
                            <p className={style.smallCaps}>
                                ADU open house &amp; showcase
                            </p>
                            <p className={style.location}>Glendora, CA</p>
                            <ul className={style.dates}>
                                <DateTime
                                    date="04/26/24"
                                    start="9am"
                                    finish="4pm"
                                />
                            </ul>
                            <Button href="https://www.eventbrite.com/e/adu-open-house-showcase-in-glendora-tickets-1333165697489">
                                Book your spot
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}
