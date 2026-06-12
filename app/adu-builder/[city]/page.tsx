import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import type { SanityDocument } from 'next-sanity'
import { PortableText, type PortableTextComponents } from 'next-sanity'
import {
    MapPin,
    Check,
    ArrowRight,
    Building2,
    Phone,
    Landmark,
    BadgeCheck,
    ShieldCheck,
    ClipboardCheck,
    Hammer,
} from 'lucide-react'

import { client } from '@/sanity/client'
import {
    PROPERTIES_BY_CITY_QUERY,
    CITY_FLOORPLANS_QUERY,
    SERVICE_AREAS_QUERY,
    SERVICE_AREA_QUERY,
    STORIES_BY_CITY_QUERY,
    COMPLETED_COUNT_QUERY,
    TESTIMONIALS_POOL_QUERY,
    PROPERTIES_POOL_QUERY,
} from '@/sanity/queries'

import Nav from '@/components/Nav'
import Footer from '@/components/Footer'
import Breadcrumbs from '@/components/Breadcrumbs'
import Faq from '@/components/Faq'
import AttentionCTA from '@/components/AttentionCTA'
import JsonLd from '@/components/JsonLd'
import Reveal from '@/components/Reveal'
import TrustStatBar from '@/components/TrustStatBar'
import AnimatedNumber from '@/components/AnimatedNumber'
import TimelineComparison from '@/components/TimelineComparison'
import CityRoi from '@/components/CityRoi'
import ReviewStars from '@/components/ReviewStars'
import ExpandableProperties from '@/components/ExpandableProperties'
import TestimonialCarousel from '@/components/TestimonialCarousel'
import CityLeadForm from '@/components/CityLeadForm'
import OtherFloorplans, {
    type OtherFloorplan,
} from '@/components/OtherFloorplans'

import { buildMetadata } from '@/lib/seo'
import { business } from '@/lib/business'
import { localBusinessSchema, faqSchema } from '@/lib/jsonLd'
import { estimatedRent, PROPERTY_VALUE_INCREASE } from '@/content/financing'
import { FPA_POINTS_VALUE } from '@/content/fpa'

import style from './page.module.css'

const options = { next: { revalidate: 3600 } }

interface PhaseDays {
    plansDays?: number | null
    permitsDays?: number | null
    constructionDays?: number | null
}
interface ServiceArea {
    city: string
    slug: string
    county: string
    distanceFromUplandMi?: number
    buildsCompleted?: number
    maxAduSqft?: number
    avgMonthlyRentLow?: number
    avgMonthlyRentHigh?: number
    timeline?: { city?: PhaseDays; backyardEstates?: PhaseDays }
    blurb?: string
    intro?: any[]
    permittingDepartment?: string
    permittingNotes?: string[]
    neighborhoods?: string[]
    localFaqs?: { question: string; answer: string }[]
    featuredStory?: {
        names?: string
        quote?: string
        wistiaId?: string
        purpose?: string
        slug?: string
    }
    nearby?: { city: string; slug: string }[]
}

const introComponents: PortableTextComponents = {
    block: {
        normal: ({ children }) => <p className={style.body}>{children}</p>,
    },
}

