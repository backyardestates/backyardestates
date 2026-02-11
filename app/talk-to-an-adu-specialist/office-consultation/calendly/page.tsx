'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { InlineWidget } from 'react-calendly'

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faXmark } from '@fortawesome/pro-solid-svg-icons'

import Logo from '@/components/Logo'
import style from "../../Form.module.css" // ✅ change to your actual existing location

export default function OfficeConsultCalendly() {
    const router = useRouter()
    const sp = useSearchParams()

    const name = sp.get('name') ?? undefined
    const email = sp.get('email') ?? undefined
    const phone = sp.get('phone') ?? undefined
    const address = sp.get('address') ?? undefined
    const notes = sp.get('notes') ?? undefined

    function goBack() {
        router.push('/')
    }

    return (
        <>
            <div className={style.topBar}>
                <Logo />
                <FontAwesomeIcon
                    icon={faXmark}
                    size="xl"
                    className={style.icon}
                    onClick={goBack}
                />
            </div>

            <main className={style.root}>
                <div className={style.calendly}>
                    <h1 className={style.calendlyTitle}>Schedule your office consultation</h1>
                    <p className={style.calendlySentence}>
                        Pick a time that works best. We’ll review your goals and give you clear next steps.
                    </p>

                    <InlineWidget
                        url="https://calendly.com/backyard-estates/new-meeting"
                        styles={{ margin: '0px', height: '1000px' }}
                        pageSettings={{
                            backgroundColor: 'ffffff',
                            hideEventTypeDetails: true,
                            hideLandingPageDetails: true,
                            primaryColor: '36484b',
                            textColor: '5e5e5e',
                        }}
                        prefill={{
                            name,
                            email,
                            customAnswers: { a1: `1${phone}`, a2: address ?? '', a3: notes ?? '' },
                            // smsReminderNumber: phone ? `+1${phone}` : undefined,
                        }}
                    />
                </div>
            </main>
        </>
    )
}
