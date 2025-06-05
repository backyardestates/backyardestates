import { type SanityDocument } from 'next-sanity'
import { client } from '@/sanity/client'

import Link from 'next/link'
import type { Metadata } from 'next'

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
    faBallotCheck,
    faExcavator,
    faVialCircleCheck,
    faRulerCombined,
} from '@fortawesome/pro-light-svg-icons'

import Annoucement from '@/components/Announcement'
import CallToAction from '@/components/CallToAction'
import Catchall from '@/components/Catchall'
import Footer from '@/components/Footer'
import Masthead from '@/components/Masthead'
import Nav from '@/components/Nav'
import StandaloneLink from '@/components/StandaloneLink'

import style from './page.module.css'

import { USDollar } from '@/utils/currency'

export const metadata: Metadata = {
    title: 'Pricing - Backyard Estates',
    description:
        "They say money doesn't grow on trees, but it can certainly grow in your backyard. Invest in an Accessory Dwelling Unit (ADU) and watch your estate grow.",
}

const FLOORPLANS_QUERY = `*[_type == "floorplan"]|order(orderID asc){orderID, isClickable, slug, name, bed, bath, length, width, price}`
const options = { next: { revalidate: 30 } }

export default async function Pricing() {
    const floorplans = await client.fetch<SanityDocument[]>(
        FLOORPLANS_QUERY,
        {},
        options
    )

    return (
        <>
            <Annoucement />
            <Nav />
            <Masthead
                title="Pricing"
                explanation="They say money doesn't grow on trees, but it can certainly grow in your backyard. Invest in an Accessory Dwelling Unit (ADU) and watch your estate grow."
            />
            <main className="centered">
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
                                <td className="left">
                                    Design, plans, and permits
                                </td>
                                <td>Included</td>
                                <td>$15K+</td>
                            </tr>
                            <tr>
                                <td className="left">
                                    Site prep and utility connections
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
                                <td>$185K</td>
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
                            {floorplans.map((floorplan, index) => (
                                <tr key={index}>
                                    {floorplan.isClickable ? (
                                        <td>
                                            <Link
                                                href={`/floorplans/${floorplan.slug.current}`}
                                                className={style.link}
                                            >
                                                {floorplan.name}
                                            </Link>
                                        </td>
                                    ) : (
                                        <td>{floorplan.name}</td>
                                    )}

                                    <td>{floorplan.bed}</td>
                                    <td>{floorplan.bath}</td>
                                    <td>
                                        {`${floorplan.length} x ${floorplan.width}`}
                                    </td>
                                    <td>{USDollar.format(floorplan.price)}</td>
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
                                    The type of materials selected for the ADU
                                    can also impact the project&rsquo;s cost and
                                    time. High-end materials will typically cost
                                    more and may require more time to install.
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
                                    existing home than normal, we will need to
                                    extend our standard utility inclusions. This
                                    increases material and labor costs. Any cost
                                    increases will be analyzed during your
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
                                    Certain areas have different soil
                                    requirements and might require additional
                                    soils testing, over-excavation, or a
                                    retaining wall. This is determined on a
                                    site-by-site basis and will be covered in
                                    your analysis.
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
                                    Required demolition of additional structures
                                    or very large trees will require additional
                                    equipment, labor, and disposal costs. These
                                    additional costs and any other site or
                                    city-specific factors will be reviewed and
                                    verified during the Formal Property Analysis
                                    stage of your project.
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
                            Accessory Dwelling Units (ADUs) are a compelling
                            investment opportunity. There&rsquo;s never been a
                            better time to expand your cash flow and return on
                            investment on a property-by-property basis.
                            We&rsquo;re investment specialists ready to help
                            maximize your property rental potential.
                        </p>
                    </CallToAction>
                </div>
                <Catchall />
            </main>
            <Footer />
        </>
    )
}
