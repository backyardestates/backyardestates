'use client'

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faXmark } from '@fortawesome/pro-light-svg-icons'
import style from './RSVPSuccessModal.module.css'
type RSVPModalProps = {
    isOpen: boolean
    onClose: () => void
}

export default function RSVPModal({ isOpen, onClose }: RSVPModalProps) {
    if (!isOpen) return null

    return (
        <div className={style.overlay} onClick={onClose}>
            <div className={style.modal} onClick={(e) => e.stopPropagation()}>
                <div className={style.content}>
                    <div className={style.closeContent}>
                        <FontAwesomeIcon
                            icon={faXmark}
                            size="xl"
                            className={style.icon}
                            onClick={onClose}
                        />
                    </div>

                    <h2 className={style.title}>🎉 RSVP Confirmed</h2>
                    <p className={style.message}>
                        Thanks! Your spot is reserved.
                    </p>
                    <p className={style.subtext}>
                        We look forward to seeing you at the event. Check your email for confirmation.
                    </p>
                </div>
            </div>
        </div>
    )
}
