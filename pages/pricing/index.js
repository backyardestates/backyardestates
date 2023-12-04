import Layout from '../../src/layouts/Page'
import StandaloneLink from '@/components/StandaloneLink'
import style from './Pricing.module.css'
import Pill from '@/components/Pill'

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
    faBallotCheck,
    faExcavator,
    faVialCircleCheck,
    faRulerCombined,
} from '@fortawesome/pro-light-svg-icons'

export default function Pricing() {
    return (
        <Layout
            title="Pricing"
            explanation="They say money doesn&rsquo;t grow on trees, but it can certainly grow in your
            backyard. Invest in an Accessory Dwelling Unit (ADU) and watch your estate grow."
        >
            <div className={style.content}>
                <h2>All-Inclusive pricing comparison</h2>
                <table>
                    <thead>
                        <tr>
                            <th scope="col">Estate 350</th>
                            <th scope="col">Our Price</th>
                            <th scope="col">Other Builders</th>
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
                                $175K
                                <br />
                                <br />
                                <Pill>Save up to $75K</Pill>
                            </td>
                            <td>$250K+</td>
                        </tr>
                    </tfoot>
                </table>

                <h2>Pricing by floor plan</h2>
                <table>
                    <thead>
                        <tr>
                            <th>Floor plan</th>
                            <th>Bedrooms</th>
                            <th>Bathrooms</th>
                            <th>Dimensions</th>
                            <th>All-in cost</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>Estate 350</td>
                            <td>Studio</td>
                            <td>1</td>
                            <td>28&prime;1&Prime; x 12&prime;1&Prime;</td>
                            <td>$155K</td>
                        </tr>
                        <tr>
                            <td>Estate 450</td>
                            <td>1</td>
                            <td>1</td>
                            <td>35&prime;6&Prime; x 13&prime;1&Prime;</td>
                            <td>$199K</td>
                        </tr>
                        <tr>
                            <td>Estate 500</td>
                            <td>2</td>
                            <td>1</td>
                            <td>38&prime; x 13&prime;4&Prime;</td>
                            <td>$219K</td>
                        </tr>
                        <tr>
                            <td>Estate 750</td>
                            <td>2</td>
                            <td>1</td>
                            <td>28&prime;1&Prime; x 12&prime;1&Prime;</td>
                            <td>$175K</td>
                        </tr>
                        <tr>
                            <td>Estate 750+</td>
                            <td>2</td>
                            <td>2</td>
                            <td>40&prime;8&Prime; x 18&prime;5&Prime;</td>
                            <td>$185K</td>
                        </tr>
                        <tr>
                            <td>Estate 800</td>
                            <td>2</td>
                            <td>2</td>
                            <td>40&prime; x 20&prime;</td>
                            <td>$299K</td>
                        </tr>
                        <tr>
                            <td>Estate 900</td>
                            <td>3</td>
                            <td>2</td>
                            <td>40&prime; x 23&prime;8&Prime;</td>
                            <td>$329K</td>
                        </tr>

                        <tr>
                            <td>Estate 1200</td>
                            <td>3</td>
                            <td>2</td>
                            <td>?</td>
                            <td>$379K</td>
                        </tr>
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
                                may require more time to install than more basic
                                options
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
                                increases in cost will be analyzed in the
                                initial property analysis.
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
                                and might require additional soil testing or a
                                retaining wall. This is determined on a site by
                                site basis and will be covered in your analysis.
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
                                equipment, labor, and disposal costs. This is
                                reviewed in the analysis stage of the project.
                            </p>
                        </li>
                    </ul>
                </div>
                <div className={style.call_to_action}>
                    <h3>Potential Return on investment (ROI)</h3>
                    <p>
                        Accessory Dwelling Units (ADU&rsquo;s) are a compelling
                        investment opportunity. There&rsquo;s never been a
                        better time to expand your cash flow and return on a
                        property by property basis. We&rsquo;re investment
                        specialists ready to help maximize your property rental
                        potential.
                    </p>
                    <StandaloneLink href="/roi">
                        Explore ADU rental advantages
                    </StandaloneLink>
                </div>
            </div>
        </Layout>
    )
}
