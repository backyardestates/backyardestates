import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'

import Link from 'next/link'

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
    faBallotCheck,
    faExcavator,
    faVialCircleCheck,
    faRulerCombined,
} from '@fortawesome/pro-light-svg-icons'

import Layout from '../../src/layouts/Page'
import Pill from '@/components/Pill'
import CallToAction from '@/components/CallToAction'
import StandaloneLink from '@/components/StandaloneLink'
import Button from '@/components/Button'

import style from './Pricing.module.css'

export default function Pricing({ estates }) {
    // filter properties for floor plans
    const filteredProperties = estates.filter(
        (property) => property.frontmatter.isFloorplan
    )

    return (
        <Layout
            title="Pricing"
            pageTitle="Pricing - Backyard Estates"
            explanation="They say money doesn&rsquo;t grow on trees, but it can certainly grow in your
            backyard. Invest in an Accessory Dwelling Unit (ADU) and watch your estate grow."
            floorplans={estates}
        >
            <div className={style.content}>
                <h2>All-Inclusive pricing comparison</h2>
                <table>
                    <thead>
                        <tr>
                            <th scope="col">Estate 350</th>
                            <th scope="col">Our Price</th>
                            <th scope="col">Others</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td className="left">Unit</td>
                            <td>Included</td>
                            <td>$155K</td>
                        </tr>
                        <tr>
                            <td className="left">Design, plans, and permits</td>
                            <td>Included</td>
                            <td>$15K+</td>
                        </tr>
                        <tr>
                            <td className="left">
                                Site Prep and Utility Connections
                            </td>
                            <td>Included</td>
                            <td>$50K+</td>
                        </tr>
                        <tr>
                            <td className="left">
                                Appliances, fixtures, and finishes
                            </td>
                            <td>Included</td>
                            <td>$20K+</td>
                        </tr>
                        <tr>
                            <td className="left">
                                Expedited timelines and delivery
                            </td>
                            <td>Included</td>
                            <td>$10K+</td>
                        </tr>
                    </tbody>
                    <tfoot>
                        <tr>
                            <td className="left">Total</td>
                            <td>
                                $185K
                                <br />
                                <br />
                                <Button href="/talk-to-an-adu-specialist">
                                    Save up to $65K
                                </Button>
                            </td>
                            <td>$250K+</td>
                        </tr>
                    </tfoot>
                </table>

                <h2>Pricing by floor plan</h2>
                <table className={style.pricingByFloorplan}>
                    <thead>
                        <tr>
                            <th>Floor plan</th>
                            <th>Bed</th>
                            <th>Bath</th>
                            <th>Dimensions</th>
                            <th>All-in cost</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredProperties.map((floorplan, index) => (
                            <tr key={index}>
                                {floorplan.frontmatter.isClickable ? (
                                    <td>
                                        <Link
                                            href={`/floor-plans/${floorplan.slug}`}
                                            className={style.link}
                                        >
                                            {floorplan.frontmatter.title}
                                        </Link>
                                    </td>
                                ) : (
                                    <td>{floorplan.frontmatter.title}</td>
                                )}

                                <td>{floorplan.frontmatter.bed}</td>
                                <td>{floorplan.frontmatter.bath}</td>
                                <td>
                                    {floorplan.frontmatter.dimension[0]}&prime;
                                    {floorplan.frontmatter.dimension[1]}&Prime;
                                    x {floorplan.frontmatter.dimension[2]}
                                    &prime;{floorplan.frontmatter.dimension[3]}
                                    &Prime;
                                </td>
                                <td>{floorplan.frontmatter.price}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                <div className={style.cost_factors}>
                    <h2>Cost and time factors</h2>
                    <ul className={style.factors}>
                        <li className={style.factor}>
                            <FontAwesomeIcon
                                icon={faBallotCheck}
                                size="xl"
                                className={style.icon}
                            />
                            <h3>Material selection</h3>
                            <p>
                                The type of materials selected for the ADU can
                                also impact the project&rsquo;s cost and time.
                                High-end materials will typically cost more and
                                may require more time to install.
                            </p>
                        </li>
                        <li className={style.factor}>
                            <FontAwesomeIcon
                                icon={faRulerCombined}
                                size="xl"
                                className={style.icon}
                            />
                            <h3>Property depth</h3>
                            <p>
                                If your new ADU is placed farther from the
                                existing home than normal, we will have to
                                extend our standard utility inclusions. This
                                increases material and labor costs. Any
                                increases in cost will be analyzed during your
                                Formal Property Analysis.
                            </p>
                        </li>
                        <li className={style.factor}>
                            <FontAwesomeIcon
                                icon={faVialCircleCheck}
                                size="xl"
                                className={style.icon}
                            />
                            <h3>Site conditions</h3>
                            <p>
                                Certain areas have different soil requirements
                                and might require additional soils testing, over
                                excavation, or a retaining wall. This is
                                determined on a site by site basis and will be
                                covered in your analysis.
                            </p>
                        </li>
                        <li className={style.factor}>
                            <FontAwesomeIcon
                                icon={faExcavator}
                                size="xl"
                                className={style.icon}
                            />
                            <h3>Demolition</h3>
                            <p>
                                Required demolition of additional structures or
                                very large trees will require additional
                                equipment, labor, and disposal costs. These
                                additional costs and any other site or city
                                specific factors will be reviewed and verified
                                during the Formal Property Analysis stage of
                                your project.
                            </p>
                        </li>
                    </ul>
                </div>
                <div className={style.centered}>
                    <StandaloneLink href="/talk-to-an-adu-specialist">
                        Get your all-in price estimate today
                    </StandaloneLink>
                </div>

                <CallToAction
                    title="Potential Return on investment (ROI)"
                    ctaLabel="Explore ADU rental advantages"
                    ctaUrl="/roi"
                >
                    <p>
                        Accessory Dwelling Units (ADU&rsquo;s) are a compelling
                        investment opportunity. There&rsquo;s never been a
                        better time to expand your cash flow and return on a
                        property by property basis. We&rsquo;re investment
                        specialists ready to help maximize your property rental
                        potential.
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
