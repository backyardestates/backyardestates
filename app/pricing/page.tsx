import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import {
    Check,
    PencilRuler,
    FileCheck2,
    HardHat,
    ChefHat,
    Paintbrush,
    Sun,
    Zap,
    Users,
    ArrowRight,
    Map as MapIcon,
    Mountain,
    PlugZap,
    Gauge,
    Ruler,
    Landmark,
} from 'lucide-react'

import { client } from '@/sanity/client'

import Nav from '@/components/Nav'
import Footer from '@/components/Footer'
import AttentionCTA from '@/components/AttentionCTA'
import Button from '@/components/Button'
import FloorplansGrid from '@/components/FloorplansGrid'
import LotPlacementCTA, { type LotPlan } from '@/components/LotPlacementCTA'
import HomeownerQuotes, {
    type HomeownerQuote,
} from '@/components/HomeownerQuotes'
import TrustStatBar from '@/components/TrustStatBar'
import PaymentEstimator, {
    type EstimatorPlan,
} from '@/components/PaymentEstimator'
import Reveal from '@/components/Reveal'
import Faq from '@/components/Faq'

import { uniqueCities } from '@/lib/estateFacts'
import CityPopover from '@/components/CityPopover'
import {
    FINANCING_OPTIONS,
    FINANCING_FAQS,
    PHONE_DISPLAY,
    PHONE_HREF,
    OFFICE_VISIT_HREF,
    SPECIALIST_HREF,
    FPA_HREF,
} from '@/content/financing'
import AnimatedNumber from '@/components/AnimatedNumber'
import {
    FPA_STEPS,
    FPA_CATEGORIES,
    FPA_OUTPUTS,
    FPA_POINTS_LABEL,
    FPA_POINTS_VALUE,
} from '@/content/fpa'

import style from './page.module.css'

export const metadata: Metadata = {
    title: 'Pricing & financing - Backyard Estates',
    description:
        'One all-in price covers everything — design, permits, site work, finishes, and solar. See your estimated monthly payment, how it pays you back, and the real homes we have built.',
}

const options = { next: { revalidate: 30 } }

const FLOORPLANS_QUERY = `*[_type == "floorplan" && isClickable != false && name != "Custom Estate"]|order(orderID asc){
    _id, bed, bath, sqft, price, name, slug, drawing
}`

const COMPLETED_QUERY = `*[
    _type == "property" &&
    (completed == true || (defined(thumbnail) && !defined(photos)))
]| order(featured desc, coalesce(publishedAt, _createdAt) desc){
    _id, name, "slug": slug.current, bed, bath, sqft, featured, photos,
    address { city }, location,
    floorplan->{ name }
}`

const TESTIMONIALS_QUERY = `*[
    _type == "property" && featured == true && defined(testimonial)
]| order(coalesce(publishedAt, _createdAt) desc){
    address { city }, location,
    "testimonial": testimonial->{ names, quote, portrait, "slug": slug.current }
}`

interface Floorplan {
    _id: string
    bed: number
    bath: number
    sqft: number
    price: number | null
    name: string
    slug: { current: string }
    drawing?: { public_id?: string }
}

interface Completed {
    _id: string
    name: string
    slug: string
    bed: number
    bath: number
    sqft: number
    featured?: boolean
    photos?: { url: string }[]
    address?: { city?: string }
    location?: string
    floorplan?: { name?: string }
}

interface TestimonialRow {
    address?: { city?: string }
    location?: string
    testimonial?: {
        names?: string
        quote?: string
        portrait?: { secure_url?: string; url?: string }
        slug?: { current?: string } | string
    }
}

