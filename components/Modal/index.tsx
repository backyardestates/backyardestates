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
                            <p className={style.location}>Claremount, CA</p>
                            <ul className={style.dates}>
                                <DateTime
                                    date="04/04/25"
                                    start="10am"
                                    finish="7pm"
                                />
                                <DateTime
                                    date="04/05/24"
                                    start="10am"
                                    finish="4pm"
                                />
                            </ul>
                            <Button href="https://www.eventbrite.com/e/adu-open-house-showcase-in-claremont-tickets-1290368530009">
                                Book your spot
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}