const stripQuotes = (s?: string) =>
    (s || '').trim().replace(/^["“”']+|["“”']+$/g, '')

// Sensible statewide-ADU-law fallbacks so the permit checklist never renders
// empty on a sparse / freshly auto-drafted city.
const DEFAULT_PERMIT_NOTES = [
    'ADUs up to 800 sq ft are allowed by right on most single-family lots',
    'Detached ADUs require just 4 ft side and rear setbacks',
    'Owner-occupancy is not required to rent your ADU',
    'Cities must approve a complete ADU application within 60 days',
]

// The city fees we absorb into the all-in price (no dollar figures — framing
// only, per brand guidance).
const INCLUDED_FEES = [
    'Permit & plan-check fees',
    'School district fees',
    'Utility hookups',
    'Fire & public works',
]

export async function generateStaticParams() {
    const areas = await client.fetch<{ slug: string }[]>(
        SERVICE_AREAS_QUERY,
        {},
        options
    )
    return areas.map((a) => ({ city: a.slug }))
}

export async function generateMetadata({
    params,
}: {
    params: Promise<{ city: string }>
}) {
    const { city } = await params
    const area = await client.fetch<ServiceArea | null>(
        SERVICE_AREA_QUERY,
        { slug: city },
        options
    )
    if (!area) {
        return buildMetadata({
            title: 'ADU Builder Near You',
            description: business.description,
            path: `/adu-builder/${city}`,
        })
    }
    return buildMetadata({
        title: `ADU Builder in ${area.city}, CA`,
        description: `Backyard Estates designs and builds custom ADUs (accessory dwelling units, granny flats, and casitas) in ${area.city}, ${area.county} County. ${area.blurb} All-in pricing, fully managed permits and construction.`,
        path: `/adu-builder/${area.slug}`,
    })
}

export default async function CityPage({
    params,
}: {
    params: Promise<{ city: string }>
}) {
    const { city } = await params
    const area = await client.fetch<ServiceArea | null>(
        SERVICE_AREA_QUERY,
        { slug: city },
        options
    )
    if (!area) notFound()

    const [
        rawProperties,
        floorplans,
        stories,
        completedCount,
        testimonialPool,
        propertiesPool,
        serviceAreasList,
    ] = await Promise.all([
        client.fetch<SanityDocument[]>(
            PROPERTIES_BY_CITY_QUERY,
            { city: area.city },
            options
        ),
        client.fetch<OtherFloorplan[]>(CITY_FLOORPLANS_QUERY, {}, options),
        client.fetch<any[]>(STORIES_BY_CITY_QUERY, { city: area.city }, options),
        client.fetch<number>(COMPLETED_COUNT_QUERY, {}, options),
        client.fetch<any[]>(TESTIMONIALS_POOL_QUERY, {}, options),
        client.fetch<any[]>(PROPERTIES_POOL_QUERY, {}, options),
        client.fetch<{ city: string; county: string }[]>(
            SERVICE_AREAS_QUERY,
            {},
            options
        ),
    ])

    // Exact-city filter (the GROQ match over-matches; see queries.ts).
    const normCity = (s?: string | null) => (s || '').trim().toLowerCase()
    const matched = rawProperties.filter((p) => {
        const c =
            p.city ||
            (typeof p.location === 'string' ? p.location.split(',')[0] : '')
        return normCity(c) === normCity(area.city)
    })

    // County top-up: when this city has fewer than 3 of its own completed
    // builds, fill the grid with up to 3 same-county projects so it never looks
    // thin. County is derived from the serviceArea city→county map.
    const BUILDS_TARGET = 3
    const cityCountyMap = new Map(
        (serviceAreasList || []).map((a) => [normCity(a.city), a.county])
    )
    const countyOfProp = (p: any) => {
        const c =
            p.city ||
            (typeof p.location === 'string' ? p.location.split(',')[0] : '')
        return cityCountyMap.get(normCity(c))
    }
    const matchedIds = new Set(matched.map((p) => p._id))
    const countyTopUp =
        matched.length >= BUILDS_TARGET
            ? []
            : (propertiesPool || [])
                  .filter(
                      (p) =>
                          !matchedIds.has(p._id) &&
                          countyOfProp(p) === area.county
                  )
                  .slice(0, BUILDS_TARGET)
    const displayProperties = [...matched, ...countyTopUp]
    const toppedUp = countyTopUp.length > 0

    // ---- Volume proof (tiered) ----
    const matchedCount = matched.length
    const cityBuilds = Math.max(area.buildsCompleted ?? 0, matchedCount)
    const countyBuilds = (
        business.countyBuilds as Record<string, number>
    )[area.county]
    // Mirrors the /pricing page: baseline + live count of completed properties.
    const companyBuilds = business.buildsBaseline + (completedCount || 0)

    // ---- Floor plans available in this city ----
    // All plans, minus any larger than the city's ADU size cap (if set).
    const availableFloorplans = floorplans.filter(
        (fp) => !area.maxAduSqft || (fp.sqft ?? 0) <= area.maxAduSqft
    )

    // ---- Testimonials ----
    const featured =
        area.featuredStory?.wistiaId
            ? area.featuredStory
            : stories.find((s) => s.wistiaId)
    const cityQuotes = Array.from(
        new Map(
            stories
                .filter((s) => s.quote && s.names && s.slug !== featured?.slug)
                .map((s) => [
                    s.slug || s.names,
                    {
                        names: s.names as string,
                        quote: stripQuotes(s.quote),
                        slug: s.slug as string | undefined,
                        portraitUrl:
                            s.portrait?.secure_url || s.portrait?.url,
                        city: area.city,
                    },
                ])
        ).values()
    )

    // Fallback so the "what homeowners say" block is never empty: when this
    // city has fewer than 3 of its own quotes, top up with real testimonials
    // from across all properties (mirrors the floorplan pages). Labeled
    // honestly by county so we never imply these are local builds.
    const QUOTE_TARGET = 3
    const seenQuoteKeys = new Set(
        cityQuotes.map((q) => q.slug || q.names)
    )
    const poolQuotes =
        cityQuotes.length >= QUOTE_TARGET
            ? []
            : (testimonialPool || [])
                  .map((e) => {
                      const t = e.testimonial
                      if (!t?.quote || !t?.names) return null
                      const key = t.slug || t.names
                      if (seenQuoteKeys.has(key)) return null
                      seenQuoteKeys.add(key)
                      return {
                          names: t.names as string,
                          quote: stripQuotes(t.quote),
                          slug: t.slug as string | undefined,
                          portraitUrl:
                              t.portrait?.secure_url || t.portrait?.url,
                          city: `${area.county} County`,
                      }
                  })
                  .filter(Boolean)
                  .slice(0, QUOTE_TARGET - cityQuotes.length) as typeof cityQuotes

    const displayQuotes = [...cityQuotes, ...poolQuotes]

    // Unified, auto-rotating testimonial set: the featured story (with its
    // video) first, then every other quote. Deduped by slug/names.
    const allTestimonials = (() => {
        const out: {
            wistiaId?: string
            quote: string
            names: string
            slug?: string
            portraitUrl?: string
            city?: string
        }[] = []
        const seen = new Set<string>()
        if (featured?.wistiaId && (featured.quote || featured.purpose)) {
            out.push({
                wistiaId: featured.wistiaId,
                quote: stripQuotes(featured.quote || featured.purpose),
                names: featured.names || '',
                slug: featured.slug,
                city: area.city,
            })
            seen.add(featured.slug || featured.names || 'featured')
        }
        for (const q of displayQuotes) {
            const key = q.slug || q.names
            if (key && seen.has(key)) continue
            if (key) seen.add(key)
            out.push(q)
        }
        return out
    })()
    const hasTestimonials = allTestimonials.length > 0

    // ---- Timeline ----
    // The city (jurisdiction) side is filled per city in Sanity; our side falls
    // back to the company standard pace when a city doesn't override it.
    const tl = area.timeline
    const phaseKeys: (keyof PhaseDays)[] = [
        'plansDays',
        'permitsDays',
        'constructionDays',
    ]
    // Fill each phase from Sanity when present, otherwise from the default pace.
    // A side that's fully empty in Sanity therefore renders the complete default
    // (BE → ~7.5 months, city → ~18.5 months); a partially-filled side keeps its
    // real values and only borrows defaults for the missing phases. This avoids
    // the comparison collapsing to the one phase both sides happen to share.
    const fillTimeline = (
        side: PhaseDays | undefined,
        defaults: PhaseDays
    ): PhaseDays =>
        Object.fromEntries(
            phaseKeys.map((k) => [
                k,
                typeof side?.[k] === 'number' ? side[k] : defaults[k],
            ])
        ) as PhaseDays
    const beTimeline = fillTimeline(tl?.backyardEstates, business.standardTimeline)
    const cityTimeline = fillTimeline(tl?.city, business.industryTimeline)
    const effectiveTimeline = { city: cityTimeline, backyardEstates: beTimeline }
    const hasTimeline = phaseKeys.some(
        (k) =>
            typeof cityTimeline[k] === 'number' &&
            typeof beTimeline[k] === 'number'
    )

    // ---- ROI ----
    const rentLow = area.avgMonthlyRentLow ?? estimatedRent({ bed: 1 })
    const rentHigh = area.avgMonthlyRentHigh ?? estimatedRent({ bed: 3 })

    const nearby = area.nearby ?? []
    const localFaqs = area.localFaqs ?? []
    const permittingNotes = area.permittingNotes ?? []
    const intro = area.intro ?? []
    const neighborhoods = (area.neighborhoods ?? []).slice(0, 5)

    // Scannable fact stack for the "why build here" block (existing data only).
    const introFacts = [
        { label: 'County', value: `${area.county} County` },
        area.maxAduSqft
            ? {
                  label: 'ADU size limit',
                  value: `${area.maxAduSqft.toLocaleString()} sq ft`,
              }
            : null,
        typeof area.distanceFromUplandMi === 'number'
            ? {
                  label: 'From our Upland HQ',
                  value: `${Math.round(area.distanceFromUplandMi)} mi`,
              }
            : null,
        cityBuilds > 0
            ? {
                  label: 'ADUs built here',
                  value: `${cityBuilds}`,
              }
            : null,
    ].filter(Boolean) as { label: string; value: string }[]
    const hasIntro = intro.length > 0 || neighborhoods.length > 0

    const breadcrumbPages = [
        { title: 'Service areas', href: '/adu-builder' },
        { title: area.city, href: `/adu-builder/${area.slug}` },
    ]
    const cityLd = [localBusinessSchema(area.city), faqSchema(localFaqs)]

    // Hero photo: a real ADU we built in this city (first matched property).
    const heroImage: string | undefined = matched[0]?.image
    const showHeroImage = Boolean(heroImage) // implies cityBuilds >= 1

    // Tiered proof. When the hero shows a local photo, the city number lives on
    // the floating card over it, so the strip below carries county + company.
    const cityStat = {
        value: cityBuilds,
        label: `ADUs built in ${area.city}`,
        icon: 'home' as const,
    }
    const countyStat = countyBuilds
        ? {
              value: countyBuilds,
              suffix: '+',
              label: `across ${area.county} County`,
              icon: 'home' as const,
          }
        : null
    const companyStat = {
        value: companyBuilds,
        suffix: '+',
        label: `completed since ${business.foundingYear}`,
        icon: 'shield' as const,
    }

    // Hero floating card: lead with the city count once it's strong enough
    // (>= BUILDS_TARGET). Below that a 1–2 build number reads thin, so show the
    // county figure instead (falling back to the city count if we have no county
    // number). When the card shows the county figure, the strip drops it so it
    // never appears twice.
    const floatShowsCounty = cityBuilds < BUILDS_TARGET && !!countyBuilds
    const heroFloat = floatShowsCounty
        ? {
              value: countyBuilds,
              suffix: '+',
              label: `ADUs across ${area.county} County`,
          }
        : {
              value: cityBuilds,
              suffix: '',
              label: `ADUs built in ${area.city}`,
          }

    const stripStats = (
        showHeroImage
            ? floatShowsCounty
                ? [cityBuilds > 0 ? cityStat : null, companyStat]
                : [countyStat, companyStat]
            : [cityBuilds > 0 ? cityStat : null, countyStat, companyStat]
    ).filter(Boolean) as {
        value: number
        suffix?: string
        label: string
        icon: 'home' | 'shield' | 'clock'
    }[]

    return (
        <>
            <JsonLd data={cityLd} />
            <Nav />
            <main className={style.main}>
                <div className={style.inner}>
                    <Breadcrumbs pages={breadcrumbPages} />

                    {/* ===================== HERO ===================== */}
                    <header
                        className={`${style.hero} ${
                            showHeroImage ? style.heroSplit : ''
                        }`}
                    >
                        <div className={style.heroCopy}>
                            <p className={`${style.eyebrow} ${style.animUp}`}>
                                <span className={style.eyebrowDot} />
                                ADU Builder · {area.county} County
                            </p>
                            <h1 className={`${style.h1} ${style.animUp}`}>
                                ADU Builder in{' '}
                                <span className={style.accent}>{area.city}</span>
                                , California
                            </h1>
                            <p className={`${style.lede} ${style.animUp}`}>
                                {area.blurb}
                            </p>

                            <ReviewStars
                                tone="light"
                                className={`${style.heroRating} ${style.animUp}`}
                            />

                            <ul className={`${style.heroTrust} ${style.animUp}`}>
                                <li>
                                    <ShieldCheck className={style.heroTrustIcon} />
                                    All-in pricing
                                </li>
                                <li>
                                    <ClipboardCheck
                                        className={style.heroTrustIcon}
                                    />
                                    Permits handled
                                </li>
                                <li>
                                    <Hammer className={style.heroTrustIcon} />
                                    Design &amp; build in-house
                                </li>
                            </ul>

                            <div className={`${style.heroCtas} ${style.animUp}`}>
                                <a
                                    href="#city-lead-form"
                                    className={style.primaryBtn}
                                >
                                    See what&rsquo;s possible at your address
                                    <ArrowRight size={18} />
                                </a>
                                <a
                                    href={business.phone.href}
                                    className={style.ghostBtn}
                                >
                                    <Phone size={17} />
                                    {business.phone.display}
                                </a>
                            </div>
                        </div>

                        {showHeroImage && (
                            <div className={style.heroMedia}>
                                <div className={style.heroImageFrame}>
                                    <Image
                                        src={heroImage as string}
                                        alt={`ADU built by Backyard Estates in ${area.city}, California`}
                                        fill
                                        priority
                                        sizes="(max-width: 880px) 92vw, 42rem"
                                        className={style.heroImage}
                                    />
                                    <span className={style.heroBadge}>
                                        <MapPin size={14} />
                                        Built in {area.city}
                                    </span>
                                </div>
                                <div className={style.heroFloatCard}>
                                    <span className={style.heroFloatNum}>
                                        <AnimatedNumber
                                            value={heroFloat.value}
                                        />
                                        {heroFloat.suffix}
                                    </span>
                                    <span className={style.heroFloatLabel}>
                                        {heroFloat.label}
                                    </span>
                                </div>
                            </div>
                        )}
                    </header>

                    {/* ================ VOLUME PROOF STRIP ================ */}
                    {stripStats.length > 0 && (
                        <Reveal as="section" className={style.proofStrip}>
                            <TrustStatBar stats={stripStats} />
                        </Reveal>
                    )}

                    {/* =============== COMPLETED BUILDS (local proof) =============== */}
                    {displayProperties.length > 0 ? (
                        <Reveal as="section" className={style.section}>
                            <div className={style.sectionHead}>
                                <p className={style.kicker}>Real local proof</p>
                                <h2 className={style.h2}>
                                    {matched.length >= BUILDS_TARGET ? (
                                        cityBuilds > 6 ? (
                                            <>
                                                A few of the {cityBuilds} ADUs
                                                we&rsquo;ve built in{' '}
                                                <span
                                                    className={style.accent}
                                                >
                                                    {area.city}
                                                </span>
                                            </>
                                        ) : (
                                            <>
                                                ADUs we&rsquo;ve built in{' '}
                                                <span
                                                    className={style.accent}
                                                >
                                                    {area.city}
                                                </span>
                                            </>
                                        )
                                    ) : matched.length > 0 ? (
                                        <>
                                            ADUs we&rsquo;ve built in &amp;
                                            around{' '}
                                            <span className={style.accent}>
                                                {area.city}
                                            </span>
                                        </>
                                    ) : (
                                        <>
                                            ADUs we&rsquo;ve built across{' '}
                                            <span className={style.accent}>
                                                {area.county} County
                                            </span>
                                        </>
                                    )}
                                </h2>
                                <p className={style.body}>
                                    {toppedUp ? (
                                        <>
                                            {countyBuilds
                                                ? `${countyBuilds}+`
                                                : `${companyBuilds}+`}{' '}
                                            completed ADUs across {area.county}{' '}
                                            County — including projects near{' '}
                                            <span className={style.accent}>
                                                {area.city}
                                            </span>
                                            . Tap any for its floor plan,
                                            finishes, and timeline.
                                        </>
                                    ) : (
                                        <>
                                            Real homes on real{' '}
                                            <span className={style.accent}>
                                                {area.city}
                                            </span>{' '}
                                            lots — not renderings. Tap any
                                            project for its floor plan, finishes,
                                            and build timeline.
                                        </>
                                    )}
                                </p>
                            </div>
                            <ExpandableProperties
                                properties={displayProperties}
                                initial={6}
                                label={
                                    toppedUp ? 'ADUs' : `${area.city} ADUs`
                                }
                            />
                        </Reveal>
                    ) : countyBuilds ? (
                        <Reveal as="section" className={style.section}>
                            <div className={style.sectionHead}>
                                <p className={style.kicker}>Real proof</p>
                                <h2 className={style.h2}>
                                    We build across{' '}
                                    <span className={style.accent}>
                                        {area.county} County
                                    </span>
                                </h2>
                                <p className={style.body}>
                                    <span className={style.accent}>
                                        {area.city}
                                    </span>{' '}
                                    sits in our core build area. We&rsquo;ve
                                    completed {countyBuilds}+ ADUs across{' '}
                                    {area.county} County and {companyBuilds}+
                                    since {business.foundingYear} — every one
                                    designed and built in-house.
                                </p>
                            </div>
                        </Reveal>
                    ) : null}

                    {/* ============== TESTIMONIALS ============== */}
                    {hasTestimonials && (
                        <Reveal as="section" className={style.section}>
                            <div className={style.sectionHead}>
                                <p className={style.kicker}>Loved by neighbors</p>
                                <h2 className={style.h2}>
                                    What{' '}
                                    <span className={style.accent}>
                                        {area.city}
                                    </span>{' '}
                                    homeowners say
                                </h2>
                            </div>
                            <TestimonialCarousel
                                items={allTestimonials}
                                cityName={area.city}
                            />
                        </Reveal>
                    )}

                    {/* =================== ROI (the opportunity) =================== */}
                    <Reveal as="section" className={style.section}>
                        <div className={style.sectionHead}>
                            <p className={style.kicker}>The opportunity</p>
                            <h2 className={style.h2}>
                                What an ADU returns in{' '}
                                <span className={style.accent}>
                                    {area.city}
                                </span>
                            </h2>
                            <p className={style.body}>
                                Turn underused backyard into monthly income and
                                lasting value.
                            </p>
                        </div>
                        <CityRoi
                            cityName={area.city}
                            rentLow={rentLow}
                            rentHigh={rentHigh}
                            valueLow={PROPERTY_VALUE_INCREASE.low}
                            valueHigh={PROPERTY_VALUE_INCREASE.high}
                        />
                    </Reveal>

                    {/* =================== LEAD FORM (the ask) =================== */}
                    <Reveal as="section" className={style.formSection}>
                        <CityLeadForm cityName={area.city} />
                    </Reveal>

                    {/* =============== TIMELINE COMPARISON =============== */}
                    {hasTimeline && (
                        <Reveal as="section" className={style.section}>
                            <TimelineComparison
                                cityName={area.city}
                                timeline={effectiveTimeline}
                                source={business.timelineSource}
                            />
                        </Reveal>
                    )}

                    {/* =================== PERMITS & FEES =================== */}
                    <Reveal as="section" className={style.section}>
                        <div className={style.sectionHead}>
                            <p className={style.kicker}>Permits &amp; fees</p>
                            <h2 className={style.h2}>
                                Red tape in{' '}
                                <span className={style.accent}>
                                    {area.city}
                                </span>
                                , handled
                            </h2>
                            <p className={style.body}>
                                Permitting an ADU touches a dozen departments and
                                a stack of fees. We run every one — and it&rsquo;s
                                already in your fixed, all-in price.
                            </p>
                        </div>

                        {/* The city's rules (statewide CA ADU law) */}
                        <div className={style.permitCard}>
                            {area.permittingDepartment && (
                                <p className={style.permitDept}>
                                    <Building2
                                        className={style.permitDeptIcon}
                                    />
                                    Reviewed by the {area.permittingDepartment}
                                </p>
                            )}
                            <p className={style.body}>
                                What California&rsquo;s statewide ADU law means
                                for your{' '}
                                <span className={style.accent}>
                                    {area.city}
                                </span>{' '}
                                property:
                            </p>
                            <ul className={style.checkList}>
                                {(permittingNotes.length
                                    ? permittingNotes
                                    : DEFAULT_PERMIT_NOTES
                                ).map((note, i) => (
                                    <li key={i} className={style.checkItem}>
                                        <Check className={style.checkIcon} />
                                        {note}
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* What WE take off your plate (distinct dark panel) */}
                        <div className={style.coverageCard}>
                            <p className={style.coverageEyebrow}>
                                Every city fee — already in your price
                            </p>
                            <h3 className={style.coverageLead}>
                                No surprise municipal bills. We absorb every{' '}
                                <span className={style.accentLight}>
                                    {area.city}
                                </span>{' '}
                                permit and city fee into one fixed, all-in
                                price.
                            </h3>

                            <ul className={style.feesRow}>
                                {INCLUDED_FEES.map((fee) => (
                                    <li key={fee} className={style.feeChip}>
                                        <Check size={15} />
                                        {fee}
                                    </li>
                                ))}
                            </ul>

                            <ul className={style.coverageList}>
                                <li>
                                    <span className={style.coverageIcon}>
                                        <Landmark size={20} />
                                    </span>
                                    <span>
                                        We run{' '}
                                        <strong>
                                            all ~11 city &amp; county departments
                                        </strong>{' '}
                                        — plan check, building, fire, public
                                        works, utilities, and school fees.
                                    </span>
                                </li>
                                <li>
                                    <span className={style.coverageIcon}>
                                        <BadgeCheck size={20} />
                                    </span>
                                    <span>
                                        Our Formal Property Analysis verifies{' '}
                                        <strong className={style.coverageNum}>
                                            <AnimatedNumber
                                                value={FPA_POINTS_VALUE}
                                            />
                                            +
                                        </strong>{' '}
                                        property &amp; city items — fire
                                        sprinklers, school &amp; plan-check fees,
                                        lot coverage, Title 24 — before we build.
                                    </span>
                                </li>
                            </ul>
                            <p className={style.coverageFine}>
                                Specific setbacks, fees, and overlay rules are
                                confirmed for your exact parcel during your free
                                Formal Property Analysis.
                            </p>
                        </div>
                    </Reveal>

                    {/* =================== FLOOR PLANS =================== */}
                    {availableFloorplans.length > 0 && (
                        <Reveal className={style.floorplans}>
                            <OtherFloorplans
                                floorplans={availableFloorplans}
                                eyebrow="Choose your layout"
                                title={`Floor plans we build in ${area.city}`}
                                subtitle={
                                    area.maxAduSqft
                                        ? `Sized for ${area.city}'s ${area.maxAduSqft.toLocaleString()} sq ft ADU limit — every plan is all-inclusive and fully customizable.`
                                        : 'Every plan is all-inclusive, fully customizable, and built on your lot.'
                                }
                                seeAllHref="/floorplans"
                            />
                        </Reveal>
                    )}

                    {/* =================== WHY BUILD HERE (intro) =================== */}
                    {hasIntro && (
                        <Reveal as="section" className={style.section}>
                            <div className={style.sectionHead}>
                                <p className={style.kicker}>Local know-how</p>
                                <h2 className={style.h2}>
                                    Why homeowners build in{' '}
                                    <span className={style.accent}>
                                        {area.city}
                                    </span>
                                </h2>
                            </div>
                            <div className={style.whyGrid}>
                                <div className={style.whyProse}>
                                    {intro.length > 0 ? (
                                        <PortableText
                                            value={intro}
                                            components={introComponents}
                                        />
                                    ) : (
                                        <p className={style.body}>
                                            <span className={style.accent}>
                                                {area.city}
                                            </span>{' '}
                                            homeowners are adding ADUs for rental
                                            income, multigenerational living, and
                                            lasting property value — and we
                                            handle the entire design, permitting,
                                            and build in-house.
                                        </p>
                                    )}
                                    {neighborhoods.length > 0 && (
                                        <div className={style.hoodWrap}>
                                            <p className={style.hoodLabel}>
                                                Building throughout{' '}
                                                <span
                                                    className={style.accent}
                                                >
                                                    {area.city}
                                                </span>
                                            </p>
                                            <div className={style.hoodChips}>
                                                {neighborhoods.map((n) => (
                                                    <span
                                                        key={n}
                                                        className={
                                                            style.hoodChip
                                                        }
                                                    >
                                                        <MapPin size={13} />
                                                        {n}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                                {introFacts.length > 0 && (
                                    <aside className={style.factStack}>
                                        {introFacts.map((f) => (
                                            <div
                                                key={f.label}
                                                className={style.fact}
                                            >
                                                <span
                                                    className={style.factValue}
                                                >
                                                    {f.value}
                                                </span>
                                                <span
                                                    className={style.factLabel}
                                                >
                                                    {f.label}
                                                </span>
                                            </div>
                                        ))}
                                    </aside>
                                )}
                            </div>
                        </Reveal>
                    )}

                    {/* =================== LOCAL FAQ =================== */}
                    <Reveal as="section" className={style.section}>
                        <div className={style.sectionHead}>
                            <p className={style.kicker}>Good to know</p>
                            <h2 className={style.h2}>
                                <span className={style.accent}>
                                    {area.city}
                                </span>{' '}
                                ADU questions, answered
                            </h2>
                        </div>
                        <div className={style.faqs}>
                            {localFaqs.map((f, i) => (
                                <Faq
                                    key={i}
                                    question={f.question}
                                    cta={{
                                        label: 'See what’s possible at your address',
                                        href: '#city-lead-form',
                                    }}
                                >
                                    <p>{f.answer}</p>
                                </Faq>
                            ))}
                        </div>
                    </Reveal>

                    {/* =================== NEARBY =================== */}
                    {nearby.length > 0 && (
                        <Reveal as="section" className={style.section}>
                            <div className={style.sectionHead}>
                                <p className={style.kicker}>Keep exploring</p>
                                <h2 className={style.h2}>
                                    Nearby areas we build in
                                </h2>
                            </div>
                            <div className={style.chipRow}>
                                {nearby.map((n) => (
                                    <Link
                                        key={n.slug}
                                        href={`/adu-builder/${n.slug}`}
                                        className={style.chip}
                                    >
                                        <MapPin
                                            size={15}
                                            className={style.chipArrow}
                                        />
                                        ADUs in {n.city}
                                    </Link>
                                ))}
                                <Link href="/adu-builder" className={style.chip}>
                                    All service areas
                                    <ArrowRight
                                        size={15}
                                        className={style.chipArrow}
                                    />
                                </Link>
                            </div>
                        </Reveal>
                    )}
                </div>

                <AttentionCTA
                    eyebrow="Get Started"
                    title={`Build your ADU in ${area.city}`}
                    description="Drop in your address and we'll show you what's possible on your lot, what it costs all-in, and what it could earn — no pressure."
                    primaryLabel="See what’s possible at your address"
                    primaryHref="#city-lead-form"
                    secondaryText={`Or call ${business.phone.display}`}
                    secondaryHref={business.phone.href}
                />

                {/* Sticky mobile CTA — keeps the ask one tap away on every scroll */}
                <div className={style.stickyCta}>
                    <a
                        href="#city-lead-form"
                        className={style.stickyPrimary}
                    >
                        See what&rsquo;s possible
                        <ArrowRight size={16} />
                    </a>
                    <a
                        href={business.phone.href}
                        className={style.stickyCall}
                        aria-label={`Call ${business.phone.display}`}
                    >
                        <Phone size={18} />
                    </a>
                </div>
            </main>
            <Footer />
        </>
    )
}
