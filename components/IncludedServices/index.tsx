import { SERVICES } from '@/content/inclusions'

import { Landmark, BadgeCheck, Check, GraduationCap } from 'lucide-react'

import style from './IncludedServices.module.css'

export default function IncludedServices() {
    return (
        <section className={style.panel}>
            <div className={style.intro}>
                <span className={style.eyebrow}>No surprise costs</span>
                <h3 className={style.title}>
                    Every city fee &amp; department &mdash;{' '}
                    <em>handled, not extra</em>
                </h3>
                <p className={style.lede}>
                    Permitting an ADU yourself means months chasing approvals
                    across a dozen agencies, with surprise invoices at every
                    step. We coordinate all of it and pay every city fee, so
                    nothing lands on your desk later.
                </p>
            </div>

            {/* Two promises, side by side */}
            <div className={style.pillars}>
                <div className={style.pillar}>
                    <div className={style.pillarHead}>
                        <Landmark
                            className={style.pillarIcon}
                            aria-hidden="true"
                        />
                        <div>
                            <span className={style.pillarLabel}>
                                Departments we coordinate
                            </span>
                            <span className={style.pillarSub}>
                                From planning to fire to your utility provider
                                &mdash; we manage every back-and-forth.
                            </span>
                        </div>
                    </div>
                    <ul className={style.chips}>
                        {SERVICES.departments.map((dept) => (
                            <li key={dept} className={style.chip}>
                                {dept}
                            </li>
                        ))}
                    </ul>
                </div>

                <div className={style.pillar}>
                    <div className={style.pillarHead}>
                        <BadgeCheck
                            className={style.pillarIcon}
                            aria-hidden="true"
                        />
                        <div>
                            <span className={style.pillarLabel}>
                                Fees we pay for you
                            </span>
                            <span className={style.pillarSub}>
                                Every line below is already covered by your
                                all-in price.
                            </span>
                        </div>
                    </div>
                    <ul className={style.fees}>
                        {SERVICES.fees.map((fee) => (
                            <li key={fee} className={style.fee}>
                                <Check
                                    className={style.feeIcon}
                                    aria-hidden="true"
                                />
                                <span>{fee}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>

            <p className={style.note}>
                <GraduationCap className={style.noteIcon} aria-hidden="true" />
                <span>
                    <strong>Impact fees</strong> are separate, city-imposed
                    charges that some cities apply to larger ADUs &mdash;
                    typically above 750 or 800 sq ft, depending on the city.
                    When one applies to your property, we identify it upfront
                    during your <strong>Formal Property Analysis</strong>, so
                    it&rsquo;s never a surprise.
                </span>
            </p>

        </section>
    )
}
