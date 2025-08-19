'use client'

import { useRouter, useSearchParams } from 'next/navigation'
// import type { Metadata } from 'next'

import { InlineWidget } from 'react-calendly'

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faXmark } from '@fortawesome/pro-solid-svg-icons'

import Logo from '@/components/Logo'
// import OpenGraph from '@/components/OpenGraph'

import style from '../Form.module.css'

// export const metadata: Metadata = {
//     title: 'Schedule an appoint - Backyard Estates',
// }


export default function Calendly() {
    const router = useRouter()

    const searchParams = useSearchParams()
    const name = searchParams.get('name')
    const email = searchParams.get('email')
    const phone = searchParams.get('phone')
    const address = searchParams.get('address')

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
                {/* <OpenGraph title={`Backyard Estates - Calendly form`} /> */}
                <div className={style.calendly}>
                    <h1 className={style.calendlyTitle}>
                        Schedule your Backyard Estates call
                    </h1>
                    <p className={style.calendlySentence}>
                        Keep an eye out for a link via text message, which will
                        provide additional details and prepare you for our
                        upcoming call.
                    </p>
                    {/* <Suspense> */}
                    <InlineWidget
                        url="https://calendly.com/backyard-estates/intro-call"
                        styles={{
                            margin: '0px',
                            height: '1000px',
                        }}
                        pageSettings={{
                            backgroundColor: 'ffffff',
                            hideEventTypeDetails: true,
                            hideLandingPageDetails: true,
                            primaryColor: '36484b',
                            textColor: '5e5e5e',
                        }}
                        prefill={{
                            name: name!,
                            email: email!,
                            // smsReminderNumber: `+1${phone}`,
                            customAnswers: {
                                a1: address!,
                            },
                        }}
                    />
                    {/* </Suspense> */}
                </div>
            </main>
        </>
    )
}
