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
            explanation="Our mission is to enable homeowners to reimage their backyard as an estate for themselves or family"
            floorplans={estates}
        >
            <div className={style.content}>
                <Chunk
                    image="/render.jpg"
                    title="Design, plans, and permitting"
                    imagePriority={true}
                >
                    <p>
                        Backyard Estate&rsquo;s mission is to enable anyone who
                        owns a house to make their backyard their estate! We do
                        this by being the best in the business at getting an ADU
                        installed on your property as quick and simple as
                        possible. It all starts with our seamless property
                        review and working with your dedicated design expert to
                        craft the perfect ADU for your property in as little as
                        2 weeks. Next, we handle all of the busy work with
                        permitting, financing, and paperwork to ensure there is
                        no delay to moving forward with your ADU installation.
                        For ground up construction, our crews are in and out of
                        your backyard in 12-16 weeks! You will be updated weekly
                        on your ADUs progress. Lastly, should you decide to go
                        with a manufactured ADU, we have partnered with the best
                        manufacturer in CA. Our crews will make sure that your
                        backyard is prepped for it&rsquo;s delivery.
                    </p>
                </Chunk>
                <Chunk
                    image="/community.jpg"
                    imageRight={true}
                    title="Value to the community"
                >
                    <p>
                        Backyard Estates is providing value to the community in
                        2 main ways. First, we are helping solve the housing
                        shortage crisis in CA. California needs millions more
                        homes and recent legislation has never made it easier to
                        build an ADU. We provide the solution to expand the
                        number of homes available for people to live in. Second,
                        we are enabling middle class individuals and families to
                        earn additional money from renting out a portion of
                        their backyard to ease their financial burden. The
                        average ADU will provide the homeowner $15k/year in
                        profit if rented out and increase the overall value of
                        the property. The median middle class household has only
                        $12k in savings so this additional income can be a huge
                        factor in lifetime financial security.
                    </p>
                </Chunk>
                <Chunk image="/client.jpg" title="Why Backyard Estates">
                    <p>
                        We are experts in the ADU industry and provide the
                        following:
                    </p>
                    <ul>
                        <li>We handle everything with all in pricing</li>
                        <li>
                            Quick and seamless property analysis and ADU design
                        </li>
                        <li>Ground up construction in 12-16 weeks!</li>
                        <li>
                            Partnered with the best off-site ADU manufacturer in
                            CA
                        </li>
                        <li>
                            Prices are lower than our competitors while offering
                            a better product
                        </li>
                        <li>
                            Decades of experience working with cities to submit
                            and approve permits
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
                                Fixed Prices
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
                                Financing Guidance
                            </li>
                            <li>
                                <FontAwesomeIcon
                                    icon={faCheck}
                                    className={style.icon}
                                />
                                Permit approval or money back
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
                                Solar ready
                            </li>
                            <li>
                                <FontAwesomeIcon
                                    icon={faCheck}
                                    className={style.icon}
                                />
                                Guaranteed
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
