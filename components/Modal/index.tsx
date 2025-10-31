'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Button from '@/components/Button'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faXmark } from '@fortawesome/pro-light-svg-icons'
import {
    startOfDay,
    differenceInCalendarDays,
    isWithinInterval,
    isAfter,
} from 'date-fns'
import formatDate from '@/utils/dates' // ✅ import your formatDate helper
import style from './Modal.module.css'
import { CalendarIcon } from 'lucide-react'

type EventEntry = {
    eventDate: Date
    startTime?: string | null
    endTime?: string | null
    _id?: string
    dates: {
        date: string
        startTime?: string
        endTime?: string
        start?: string
        finish?: string
        _key?: string
    }[]
    location?: string
    projectMedia?: {
        professionalPhotos?: { publicId: string; url: string }[]
    }
    slug?: string
    title?: string
}

export default function Modal({ events = [] }: { events?: any[] }) {
    const [showModal, setShowModal] = useState(false)
    const [soonestEvent, setSoonestEvent] = useState<EventEntry | null>(null)

    // ---------- 🧠 Event selection logic ----------
    useEffect(() => {
        const today = startOfDay(new Date())

        const aduSeminar = {
            _id: 'adu-seminar-2025-10-08',
            dates: [{ date: '2025-10-08' }],
            location: '2335 W Foothill Blvd #18, Upland CA 91786',
            projectMedia: {
                professionalPhotos: [
                    {
                        publicId: 'Seminar/Foothill/adu-seminar',
                        url: '/images/ADUSeminar.png',
                    },
                ],
            },
            slug: 'adu-seminar',
            title: 'ADU Seminar',
        }

        const includeSeminar = aduSeminar.dates.some((d) => {
            const [year, month, day] = d.date.split('-').map(Number)
            const eventDate = new Date(year, month - 1, day)
            return isAfter(eventDate, today)
        })

        const allEvents = [...events, ...(includeSeminar ? [aduSeminar] : [])]

        const eventEntries = allEvents.flatMap((event) =>
            event.dates.map((d) => {
                const [year, month, day] = d.date.split('-').map(Number)
                const localDate = new Date(year, month - 1, day) // ✅ use local date (no timezone shift)

                return {
                    ...event,
                    eventDate: startOfDay(localDate),
                    startTime: d.startTime?.trim() || d.start || null,
                    endTime: d.endTime?.trim() || d.finish || null,
                }
            })
        )

        const twoWeeksFromNow = new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000)
        const validEvents = eventEntries.filter(({ eventDate }) =>
            isWithinInterval(eventDate, { start: today, end: twoWeeksFromNow })
        )

        const sorted = validEvents.sort(
            (a, b) => a.eventDate.getTime() - b.eventDate.getTime()
        )
        setSoonestEvent(sorted[0] || null)
    }, [events])

    // ---------- 🕒 Modal timing / dismissal ----------
    useEffect(() => {
        const isModalDismissed = sessionStorage.getItem('isModalDismissed')
        const isModalDismissedExpired = sessionStorage.getItem('isModalDismissedExpired')

        if (isModalDismissedExpired) {
            const now = Date.now()
            const elapsedTime = now - parseInt(isModalDismissedExpired, 10)
            if (elapsedTime > 24 * 60 * 60 * 1000) {
                sessionStorage.removeItem('isModalDismissed')
                sessionStorage.removeItem('isModalDismissedExpired')
            }
        }

        if (!isModalDismissed) {
            const timer = setTimeout(() => setShowModal(true), 1000)
            return () => clearTimeout(timer)
        }
    }, [])

    const handleClose = () => {
        setShowModal(false)
        sessionStorage.setItem('isModalDismissed', 'true')
        sessionStorage.setItem('isModalDismissedExpired', Date.now().toString())
    }

    if (!showModal || !soonestEvent) return null

    const daysAway = differenceInCalendarDays(
        soonestEvent.eventDate,
        startOfDay(new Date())
    )

    const whenText =
        daysAway === 0
            ? 'Today'
            : daysAway === 1
                ? 'Tomorrow'
                : `in ${daysAway} days`

    const isSeminar = soonestEvent.slug === 'adu-seminar'
    const titleText = isSeminar
        ? `ADU Seminar ${whenText}`
        : `ADU Open House ${whenText}`

    const buttonLink = isSeminar
        ? '/events/adu-seminar'
        : `/events/open-house/${soonestEvent.slug}`

    const photo =
        soonestEvent.projectMedia?.professionalPhotos?.[0]?.url ||
        '/images/fpo/fpo.png'

    return (
        <div className={style.overlay} onClick={handleClose}>
            <div className={style.modal} onClick={(e) => e.stopPropagation()}>
                <div className={style.top}>
                    <p className={style.close}>
                        <FontAwesomeIcon icon={faXmark} size="xl" onClick={handleClose} />
                    </p>
                    <Image
                        src={photo}
                        layout="responsive"
                        width={16}
                        height={9}
                        alt={soonestEvent.title || ''}
                        className={style.image}
                    />
                </div>

                <div className={style.content}>
                    <p className={style.location}>{titleText}</p>
                    <p className={style.smallCaps}>{soonestEvent.location}</p>
                    <ul className={style.dates}>
                        {soonestEvent.dates.map((d) => (
                            <li key={d._key || d.date} className={style.dateItem}>
                                <CalendarIcon />
                                <span className={style.dateText}>
                                    {formatDate(d.date)}
                                </span>
                            </li>
                        ))}
                    </ul>
                    <Button href={buttonLink}>
                        Learn more
                    </Button>
                </div>
            </div>
        </div>
    )
}
