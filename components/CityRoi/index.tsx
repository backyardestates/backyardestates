'use client'

import Link from 'next/link'
import { TrendingUp, Home, ArrowRight } from 'lucide-react'

import AnimatedNumber from '@/components/AnimatedNumber'
import style from './CityRoi.module.css'

const usd = (n: number) => `$${Math.round(n).toLocaleString()}`
const usdK = (n: number) => `$${Math.round(n / 1000)}k`

/**
 * Per-city ROI: estimated monthly rent + typical value added, framed as
 * "no hassle, just cash flow." Figures animate on scroll. All on-brand.
 */
export default function CityRoi({
    cityName,
    rentLow,
    rentHigh,
    valueLow,
    valueHigh,
}: {
    cityName: string
    rentLow: number
    rentHigh: number
    valueLow: number
    valueHigh: number
}) {
    return (
        <div className={style.root}>
            <div className={style.grid}>
                {/* Monthly rent */}
                <div className={style.card}>
                    <span className={style.cardIcon}>
                        <Home size={20} />
                    </span>
                    <p className={style.cardLabel}>Estimated monthly rent</p>
                    <p className={style.figure}>
                        <AnimatedNumber
                            value={rentLow}
                            format={usd}
                            className={style.num}
                        />
                        <span className={style.dash}>–</span>
                        <AnimatedNumber
                            value={rentHigh}
                            format={usd}
                            className={style.num}
                        />
                    </p>
                    <p className={style.cardUnit}>per month, in {cityName}</p>
                </div>

                {/* Value added */}
                <div className={style.card}>
                    <span className={style.cardIcon}>
                        <TrendingUp size={20} />
                    </span>
                    <p className={style.cardLabel}>Typical value added</p>
                    <p className={style.figure}>
                        <AnimatedNumber
                            value={valueLow}
                            format={usdK}
                            className={style.num}
                        />
                        <span className={style.dash}>–</span>
                        <AnimatedNumber
                            value={valueHigh}
                            format={usdK}
                            className={style.num}
                        />
                    </p>
                    <p className={style.cardUnit}>added to your property</p>
                </div>
            </div>

            <p className={style.pitch}>
                No hassle, just cash flow — we handle the design, permits, and
                construction end to end, so your {cityName} backyard starts
                paying you back.
            </p>

            <div className={style.ctaRow}>
                <Link href="/pricing" className={style.primaryBtn}>
                    Estimate my payment
                    <ArrowRight size={18} />
                </Link>
                <Link href="/roi" className={style.ghostBtn}>
                    See the full ROI breakdown
                </Link>
            </div>

            <p className={style.disclaimer}>
                Estimates only — your exact rent, value, and price come from a
                free property analysis.
            </p>
        </div>
    )
}
