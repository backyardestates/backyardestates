import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'
// import Link from 'next/link'
import Layout from '../../../src/layouts/Page'
import style from './OurProcess.module.css'

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
    faPhoneVolume,
    faFileCertificate,
    faScrewdriverWrench,
    faUserHelmetSafety,
    faPenRuler,
    faExcavator,
    faClipboardListCheck,
    faMoneyCheckDollarPen,
    faCalendarCircleUser,
    faHouseLaptop,
} from '@fortawesome/pro-regular-svg-icons'
import { faArrowDown } from '@fortawesome/pro-light-svg-icons'
// import Pill from '@/components/Pill'
import Phase from '@/components/Phase'

export default function OurProcess({ estates }) {
    return (
        <Layout
            title="Our process"
            pageTitle="Our process - Backyard Estates"
            explanation="We manage the entire project, from custom design to permitting, all the way to construction and installation."
            floorplans={estates}
        >
            <div className={style.timeline}>
                <Phase
                    number={1}
                    explanation="Phone call to detail proposal"
                    weeks="4-5"
                />
                <div className={style.milestone}>
                    <FontAwesomeIcon
                        icon={faPhoneVolume}
                        size="xl"
                        className={style.icon}
                    />
                    <h3>Initial phone call</h3>
                    <p>
                        Our team will conduct a quick phone call to understand
                        your goals and vision for your backyard, as well as if
                        Backyard Estates is a good fit for you.
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
                    <h3>Virtual site visit</h3>
                    <p>
                        We will meet on Zoom and go in depth in which ADU you
                        want, how it will be oriented in your yard, and some
                        additional site-specific costs that are unique to your
                        yard.
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
                    <h3>Site visit and design</h3>
                    <p>
                        We visit your property to create ADU installation
                        gameplan. Lastly, we will finalize all of your design
                        choices.
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
                        We present our project proposal, how much it will cost,
                        and what the timeline will be.
                    </p>
                </div>
                <Phase
                    number={2}
                    explanation="Financing to Manufacturing"
                    weeks="8-16"
                />
                <div className={style.milestone}>
                    <FontAwesomeIcon
                        icon={faMoneyCheckDollarPen}
                        size="xl"
                        className={style.icon}
                    />
                    <h3>Financing</h3>
                    <p>
                        With our financial partner (or your own), we will guide
                        you through the process of getting the necessary
                        financing.
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
                        We will submit all the necessary permitting with your
                        city to make sure your ADU is approved and legal.
                    </p>
                </div>
                <FontAwesomeIcon
                    icon={faArrowDown}
                    size="xl"
                    className={style.icon_arrow}
                />
                <div className={style.milestone}>
                    <FontAwesomeIcon
                        icon={faScrewdriverWrench}
                        size="xl"
                        className={style.icon}
                    />
                    <h3>Manufacturing</h3>
                    <p>
                        If you&rsquo;re doing a prefab unit, our manufacturing
                        partner will take your design, and make it a reality in
                        as little as 3 months.
                    </p>
                </div>
                <Phase
                    number={3}
                    explanation="Construction to occupancy"
                    weeks="12-16"
                />
                <div className={style.milestone}>
                    <FontAwesomeIcon
                        icon={faExcavator}
                        size="xl"
                        className={style.icon}
                    />
                    <h3>On-site work</h3>
                    <p>
                        Remove obstructions, build the foundation, and prepare
                        necessary utility/piping connections.
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
                        weeks. Our crews are efficient, friendly, and accurate.
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
                    <h3>Certificate of occupancy</h3>
                    <p>
                        Once installation is done, the city will review the ADU
                        and grant this certificate. You may now live in or rent
                        out your ADU.
                    </p>
                </div>
            </div>
        </Layout>
    )
}

export async function getStaticProps() {
    // console.log(`files:`)
    const files = fs.readdirSync(path.join('data'))
    // console.log(`files: ${files}`)

    const estates = files.map((filename) => {
        const slug = filename.replace('.md', '')
        const markdown = fs.readFileSync(path.join('data', filename), 'utf-8')
        const { data: frontmatter } = matter(markdown)
        return {
            slug,
            frontmatter,
        }
    })
    return { props: { estates } }
}
