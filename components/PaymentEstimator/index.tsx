'use client'

import { useMemo, useState } from 'react'
import { TrendingUp, TrendingDown, ArrowRight, Info } from 'lucide-react'

import AnimatedNumber from '../AnimatedNumber'
import {
    FINANCING_TYPES,
    LOAN_TERMS,
    DEFAULT_TERM,
    DEFAULT_FINANCING,
    estimatedRent,
    monthlyPayment,
    RATE_TOOLTIP,
    PROPERTY_VALUE_INCREASE,
    OFFICE_VISIT_HREF,
    type FinancingTypeKey,
} from '@/content/financing'

import style from './PaymentEstimator.module.css'

export interface EstimatorPlan {
    name: string
    price: number
    bed?: number | null
    sqft?: number | null
    slug?: string
}

const usd0 = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
})

const formatMoney = (n: number) => usd0.format(Math.round(n))
const formatSigned = (n: number) => {
    const v = Math.round(n)
    return `${v >= 0 ? '+' : '−'}${usd0.format(Math.abs(v))}`
}

export default function PaymentEstimator({
    plans,
}: {
    plans: EstimatorPlan[]
}) {
    const defaultIndex = Math.max(
        0,
        plans.findIndex((p) => p.name === 'Estate 600')
    )
    const [planIndex, setPlanIndex] = useState(
        defaultIndex === -1 ? 0 : defaultIndex
    )
    const [financing, setFinancing] =
        useState<FinancingTypeKey>(DEFAULT_FINANCING)
    const [term, setTerm] = useState<number>(DEFAULT_TERM)
    const [openTip, setOpenTip] = useState<FinancingTypeKey | null>(null)

    const plan = plans[planIndex]
    const ft =
        FINANCING_TYPES.find((f) => f.key === financing) ?? FINANCING_TYPES[0]

    const { payment, rent, cashflow, annual } = useMemo(() => {
        const rent = estimatedRent(plan)
        const payment = monthlyPayment(
            plan.price,
            ft.rate,
            term,
            ft.interestOnly
        )
        const cashflow = rent - payment
        return { payment, rent, cashflow, annual: cashflow * 12 }
    }, [plan, ft, term])

    const positive = cashflow >= 0

    return (
        <>
        <div className={style.card}>
            <div className={style.grid}>
                {/* ---------------- Controls ---------------- */}
                <div className={style.controls}>
                    <div className={style.field}>
                        <label htmlFor="estimator-plan" className={style.label}>
                            Floor plan
                        </label>
                        <div className={style.selectWrap}>
                            <select
                                id="estimator-plan"
                                className={style.select}
                                value={planIndex}
                                onChange={(e) =>
                                    setPlanIndex(Number(e.target.value))
                                }
                            >
                                {plans.map((p, i) => (
                                    <option key={p.name} value={i}>
                                        {p.name} — {formatMoney(p.price)}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <fieldset className={style.field}>
                        <legend className={style.label}>Financing type</legend>
                        <div className={style.segment} role="radiogroup">
                            {FINANCING_TYPES.map((f) => (
                                <label
                                    key={f.key}
                                    className={`${style.segItem} ${
                                        financing === f.key
                                            ? style.segActive
                                            : ''
                                    }`}
                                >
                                    <input
                                        type="radio"
                                        name="financing"
                                        value={f.key}
                                        checked={financing === f.key}
                                        onChange={() => setFinancing(f.key)}
                                    />
                                    <span className={style.segLabel}>
                                        {f.label}
                                    </span>
                                    <span className={style.segNote}>
                                        {f.rate}%
                                        <span className={style.tipWrap}>
                                            <button
                                                type="button"
                                                className={style.tipButton}
                                                aria-label={`About the ${f.label} rate`}
                                                aria-describedby={`rate-tip-${f.key}`}
                                                onClick={(e) => {
                                                    e.preventDefault()
                                                    e.stopPropagation()
                                                    setOpenTip(
                                                        openTip === f.key
                                                            ? null
                                                            : f.key
                                                    )
                                                }}
                                                onBlur={() => setOpenTip(null)}
                                            >
                                                <Info
                                                    className={style.tipIcon}
                                                    aria-hidden="true"
                                                />
                                            </button>
                                            <span
                                                id={`rate-tip-${f.key}`}
                                                role="tooltip"
                                                className={`${style.tipBubble} ${
                                                    openTip === f.key
                                                        ? style.tipVisible
                                                        : ''
                                                }`}
                                            >
                                                {RATE_TOOLTIP}
                                            </span>
                                        </span>{' '}
                                        · {f.note}
                                    </span>
                                </label>
                            ))}
                        </div>
                    </fieldset>

                    <fieldset className={style.field}>
                        <legend className={style.label}>
                            Loan term
                            {ft.interestOnly && (
                                <span className={style.legendNote}>
                                    {' '}
                                    — interest-only draw, term doesn&rsquo;t
                                    change the payment
                                </span>
                            )}
                        </legend>
                        <div
                            className={`${style.segment} ${style.segmentTerms} ${
                                ft.interestOnly ? style.segmentDisabled : ''
                            }`}
                            role="radiogroup"
                        >
                            {LOAN_TERMS.map((t) => (
                                <label
                                    key={t}
                                    className={`${style.segItem} ${
                                        term === t ? style.segActive : ''
                                    }`}
                                >
                                    <input
                                        type="radio"
                                        name="term"
                                        value={t}
                                        checked={term === t}
                                        disabled={ft.interestOnly}
                                        onChange={() => setTerm(t)}
                                    />
                                    <span className={style.segLabel}>
                                        {t} yr
                                    </span>
                                </label>
                            ))}
                        </div>
                    </fieldset>
                </div>

                {/* ---------------- Results ---------------- */}
                <div className={style.results} aria-live="polite">
                    <div className={style.resultItem}>
                        <span className={style.resultLabel}>
                            Estimated monthly payment
                        </span>
                        <AnimatedNumber
                            className={style.resultValue}
                            value={payment}
                            format={formatMoney}
                        />
                        <span className={style.resultNote}>
                            {plan.name} all-in · {ft.label} at an illustrative{' '}
                            {ft.rate}%
                        </span>
                    </div>

                    <div className={style.resultItem}>
                        <span className={style.resultLabel}>
                            Estimated monthly rent
                        </span>
                        <AnimatedNumber
                            className={`${style.resultValue} ${style.rent}`}
                            value={rent}
                            format={formatMoney}
                        />
                        <span className={style.resultNote}>
                            Comparable-market estimate
                        </span>
                    </div>

                    <div
                        className={`${style.resultItem} ${style.cashflowItem} ${
                            positive ? style.cashPositive : style.cashNegative
                        }`}
                    >
                        <span className={style.resultLabel}>
                            {positive ? (
                                <TrendingUp
                                    className={style.trendIcon}
                                    aria-hidden="true"
                                />
                            ) : (
                                <TrendingDown
                                    className={style.trendIcon}
                                    aria-hidden="true"
                                />
                            )}
                            Net monthly cash flow
                        </span>
                        <AnimatedNumber
                            className={style.resultValue}
                            value={cashflow}
                            format={formatSigned}
                        />
                        <span className={style.resultNote}>
                            {positive
                                ? 'Rent covers the payment with room to spare'
                                : 'Mostly offset by rent — and by equity you gain'}
                        </span>
                    </div>

                    <p className={style.resultsDisclaimer}>
                        <Info
                            className={style.disclaimerIcon}
                            aria-hidden="true"
                        />
                        All figures are prior to verifying site characteristics
                        on your lot.
                    </p>
                </div>
            </div>

            {/* ---------------- Pencils out ---------------- */}
            <div className={style.pencils}>
                <div className={style.pencilStat}>
                    <span className={style.pencilLabel}>Annual cash flow</span>
                    <span
                        className={`${style.pencilValue} ${
                            positive ? style.cashPositive : style.cashNegative
                        }`}
                    >
                        {formatSigned(annual)}
                        <span className={style.pencilUnit}>/yr</span>
                    </span>
                </div>
                <div className={style.pencilDivider} aria-hidden="true" />
                <div className={style.pencilStat}>
                    <span className={style.pencilLabel}>
                        Property value increase
                    </span>
                    <span className={`${style.pencilValue} ${style.gold}`}>
                        {usd0.format(PROPERTY_VALUE_INCREASE.low)}–
                        {usd0.format(PROPERTY_VALUE_INCREASE.high)}
                    </span>
                </div>
                <p className={style.pencilNote}>
                    Even if you build for family, your property value climbs the
                    day the ADU is done — instant equity, whether you ever rent
                    it or not.
                </p>
            </div>
        </div>

        {/* Sits on the dark section background, outside the card. */}
        <p className={style.disclaimer}>
            Estimates only, for illustration. Rates, rents, and value
            increases vary — your exact all-in price comes from a Formal
            Property Analysis of your property. Please note Backyard Estates
            is not a financial advisor or CPA; consult your own financial,
            tax, or legal professional before making financing decisions.{' '}
            <a className={style.disclaimerLink} href={OFFICE_VISIT_HREF}>
                Get your numbers <ArrowRight className={style.inlineArrow} />
            </a>
        </p>
        </>
    )
}
