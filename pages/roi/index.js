import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'

// import Button from '@/components/Button'
import Layout from '../../src/layouts/Page'
import style from './Roi.module.css'
import CallToAction from '@/components/CallToAction'
import Footer from '@/components/Footer'

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
    faChartMixedUpCircleDollar,
    faHouseCircleCheck,
    faSwatchbook,
    faHandHoldingDollar,
} from '@fortawesome/pro-light-svg-icons'
import Chunk from '@/components/Chunk'

export default function ReturnOnInvestment({ estates }) {
    return (
        <Layout
            title="Return on investment"
            pageTitle="ROI - Backyard Estates"
            explanation="Take advantage of your underutilized land and new California laws. Convert your backyard into rental income with an Accessory Dwelling Unit (ADU)."
            floorplans={estates}
        >
            <div className={style.content}>
                <Chunk
                    image="/city.jpg"
                    title="Rental income at a discount"
                    imagePriority={true}
                >
                    <p>
                        Remove the need to pay for expensive land and
                        construction. Take advantage of space that is already
                        underutilized or even a drain on your resources. You
                        will find that almost any property in our market can see
                        increased cash flows of $1000, after financing.
                    </p>
                </Chunk>
                <Chunk
                    image="/house.jpg"
                    title="Increase property value"
                    imageRight={true}
                >
                    <p>
                        Building an ADU adds new functional square footage to
                        your property. This is the most obvious value add, as
                        viewed by current appraisal norms. You are also adding a
                        rentable unit. Each of these factors contributes to an
                        increase in appraised value of the home. The value add
                        can vary depending on the location and appraiser but can
                        provide significant benefit in the short term and long
                        term.
                    </p>
                </Chunk>

                <div className={style.cost_factors}>
                    <h2>Our investment advantage</h2>
                    <ul className={style.factors}>
                        <li className={style.factor}>
                            <FontAwesomeIcon
                                icon={faChartMixedUpCircleDollar}
                                size="xl"
                                className={style.icon}
                            />
                            <h3>Highest market values</h3>
                            <p>
                                Backyard Estates was made by investors for
                                investors. We understand that you need to
                                maximize ROI through both reducing the pull on
                                any and all of your resources. Our portfolio
                                line of units are custom tailored to maximize
                                your dollars and time.
                            </p>
                        </li>
                        <li className={style.factor}>
                            <FontAwesomeIcon
                                icon={faHandHoldingDollar}
                                size="xl"
                                className={style.icon}
                            />
                            <h3>Opportunity cost</h3>
                            <p>
                                We understand that you are busy and your time is
                                valuable. Rather than spending hours on end in
                                design, permitting, vetting contractors,
                                construction, site prep, and inspections, we
                                handle it all so you can benefit from a true “No
                                hassle, just cash flow” approach.
                            </p>
                        </li>
                        <li className={style.factor}>
                            <FontAwesomeIcon
                                icon={faSwatchbook}
                                size="xl"
                                className={style.icon}
                            />
                            <h3>Curated design packages</h3>
                            <p>
                                One of the most time consuming aspects of
                                construction is design. We simplify this we
                                curated “rental” focused design packages that
                                are appealing, functional, and value add focused
                            </p>
                        </li>
                        <li className={style.factor}>
                            <FontAwesomeIcon
                                icon={faHouseCircleCheck}
                                size="xl"
                                className={style.icon}
                            />
                            <h3>Property analysis</h3>
                            <p>
                                Your property has untapped potential. We will
                                extensively analyze your property and determine
                                what unit and options are ideal for rentals in
                                that area.
                            </p>
                        </li>
                    </ul>
                </div>

                <CallToAction
                    title="All-inclusive pricing"
                    ctaLabel="View pricing"
                    ctaUrl="/pricing"
                >
                    <p>
                        Our prices include everything, property specific
                        analysis, permiting, design, enginerring, construction,
                        and installation. We even include all the appliances,
                        site prep, and utility hookups. There are no hidden
                        fees, change orders, or unforseen upcharges. We remove
                        all the hassle of traditional construction. You will
                        know exactly what you will pay after your property
                        analysis.
                    </p>
                </CallToAction>
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
