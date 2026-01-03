import type { Metadata } from 'next'

import {
    faArrowDown,
    faCalendarCircleUser,
    faClipboardListCheck,
    faExcavator,
    faFileCertificate,
    faHouseLaptop,
    faMoneyCheckDollarPen,
    faPenRuler,
    faPhoneVolume,
    faUserHelmetSafety,
} from '@fortawesome/pro-light-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'

import Catchall from '@/components/AttentionCTA'
import Footer from '@/components/Footer'
import Masthead from '@/components/Masthead'
import Nav from '@/components/Nav'
// import OpenGraph from '@/components/OpenGraph'
import Phase from '@/components/Phase'

import style from './page.module.css'
import AttentionCTA from '@/components/AttentionCTA'

export const metadata: Metadata = {
    title: 'Our process - Backyard Estates',
    description:
        'We manage the entire project, from custom design to permitting, all the way to construction and installation.',
}

export default function OurProcess() {
    return (
        <>
            {/* <OpenGraph title={`Backyard Estates - Our process`} /> */}
            <Nav />
            <Masthead
                title="Our process"
                explanation="We manage the entire project, from custom design to permitting, all the way to construction and installation."
            />
            <main className={style.main}>
                <div className={style.timeline}>
                    <Phase
                        number={1}
                        explanation="Phone call to detail proposal"
                        weeks="1-2"
                    />
                    <div className={style.milestone}>
                        <FontAwesomeIcon
                            icon={faPhoneVolume}
                            size="xl"
                            className={style.icon}
                        />
                        <h3>Initial phone call</h3>
                        <p>
                            Our team will conduct a quick phone call to
                            understand your goals and vision for your backyard,
                            and help determine if Backyard Estates is a good fit
                            for you.
                        </p>
                    </div>
                    <FontAwesomeIcon
                        icon={faArrowDown}
                        size="xl"
                        className={style.icon_arrow}
                    />
                    <div className={style.milestone}>
                        <FontAwesomeIcon
                            icon={faCalendarCircleUser}
                            size="xl"
                            className={style.icon}
                        />
                        <h3>Office Visit</h3>
                        <p>
                            During your office visit we will guide you through
                            our advanced Backyard Estates software. This tool
                            gives us a detailed view of your property, including
                            lot dimensions, zoning data, setbacks, and other key
                            city requirements.
                        </p>
                        <p>
                            Together, we&rsquo;ll explore what&rsquo;s truly
                            possible in your backyard. We&rsquo;ll test
                            different ADU sizes and layouts, place them on your
                            lot in real-time, and even review multiple design
                            options to see what works best. It&rsquo;s the most
                            informative and personalized way to understand the
                            full potential of your space.
                        </p>
                    </div>
                    <FontAwesomeIcon
                        icon={faArrowDown}
                        size="xl"
                        className={style.icon_arrow}
                    />
                    <div className={style.milestone}>
                        <FontAwesomeIcon
                            icon={faPenRuler}
                            size="xl"
                            className={style.icon}
                        />
                        <h3>Formal Property Analysis</h3>
                        <p>
                            Our research team will review all your property
                            specific information, while our on-site team
                            performs an in-depth assessment at your home.
                        </p>
                        <p>
                            Then, our team will cross-correlated its findings
                            with each requirement within the various city
                            departments to produce unmatched insights for your
                            property and project!
                        </p>
                    </div>
                    <FontAwesomeIcon
                        icon={faArrowDown}
                        size="xl"
                        className={style.icon_arrow}
                    />
                    <div className={style.milestone}>
                        <FontAwesomeIcon
                            icon={faHouseLaptop}
                            size="xl"
                            className={style.icon}
                        />
                        <h3>Detailed proposal</h3>
                        <p>
                            During your Proposal Meeting, you will revisit all
                            the details of your ADU design and inclusions. Then
                            we will review each of the unique property
                            characteristics that will impact your project.
                            Finally, we will provide accurate pricing and
                            real-time numbers related to your investment!
                        </p>
                    </div>
                    <Phase
                        number={2}
                        explanation="Financing to Permitting"
                        weeks="10-22"
                    />
                    <div className={style.milestone}>
                        <FontAwesomeIcon
                            icon={faMoneyCheckDollarPen}
                            size="xl"
                            className={style.icon}
                        />
                        <h3>Site Visit</h3>
                        <p>
                            Once your ADU project is officially launched, our
                            Architectural Team comes out onsite to ensure your
                            plans are completed to perfection.
                        </p>
                    </div>
                    <FontAwesomeIcon
                        icon={faArrowDown}
                        size="xl"
                        className={style.icon_arrow}
                    />
                    <div className={style.milestone}>
                        <FontAwesomeIcon
                            icon={faClipboardListCheck}
                            size="xl"
                            className={style.icon}
                        />

                        <h3>Permitting</h3>
                        <p>
                            We will submit all the necessary permitting with
                            your city to make sure your ADU is approved. And
                            don&rsquo;t worry about those pesky City Fees, those
                            are already included in our pricing.
                        </p>
                    </div>
                    <FontAwesomeIcon
                        icon={faArrowDown}
                        size="xl"
                        className={style.icon_arrow}
                    />
                    <div className={style.milestone}>
                        <FontAwesomeIcon
                            icon={faFileCertificate}
                            size="xl"
                            className={style.icon}
                        />
                        <h3> Permit Approval</h3>
                        <p>
                            Our integrated process, allows us to begin prepping
                            for construction even before your permit is pulled.
                            This saves you time, often avoiding months in delays
                            that plague the industry.
                        </p>
                    </div>
                    <Phase
                        number={3}
                        explanation="Construction to occupancy"
                        weeks="6-12"
                    />
                    <div className={style.milestone}>
                        <FontAwesomeIcon
                            icon={faExcavator}
                            size="xl"
                            className={style.icon}
                        />
                        <h3>Pre-Construction Meeting</h3>
                        <p>
                            Prior to breaking ground, our team will review every
                            detail of the project, from your schedule, to work
                            hours, where we will stage materials, point of
                            access, and many other key details.
                        </p>
                    </div>
                    <FontAwesomeIcon
                        icon={faArrowDown}
                        size="xl"
                        className={style.icon_arrow}
                    />
                    <div className={style.milestone}>
                        <FontAwesomeIcon
                            icon={faUserHelmetSafety}
                            size="xl"
                            className={style.icon}
                        />
                        <h3>Construction</h3>
                        <p>
                            Our goal is to be in and out of your property in 12
                            weeks. Our crews are efficient, friendly, and
                            accurate.
                        </p>
                    </div>
                    <FontAwesomeIcon
                        icon={faArrowDown}
                        size="xl"
                        className={style.icon_arrow}
                    />
                    <div className={style.milestone}>
                        <FontAwesomeIcon
                            icon={faFileCertificate}
                            size="xl"
                            className={style.icon}
                        />
                        <h3>Final Inspection &amp; Move-in</h3>
                        <p>
                            Once installation is done, the city will review the
                            ADU and provide Final Approval. You may now live in
                            or rent out your ADU.
                        </p>
                    </div>
                </div>
                <AttentionCTA
                    eyebrow="Get Started"
                    title="Start your ADU journey today"
                    description="Expand your income and livable space with a thoughtfully designed ADU. Our team handles everything — from feasibility to final build."
                    primaryLabel="Talk to an ADU Specialist"
                    primaryHref="/talk-to-an-adu-specialist"
                    secondaryText="Or call (425) 494-4705"
                    secondaryHref="tel:+4254944705"
                />
            </main>
            <Footer />
        </>
    )
}
