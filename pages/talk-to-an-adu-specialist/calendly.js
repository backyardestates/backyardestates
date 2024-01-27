import { useEffect } from 'react'
import { useRouter } from 'next/router'
import OpenGraph from '@/components/OpenGraph'
import Layout from '../../src/layouts/LeadForm'
import { InlineWidget } from 'react-calendly'

import style from './Form.module.css'

export default function Calendly() {
    const router = useRouter()

    let name = ''

    useEffect(() => {
        if (router.isReady) {
            name = router.query.name
            console.log(name)
        }
    }, [router.isReady, router.pathname, router.query])

    return (
        <Layout path={router.pathname}>
            <OpenGraph title={`Backyard Estates - Calendly form`} />
            <div className={style.calendly}>
                <h1 className={style.calendlyTitle}>
                    Schedule your Backyard Estates call
                </h1>
                <p className={style.calendlySentence}>
                    Keep an eye out for a link via text message, which will
                    provide additional details and prepare you for our upcoming
                    call.
                </p>
                <InlineWidget
                    url="https://calendly.com/adam-735/15min?hide_gdpr_banner=1"
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
                        name: router.query.name,
                        email: router.query.email,
                        // smsReminderNumber: `+1${router.query.phone}`,
                        customAnswers: {
                            a1: router.query.address,
                        },
                    }}
                />
            </div>
        </Layout>
    )
}
