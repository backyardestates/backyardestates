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
        const isModalDismissed = sessionStorage.getItem('isModalDismissed')
        const isModalDismissedExpired = sessionStorage.getItem(
            'isModalDismissedExpired'
        )

        if (isModalDismissedExpired) {
            const now = Date.now()
            const elapsedTime = now - parseInt(isModalDismissedExpired, 10)

            // Check if 24 hours (in milliseconds) have passed
            if (elapsedTime > 24 * 60 * 60 * 1000) {
                sessionStorage.removeItem('isModalDismissed')
                sessionStorage.removeItem('isModalDismissedExpired')
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
        sessionStorage.setItem('isModalDismissed', 'true')
        sessionStorage.setItem('isModalDismissedExpired', Date.now().toString())
    }

    return (
        <>
            {showModal && (
                <div className={style.overlay} onClick={handleClose}>
                    <div className={style.modal} onClick={(e) => e.stopPropagation()}>
                        {showImages && (
                            <div className={style.top} onClick={handleClose}>
                                <p className={style.close}>
                                    <FontAwesomeIcon icon={faXmark} size="xl" />
                                </p>
                                <Image
                                    src="/images/fpo/fpo.png"
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
                                        src="/images/fpo/fpo.png"
                                        layout="responsive"
                                        width={4}
                                        height={3}
                                        alt="Alternate text for image"
                                    />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <Image
                                        src="/images/fpo/fpo.png"
                                        layout="responsive"
                                        width={4}
                                        height={3}
                                        alt="Alternate text for image"
                                    />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <Image
                                        src="/images/fpo/fpo.png"
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
                            <p className={style.location}>Pomona, CA</p>
                            <ul className={style.dates}>
                                <DateTime
                                    date="09/05/25"
                                    start="10am"
                                    finish="6pm"
                                />
                                <DateTime
                                    date="09/06/25"
                                    start="9am"
                                    finish="2pm"
                                />
                            </ul>
                            <Button newWindow={true} href="https://www.eventbrite.com/e/adu-open-house-showcase-in-pomona-tickets-1612687354289?aff=oddtdtcreator" >
                                Book your spot
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}
