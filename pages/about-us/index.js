import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'
import Chunk from '@/components/Chunk'
import Layout from '../../src/layouts/Page'

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
    faCheck,
    faTriangleExclamation,
} from '@fortawesome/pro-regular-svg-icons'
import style from './AboutUs.module.css'

export default function AboutUs({ estates }) {
    return (
        <Layout
            title="About us"
            pageTitle="About us - Backyard Estates"
            explanation="Our mission is to enable homeowners to make your ADU dreams a reality!"
            floorplans={estates}
        >
            <div className={style.content}>
                <Chunk
                    image="/render.jpg"
                    title="Design, plans, and permitting"
                    imagePriority={true}
                >
                    <p>
                        Backyard Estates&rsquo; mission is to enable anyone who
                        owns a house to make their backyard their estate!
                        Backyard Estates specializes in ADU&rsquo;s; we handle
                        every detail, so you don&rsquo;t have to!
                    </p>
                    <p>
                        Our proven, end-to-end, process allows us to provide
                        customers with accurate pricing upfront as well as
                        customized financing options.
                    </p>
                    <p>
                        We provide homeowner&rsquo;s a hands free experience and
                        save them ten&rsquo;s of thousands of dollars by
                        handling all design, permitting, and construction in
                        half the time!
                    </p>
                </Chunk>
                <Chunk
                    image="/community.jpg"
                    imageRight={true}
                    title="Value to the community"
                >
                    <p>
                        Backyard Estates is dedicated to helping solve the
                        housing crisis in California by making it easier and
                        quicker to build an ADU, while offering unmatched
                        pricing transparency!
                    </p>
                    <p>
                        With our proprietary ADU Formal Property Analysis, we
                        can ensure families have the information needed to know
                        if an ADU is right for them, even before any plans or
                        permitting need to be paid.
                    </p>
                </Chunk>
                <Chunk image="/client.jpg" title="Why Backyard Estates">
                    <p>
                        We are experts in the ADU industry and provide the
                        following:
                    </p>
                    <ul>
                        <li>We handle everything with all-in pricing</li>
                        <li>
                            Quick and seamless property analysis and ADU design
                        </li>
                        <li>Ground up construction in 8-12 weeks!</li>
                        <li>
                            Partnered with the best off-site ADU manufacturer in
                            CA
                        </li>
                        <li>
                            Competitive pricing with unmatched timelines and
                            quality
                        </li>
                        <li>
                            Decades of experience in every aspect of your ADU
                            project
                        </li>
                        <li>
                            Construction team is fast, efficient, and accurate
                        </li>
                    </ul>
                </Chunk>
                <div className={style.benefit}>
                    <h2>Simply choose a floor plan and design package</h2>
                    <p>Backyard Estates will handle everything else</p>
                </div>
                <div className={style.pros_and_cons}>
                    <div className={style.pros}>
                        <h3>Backyard Estates</h3>
                        <ul>
                            <li>
                                <FontAwesomeIcon
                                    icon={faCheck}
                                    className={style.icon}
                                />
                                Accurate Pricing Upfront
                            </li>
                            <li>
                                <FontAwesomeIcon
                                    icon={faCheck}
                                    className={style.icon}
                                />
                                Free Designs
                            </li>
                            <li>
                                <FontAwesomeIcon
                                    icon={faCheck}
                                    className={style.icon}
                                />
                                Financing Options
                            </li>
                            <li>
                                <FontAwesomeIcon
                                    icon={faCheck}
                                    className={style.icon}
                                />
                                100% of Permits Approved
                            </li>
                            <li>
                                <FontAwesomeIcon
                                    icon={faCheck}
                                    className={style.icon}
                                />
                                Full project management
                            </li>
                            <li>
                                <FontAwesomeIcon
                                    icon={faCheck}
                                    className={style.icon}
                                />
                                Solar
                            </li>
                            <li>
                                <FontAwesomeIcon
                                    icon={faCheck}
                                    className={style.icon}
                                />
                                Guaranteed Results
                            </li>
                            <li>
                                <FontAwesomeIcon
                                    icon={faCheck}
                                    className={style.icon}
                                />
                                Quick timelines
                            </li>
                        </ul>
                    </div>
                    <div className={style.cons}>
                        <h3>Typical contractor</h3>
                        <ul>
                            <li>
                                <FontAwesomeIcon
                                    icon={faTriangleExclamation}
                                    className={style.icon}
                                />
                                No price guarantee
                            </li>
                            <li>
                                <FontAwesomeIcon
                                    icon={faTriangleExclamation}
                                    className={style.icon}
                                />
                                Expensive designs{' '}
                            </li>
                            <li>
                                <FontAwesomeIcon
                                    icon={faTriangleExclamation}
                                    className={style.icon}
                                />
                                Betterhave cash
                            </li>
                            <li>
                                <FontAwesomeIcon
                                    icon={faTriangleExclamation}
                                    className={style.icon}
                                />
                                Permit denial risk
                            </li>
                            <li>
                                <FontAwesomeIcon
                                    icon={faTriangleExclamation}
                                    className={style.icon}
                                />
                                Responsible for only parts
                            </li>
                            <li>
                                <FontAwesomeIcon
                                    icon={faTriangleExclamation}
                                    className={style.icon}
                                />
                                Solar additional cost
                            </li>
                            <li>
                                <FontAwesomeIcon
                                    icon={faTriangleExclamation}
                                    className={style.icon}
                                />
                                Delayed
                            </li>
                            <li>
                                <FontAwesomeIcon
                                    icon={faTriangleExclamation}
                                    className={style.icon}
                                />
                                Disruptive timelines
                            </li>
                        </ul>
                    </div>
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
