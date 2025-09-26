'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import RSVPModal from '@/components/RSVPSuccessModal'

export default function RSVPModalWrapper() {
    const searchParams = useSearchParams()
    const [open, setOpen] = useState(false)

    useEffect(() => {
        if (searchParams.get('rsvp') === 'success') {
            setOpen(true)
        }
    }, [searchParams])

    return <RSVPModal isOpen={open} onClose={() => setOpen(false)} />
}