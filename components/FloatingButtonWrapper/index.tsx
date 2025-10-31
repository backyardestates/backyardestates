'use client'

import { usePathname } from 'next/navigation'
import FloatingScheduleButton from '../FloatingScheduleButton'

export default function FloatingButtonWrapper() {
    const pathname = usePathname()
    const shouldShow = !pathname.startsWith('/events/checkin')

    if (!shouldShow) return null
    return <FloatingScheduleButton />
}