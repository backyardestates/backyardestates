import OpenGraph from '@/components/OpenGraph'
import Layout from '../../src/layouts/LeadForm'

import { InlineWidget } from 'react-calendly'
import style from './Form.module.css'

export default function Calendly() {
    return (
        <Layout>
            <OpenGraph title={`Backyard Estates - Calendly form`} />
            <div className={style.calendly}>
                <h1 className={style.calendlyTitle}>
                    Talk to an ADU specialist
                </h1>
                <p className={style.calendlySentence}>
                    Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed
                    do eiusmod tempor incididunt ut labore et dolore
                </p>
                <InlineWidget
                    className={style.g}
                    url="https://calendly.com/adam-735/15min?hide_gdpr_banner=1"
                    styles={{
                        margin: '0px',
                        height: '1000px',
                    }}
                    pageSettings={{
                        backgroundColor: 'f7f7f7',
                        hideEventTypeDetails: true,
                        hideLandingPageDetails: true,
                        primaryColor: '36484b',
                        textColor: '5e5e5e',
                    }}
                />
            </div>
        </Layout>
    )
}