// The eight things every all-in price covers, sourced from content/inclusions.js.
const INCLUDES = [
    { icon: PencilRuler, text: 'Custom design, plans & engineering' },
    { icon: FileCheck2, text: 'All permits & city fees — 11 departments' },
    { icon: HardHat, text: 'Site prep, foundation & utility connections' },
    { icon: ChefHat, text: 'Cabinets, quartz & stainless appliances' },
    { icon: Paintbrush, text: 'Flooring, paint, doors, windows & finishes' },
    { icon: Zap, text: 'Mini-split HVAC, heat-pump water heater, 200A panel' },
    { icon: Sun, text: 'Solar (PV) included on Estate 500 & larger' },
    { icon: Users, text: 'Dedicated PM, superintendent & weekly updates' },
]

// All-in vs. itemized: what others bill separately (from the current comparison).
const COMPARISON = [
    { item: 'The unit itself', others: '$140K' },
    { item: 'Design, plans & permits', others: '$15K+' },
    { item: 'Architectural, Structural, Title 24', others: '$20K' },
    { item: 'Site prep & utility connections', others: '$45K' },
    { item: 'Appliances, fixtures & finishes', others: '$20K+' },
    { item: 'Project management & timeline', others: '$10K+' },
]

export default async function Pricing() {
    const [floorplans, completed, testimonialRows] = await Promise.all([
        client.fetch<Floorplan[]>(FLOORPLANS_QUERY, {}, options),
        client.fetch<Completed[]>(COMPLETED_QUERY, {}, options),
        client.fetch<TestimonialRow[]>(TESTIMONIALS_QUERY, {}, options),
    ])

    // Estimator plans: only those with a real price.
    const estimatorPlans: EstimatorPlan[] = floorplans
        .filter((f) => typeof f.price === 'number')
        .map((f) => ({
            name: f.name,
            price: f.price as number,
            bed: f.bed,
            sqft: f.sqft,
            slug: f.slug?.current,
        }))

    const startingPrice = estimatorPlans.length
        ? Math.min(...estimatorPlans.map((p) => p.price))
        : null

    // Smallest / mid / largest plans for the lot-placement scene.
    const lotSorted = floorplans
        .filter((f) => f.sqft && f.name)
        .sort((a, b) => a.sqft - b.sqft)
    const lotPlans: LotPlan[] = (
        lotSorted.length > 3
            ? [
                lotSorted[0],
                lotSorted[Math.floor(lotSorted.length / 2)],
                lotSorted[lotSorted.length - 1],
            ]
            : lotSorted
    ).map((f) => ({ name: f.name, sqft: f.sqft }))

    // Proof: completed homes with photos.
    const proof = completed.filter((p) => p.photos && p.photos.length > 0).slice(0, 6)
    // Base of homes delivered before the properties CMS existed, plus every
    // completed unit tracked in Sanity.
    const BUILT_BASE = 60
    const builtCount = BUILT_BASE + completed.length
    const cities = uniqueCities(completed)
    // Lead with the cities we build in most; everything else lives in the
    // hover popover so the lede stays one line.
    const featuredCities = [
        'Rancho Cucamonga',
        'La Verne',
        'Claremont',
        'Glendora',
    ]
    const moreCities = cities
        .filter((c) => !featuredCities.includes(c))
        .sort((a, b) => a.localeCompare(b))

    // Testimonials -> HomeownerQuotes shape.
    const quotes: HomeownerQuote[] = testimonialRows
        .filter((r) => r.testimonial?.quote && r.testimonial?.names)
        .map((r) => {
            const t = r.testimonial!
            const slug =
                typeof t.slug === 'string' ? t.slug : t.slug?.current
            return {
                names: t.names as string,
                quote: t.quote as string,
                slug,
                portraitUrl: t.portrait?.secure_url || t.portrait?.url,
                city: r.address?.city || r.location?.split(',')[0]?.trim(),
            }
        })
        .slice(0, 6)

    const stats = [
        {
            value: 100,
            suffix: '%',
            label: 'of our permits approved',
            icon: 'shield' as const,
        },
        {
            value: builtCount,
            suffix: '+',
            label: 'backyard homes delivered',
            icon: 'home' as const,
        },
        {
            value: null,
            text: '7–12',
            label: 'week ground-up build',
            icon: 'clock' as const,
        },
    ]

    return (
        <>
            <Nav />
            <main className={style.main}>
                {/* ============ HERO ============ */}
                <section className={style.hero}>
                    <div className={style.heroInner}>
                        <Reveal as="span" className={style.heroEyebrow}>
                            All-inclusive pricing
                        </Reveal>
                        <Reveal as="h1" delay={80} className={style.heroTitle}>
                            One price. Everything included.
                            <br />
                            <span className={style.heroAccent}>
                                A home that pays you back.
                            </span>
                        </Reveal>
                        <Reveal as="p" delay={160} className={style.heroSub}>
                            No surprise change orders, no hidden add-ons.
                            See what the all-in price covers, what it costs per
                            month — and how a {FPA_POINTS_LABEL} point analysis
                            of your property allows us to determine your exact cost.
                        </Reveal>
                        <Reveal delay={240} className={style.heroActions}>
                            <Button isPrimary href={OFFICE_VISIT_HREF}>
                                Start with a free office visit
                            </Button>
                            <Link href="#estimator" className={style.heroLink}>
                                Estimate my monthly payment{' '}
                                <ArrowRight className={style.linkArrow} />
                            </Link>
                        </Reveal>
                    </div>

                    <Reveal delay={320} className={style.heroStatWrap}>
                        <TrustStatBar stats={stats} />
                    </Reveal>
                </section>

                {/* ============ WHAT ALL-IN MEANS ============ */}
                <section className={`${style.section} ${style.sectionCream}`}>
                    <div className={style.container}>
                        <Reveal className={style.sectionHead}>
                            <span className={style.eyebrow}>
                                What &ldquo;all-in&rdquo; actually means
                            </span>
                            <h2 className={style.sectionTitle}>
                                The price you see is the price you pay
                            </h2>
                            <p className={style.sectionLede}>
                                Other builders quote a low number, then bill you
                                for everything below. With us, it&rsquo;s all
                                one price — design to finished, permitted home.
                            </p>
                        </Reveal>
                        <ul className={style.includesGrid}>
                            {INCLUDES.map((inc, i) => {
                                const Icon = inc.icon
                                return (
                                    <Reveal
                                        as="li"
                                        key={inc.text}
                                        delay={(i % 4) * 50}
                                        className={style.includeItem}
                                    >
                                        <Icon
                                            className={style.includeIcon}
                                            aria-hidden="true"
                                        />
                                        <span>{inc.text}</span>
                                    </Reveal>
                                )
                            })}
                        </ul>
                    </div>
                </section>

                {/* ============ PRICING BY FLOOR PLAN ============ */}
                <section className={style.section}>
                    <div className={style.container}>
                        <Reveal className={style.sectionHead}>
                            <span className={style.eyebrow}>
                                Transparent pricing
                            </span>
                            <h2 className={style.sectionTitle}>
                                Real prices, published openly
                            </h2>
                            <p className={style.sectionLede}>
                                Most builders won&rsquo;t show you a number until
                                you&rsquo;re deep in their funnel. Here&rsquo;s
                                every plan&rsquo;s standard all-in price, right
                                now — then a {FPA_POINTS_LABEL} point analysis of
                                your property verifies your exact number.
                            </p>
                        </Reveal>
                        <FloorplansGrid properties={floorplans} />
                    </div>
                </section>

                {/* ============ SEE THEM ON YOUR LOT ============ */}
                <section
                    id="on-your-lot"
                    className={`${style.section} ${style.sectionCream}`}
                >
                    <div className={style.container}>
                        <Reveal>
                            <LotPlacementCTA
                                plans={lotPlans}
                                ctaHref={OFFICE_VISIT_HREF}
                                phoneDisplay={PHONE_DISPLAY}
                                phoneHref={PHONE_HREF}
                            />
                        </Reveal>
                    </div>
                </section>

                {/* ============ PAYMENT ESTIMATOR ============ */}
                <section
                    id="estimator"
                    className={`${style.section} ${style.sectionInk}`}
                >
                    <div className={style.container}>
                        <Reveal className={style.sectionHead}>
                            <span
                                className={`${style.eyebrow} ${style.eyebrowOnInk}`}
                            >
                                Run the numbers
                            </span>
                            <h2
                                className={`${style.sectionTitle} ${style.titleOnInk}`}
                            >
                                It&rsquo;s not a six-figure cost. It&rsquo;s a
                                monthly payment that builds
                                <span className={style.heroAccent}> equity.</span>
                            </h2>
                            <p
                                className={`${style.sectionLede} ${style.ledeOnInk}`}
                            >
                                Pick a plan and a financing path to see your
                                estimated monthly payment, the rent it could
                                earn, and what that nets you.
                            </p>
                        </Reveal>
                        {estimatorPlans.length > 0 && (
                            <Reveal>
                                <PaymentEstimator plans={estimatorPlans} />
                            </Reveal>
                        )}
                    </div>
                </section>

                {/* ============ FINANCING OPTIONS ============ */}
                <section className={`${style.section} ${style.sectionCream}`}>
                    <div className={style.container}>
                        <Reveal className={style.sectionHead}>
                            <span className={style.eyebrow}>
                                Financing options
                            </span>
                            <h2 className={style.sectionTitle}>
                                You likely already have what you need
                            </h2>
                            <p className={style.sectionLede}>
                                Most homeowners fund their ADU with equity
                                they&rsquo;ve already built. We&rsquo;ll connect
                                you with ADU-specialized lenders at your{' '}
                                <Link
                                    href={OFFICE_VISIT_HREF}
                                    className={style.ledeLink}
                                >
                                    free office visit
                                </Link>
                                .
                            </p>
                        </Reveal>
                        <Reveal as="p" className={style.financeIntro}>
                            Here are just a few of the most popular paths
                        </Reveal>
                        <ul className={style.financeGrid}>
                            {FINANCING_OPTIONS.map((opt, i) => (
                                <Reveal
                                    as="li"
                                    key={opt.name}
                                    delay={(i % 2) * 60}
                                    className={style.financeCard}
                                >
                                    <span className={style.financeBadge}>
                                        {opt.badge}
                                    </span>
                                    <h3 className={style.financeName}>
                                        {opt.name}
                                    </h3>
                                    <p className={style.financeDesc}>
                                        {opt.description}
                                    </p>
                                    <ul className={style.financeDetails}>
                                        {opt.details.map((d) => (
                                            <li key={d}>
                                                <Check
                                                    className={
                                                        style.financeCheck
                                                    }
                                                    aria-hidden="true"
                                                />
                                                {d}
                                            </li>
                                        ))}
                                    </ul>
                                    <span className={style.financeBest}>
                                        Best for: {opt.bestFor}
                                    </span>
                                </Reveal>
                            ))}
                        </ul>
                        <Reveal as="p" className={style.financeMore}>
                            <span className={style.financeMorePlus}>+</span>
                            over a dozen additional loan options available
                            through our ADU-specialized lending partners
                        </Reveal>
                    </div>
                </section>

                {/* ============ ALL-IN VS ITEMIZED COMPARISON ============ */}
                <section className={style.section}>
                    <div className={style.container}>
                        <Reveal className={style.sectionHead}>
                            <span className={style.eyebrow}>
                                Why it&rsquo;s actually a bargain
                            </span>
                            <h2 className={style.sectionTitle}>
                                The same scope, billed two ways
                            </h2>
                            <p className={style.sectionLede}>
                                Add up what a typical contractor charges
                                line-by-line and the &ldquo;cheaper&rdquo; quote
                                isn&rsquo;t cheaper at all.
                            </p>
                        </Reveal>
                        <Reveal className={style.comparison}>
                            <div className={style.compHead}>
                                <span className={style.compHeadItem}>
                                    What&rsquo;s included
                                </span>
                                <span
                                    className={`${style.compHeadUs} ${style.compCol}`}
                                >
                                    Backyard Estates
                                </span>
                                <span
                                    className={`${style.compHeadThem} ${style.compCol}`}
                                >
                                    Typical contractor
                                </span>
                            </div>
                            {COMPARISON.map((row) => (
                                <div className={style.compRow} key={row.item}>
                                    <span className={style.compItem}>
                                        {row.item}
                                    </span>
                                    <span
                                        className={`${style.compUs} ${style.compCol}`}
                                    >
                                        <Check
                                            className={style.compCheck}
                                            aria-hidden="true"
                                        />
                                        Included
                                    </span>
                                    <span
                                        className={`${style.compThem} ${style.compCol}`}
                                    >
                                        {row.others}
                                    </span>
                                </div>
                            ))}
                            <div className={style.compTotal}>
                                <span className={style.compItem}>
                                    All-in total
                                </span>
                                <span
                                    className={`${style.compUs} ${style.compCol}`}
                                >
                                    <span className={style.compTotalUs}>
                                        {startingPrice
                                            ? `From $${Math.round(
                                                startingPrice / 1000
                                            )}K`
                                            : 'One all-in price'}
                                    </span>
                                </span>
                                <span
                                    className={`${style.compThem} ${style.compCol}`}
                                >
                                    <span className={style.compTotalThem}>
                                        $250K+
                                    </span>
                                </span>
                            </div>
                        </Reveal>
                    </div>
                </section>

                {/* ============ PROOF: COMPLETED HOMES ============ */}
                {proof.length > 0 && (
                    <section
                        className={`${style.section} ${style.sectionCream}`}
                    >
                        <div className={style.container}>
                            <Reveal className={style.sectionHead}>
                                <span className={style.eyebrow}>
                                    Real homes — not renderings
                                </span>
                                <h2 className={style.sectionTitle}>
                                    Backyard homes we&rsquo;ve already delivered
                                </h2>
                                <p className={style.sectionLede}>
                                    Built in {featuredCities.join(', ')}
                                    {moreCities.length > 0 && (
                                        <>
                                            {' '}
                                            and{' '}
                                            <CityPopover cities={moreCities} />
                                        </>
                                    )}{' '}
                                    — and counting.
                                </p>
                            </Reveal>
                            <ul className={style.proofGrid}>
                                {proof.map((p, i) => (
                                    <Reveal
                                        as="li"
                                        key={p._id}
                                        delay={(i % 3) * 50}
                                        className={style.proofCard}
                                    >
                                        <Link
                                            href={`/properties/${p.slug}`}
                                            className={style.proofLink}
                                        >
                                            <div className={style.proofImageWrap}>
                                                <Image
                                                    src={p.photos![0].url}
                                                    alt={`${p.name} — completed ADU`}
                                                    fill
                                                    sizes="(max-width: 600px) 100vw, (max-width: 960px) 50vw, 33vw"
                                                    className={style.proofImage}
                                                />
                                            </div>
                                            <div className={style.proofBody}>
                                                <span
                                                    className={style.proofName}
                                                >
                                                    {p.name}
                                                </span>
                                                <span
                                                    className={style.proofMeta}
                                                >
                                                    {p.floorplan?.name
                                                        ? `${p.floorplan.name} · `
                                                        : ''}
                                                    {p.address?.city ||
                                                        p.location?.split(
                                                            ','
                                                        )[0]}
                                                </span>
                                            </div>
                                        </Link>
                                    </Reveal>
                                ))}
                            </ul>
                            <Reveal className={style.proofCta}>
                                <Link
                                    href="/properties"
                                    className={style.textLink}
                                >
                                    See some of our completed ADUs{' '}
                                    <ArrowRight className={style.linkArrow} />
                                </Link>
                            </Reveal>
                        </div>
                    </section>
                )}

                {/* ============ TESTIMONIALS ============ */}
                {quotes.length > 0 && (
                    <section className={style.section}>
                        <div className={style.container}>
                            <HomeownerQuotes quotes={quotes} />
                            <Reveal className={style.proofCta}>
                                <Link
                                    href="/customer-stories"
                                    className={style.textLink}
                                >
                                    Read more customer stories{' '}
                                    <ArrowRight className={style.linkArrow} />
                                </Link>
                            </Reveal>
                        </div>
                    </section>
                )}

                {/* ============ HOW YOU GET YOUR EXACT PRICE (FPA) ============ */}
                <section
                    id="exact-price"
                    className={`${style.section} ${style.sectionCream}`}
                >
                    <div className={style.container}>
                        <Reveal className={style.sectionHead}>
                            <span className={style.eyebrow}>
                                How you get your exact price
                            </span>
                            <h2 className={style.sectionTitle}>
                                A {FPA_POINTS_LABEL} point analysis turns the
                                standard price into{' '}
                                <span className={style.titleAccent}>
                                    your number
                                </span>
                            </h2>
                            <p className={style.sectionLede}>
                                The prices above cover the ADU and all our standard inclusions. What&rsquo;s unique to your lot —
                                utilities, site conditions, city rules — gets
                                verified before being presented an agreement.
                                Certainty without verification is just a guess.
                            </p>
                        </Reveal>

                        {/* The 3-step path to an exact number */}
                        <ol className={style.fpaSteps}>
                            {FPA_STEPS.map((s, i) => (
                                <Reveal
                                    as="li"
                                    key={s.title}
                                    delay={i * 80}
                                    className={`${style.fpaStep} ${i === 1 ? style.fpaStepFeatured : ''
                                        }`}
                                >
                                    <span
                                        className={style.fpaStepNum}
                                        aria-hidden="true"
                                    >
                                        {i + 1}
                                    </span>
                                    <h3 className={style.fpaStepTitle}>
                                        {s.title}
                                    </h3>
                                    <p className={style.fpaStepDetail}>
                                        {s.detail}
                                    </p>
                                    {s.note && (
                                        <span className={style.fpaStepNote}>
                                            {s.note}
                                        </span>
                                    )}
                                </Reveal>
                            ))}
                        </ol>

                        {/* Connector: the strip hands off into step 2, unpacked */}
                        <div className={style.fpaConnector}>
                            <Reveal
                                effect="draw"
                                className={style.fpaConnectorLine}
                            />
                            <Reveal
                                as="span"
                                delay={120}
                                className={style.fpaConnectorLabel}
                            >
                                Step 2, unpacked
                            </Reveal>
                            <Reveal
                                as="h3"
                                delay={220}
                                className={style.fpaConnectorTitle}
                            >
                                So what do those {FPA_POINTS_LABEL} points
                                actually cover?
                            </Reveal>
                        </div>

                        {/* The exhibit: 250+ numeral, six categories, outputs */}
                        <Reveal delay={320} className={style.fpaPanel}>
                            <div className={style.fpaShowcase}>
                                <div className={style.fpaNumeralBlock}>
                                    <span className={style.fpaKicker}>
                                        The Formal Property Analysis
                                    </span>
                                    <span className={style.fpaNumeral}>
                                        {/* format omitted intentionally: functions can't
                                        cross the server→client boundary; the
                                        component's default is Math.round. */}
                                        <AnimatedNumber
                                            value={FPA_POINTS_VALUE}
                                            duration={900}
                                        />
                                        <span className={style.fpaNumeralPlus}>
                                            +
                                        </span>
                                    </span>
                                    <span className={style.fpaLockupLabel}>
                                        Points verified
                                    </span>
                                    <span className={style.fpaLockupSub}>
                                        on your property, in person, by our
                                        architect and engineering team
                                    </span>
                                    <ul className={style.fpaMetaRow}>
                                        <li>{FPA_CATEGORIES.length} categories</li>
                                        <li>1 site visit</li>
                                        <li>0 assumptions</li>
                                    </ul>
                                    <div className={style.fpaFeeCard}>
                                        <span className={style.fpaFeePrice}>
                                            $500
                                            <span className={style.fpaFeeCredit}>
                                                Fully credited toward your build
                                            </span>
                                        </span>
                                        <span className={style.fpaFeeNote}>
                                            Less than <strong>1%</strong> of the
                                            project — protecting the other{' '}
                                            <strong>99%</strong>.
                                        </span>
                                    </div>
                                </div>
                                <ul className={style.fpaCats}>
                                    {FPA_CATEGORIES.map((cat, i) => {
                                        const Icon = [
                                            MapIcon,
                                            Mountain,
                                            PlugZap,
                                            Gauge,
                                            Ruler,
                                            Landmark,
                                        ][i]
                                        return (
                                            <li
                                                key={cat.title}
                                                className={style.factorCard}
                                            >
                                                <Icon
                                                    className={style.factorIcon}
                                                    aria-hidden="true"
                                                />
                                                <h3 className={style.factorTitle}>
                                                    {cat.title}
                                                </h3>
                                                <p className={style.factorText}>
                                                    {cat.examples}
                                                </p>
                                            </li>
                                        )
                                    })}
                                </ul>
                            </div>

                            {/* What you walk away with */}
                            <div className={style.fpaPanelFooter}>
                                <div className={style.fpaOutputs}>
                                    {FPA_OUTPUTS.map((o, i) => (
                                        <Reveal
                                            as="span"
                                            key={o}
                                            delay={i * 70}
                                            className={style.fpaOutput}
                                        >
                                            <Check
                                                className={style.fpaOutputCheck}
                                                aria-hidden="true"
                                            />
                                            {o}
                                        </Reveal>
                                    ))}
                                </div>
                            </div>
                        </Reveal>

                        {/* Ready to verify? Book the FPA directly — or start
                            with the free office visit if it's too early. */}
                        <Reveal className={style.fpaCtaRow}>
                            <Button isPrimary href={FPA_HREF}>
                                Schedule your Formal Property Analysis
                            </Button>
                            <Link
                                href={OFFICE_VISIT_HREF}
                                className={style.heroLink}
                            >
                                Not ready yet? Start with a free office visit{' '}
                                <ArrowRight className={style.linkArrow} />
                            </Link>
                        </Reveal>
                    </div>
                </section>

                {/* ============ FINANCING FAQ ============ */}
                <section className={style.section}>
                    <div className={`${style.container} ${style.faqContainer}`}>
                        <Reveal className={style.sectionHead}>
                            <span className={style.eyebrow}>
                                Common questions
                            </span>
                            <h2 className={style.sectionTitle}>
                                Pricing &amp; financing FAQ
                            </h2>
                        </Reveal>
                        <Reveal className={style.faqList}>
                            {FINANCING_FAQS.map((f) => (
                                <Faq
                                    key={f.question}
                                    question={f.question}
                                    cta={f.cta}
                                >
                                    <p className={style.faqAnswer}>{f.answer}</p>
                                </Faq>
                            ))}
                        </Reveal>
                        <Reveal className={style.faqHelp}>
                            <p>
                                Still have questions? Call{' '}
                                <a href={PHONE_HREF} className={style.textLink}>
                                    {PHONE_DISPLAY}
                                </a>{' '}
                                or{' '}
                                <Link
                                    href={SPECIALIST_HREF}
                                    className={style.textLink}
                                >
                                    talk to an ADU specialist
                                </Link>
                                .
                            </p>
                        </Reveal>
                    </div>
                </section>

                {/* ============ FINAL CTA ============ */}
                <AttentionCTA
                    eyebrow="Get Started"
                    title="Get your exact, all-in price"
                    description="It starts with a free, no-pressure office visit — we put floor plans on your actual lot. Then a Formal Property Analysis verifies everything, and your formal proposal locks in your exact all-in price."
                    primaryLabel="Schedule your free office visit"
                    primaryHref={OFFICE_VISIT_HREF}
                    secondaryText={`Or call ${PHONE_DISPLAY}`}
                    secondaryHref={PHONE_HREF}
                />
            </main>
            <Footer />
        </>
    )
}
