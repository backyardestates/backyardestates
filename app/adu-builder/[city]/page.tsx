import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { SanityDocument } from 'next-sanity'
import {
    MapPin,
    ShieldCheck,
    Check,
    ArrowRight,
    Building2,
    Phone,
} from 'lucide-react'

import { client } from '@/sanity/client'
import { PROPERTIES_BY_CITY_QUERY, FLOORPLANS_QUERY } from '@/sanity/queries'

import Nav from '@/components/Nav'
import Footer from '@/components/Footer'
import Breadcrumbs from '@/components/Breadcrumbs'
import PropertyCard from '@/components/PropertyCard'
import Faq from '@/components/Faq'
import AttentionCTA from '@/components/AttentionCTA'
import JsonLd from '@/components/JsonLd'
import Reveal from '@/components/Reveal'

import { buildMetadata } from '@/lib/seo'
import { business } from '@/lib/business'
import { localBusinessSchema, faqSchema } from '@/lib/jsonLd'
import {
    SERVICE_AREAS,
    SERVICE_AREA_SLUGS,
    getServiceArea,
} from '@/content/serviceAreas'

import style from './page.module.css'

const options = { next: { revalidate: 3600 } }

export function generateStaticParams() {
    return SERVICE_AREA_SLUGS.map((city) => ({ city }))
}

export async function generateMetadata({
    params,
}: {
    params: Promise<{ city: string }>
}) {
    const { city } = await params
    const area = getServiceArea(city)
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
    const area = getServiceArea(city)
    if (!area) notFound()

    const [rawProperties, floorplans] = await Promise.all([
        client.fetch<SanityDocument[]>(
            PROPERTIES_BY_CITY_QUERY,
            { city: area.city },
            options
        ),
        client.fetch<{ name: string; slug: { current: string } }[]>(
            FLOORPLANS_QUERY,
            {},
            options
        ),
    ])

    // The GROQ `match` is token-based, so it over-matches (e.g. "West Covina"
    // for "Covina") and matches across the new (address.city) and legacy
    // (location "City, ST") schemas. Keep only exact city matches, normalizing
    // for trailing spaces and case. Then cap how many we show.
    const normCity = (s?: string | null) => (s || '').trim().toLowerCase()
    const properties = rawProperties
        .filter((p) => {
            const c =
                p.city ||
                (typeof p.location === 'string'
                    ? p.location.split(',')[0]
                    : '')
            return normCity(c) === normCity(area.city)
        })
        .slice(0, 6)

    const nearby = area.nearby
        .map((slug) => SERVICE_AREAS.find((a) => a.slug === slug))
        .filter(Boolean) as typeof SERVICE_AREAS

    const breadcrumbPages = [
        { title: 'Service areas', href: '/adu-builder' },
        { title: area.city, href: `/adu-builder/${area.slug}` },
    ]

    // Breadcrumb schema is emitted by the <Breadcrumbs> component below.
    const cityLd = [localBusinessSchema(area.city), faqSchema(area.localFaqs)]

    const distanceLabel =
        area.distanceFromUplandMi === 0
            ? 'Our home city'
            : `${area.distanceFromUplandMi} mi from our Upland office`

    return (
        <>
            <JsonLd data={cityLd} />
            <Nav />
            <main className={style.main}>
                <div className={style.inner}>
                    <Breadcrumbs pages={breadcrumbPages} />

                    {/* ===================== HERO ===================== */}
                    <header className={style.hero}>
                        <div className={style.heroInner}>
                            <p className={style.eyebrow}>
                                <span className={style.eyebrowDot} />
                                ADU Builder · {area.county} County
                            </p>
                            <h1 className={style.h1}>
                                ADU Builder in{' '}
                                <span className={style.accent}>{area.city}</span>
                                , California
                            </h1>
                            <p className={style.lede}>{area.blurb}</p>

                            <ul className={style.heroStats}>
                                <li className={style.statPill}>
                                    <MapPin className={style.statPillIcon} />
                                    {distanceLabel}
                                </li>
                                {properties.length > 0 && (
                                    <li className={style.statPill}>
                                        <Building2
                                            className={style.statPillIcon}
                                        />
                                        {properties.length} completed nearby
                                    </li>
                                )}
                                <li className={style.statPill}>
                                    <ShieldCheck
                                        className={style.statPillIcon}
                                    />
                                    All-in pricing
                                </li>
                            </ul>

                            <div className={style.heroCtas}>
                                <Link
                                    href="/talk-to-an-adu-specialist"
                                    className={style.primaryBtn}
                                >
                                    Talk to an ADU specialist
                                    <ArrowRight size={18} />
                                </Link>
                                <a
                                    href={business.phone.href}
                                    className={style.ghostBtn}
                                >
                                    <Phone size={17} />
                                    {business.phone.display}
                                </a>
                            </div>
                        </div>
                    </header>

                    {/* ===================== INTRO ===================== */}
                    <Reveal as="section" className={style.section}>
                        <div className={`${style.sectionHead} ${style.intro}`}>
                            {area.intro.map((para, i) => (
                                <p key={i} className={style.body}>
                                    {para}
                                </p>
                            ))}
                        </div>
                    </Reveal>

                    {/* =============== COMPLETED BUILDS =============== */}
                    {properties.length > 0 && (
                        <Reveal as="section" className={style.section}>
                            <div className={style.sectionHead}>
                                <p className={style.kicker}>Real local proof</p>
                                <h2 className={style.h2}>
                                    ADUs we&rsquo;ve built in and around{' '}
                                    {area.city}
                                </h2>
                                <p className={style.body}>
                                    Completed accessory dwelling units near{' '}
                                    {area.city} — not renderings. Walk through
                                    the details and the homeowners&rsquo; own
                                    stories.
                                </p>
                            </div>
                            <div className={style.cardGrid}>
                                {properties.map((p, i) => (
                                    <Reveal key={p._id} delay={i * 70}>
                                        <PropertyCard content={p} />
                                    </Reveal>
                                ))}
                            </div>
                        </Reveal>
                    )}

                    {/* =================== PERMITTING =================== */}
                    <Reveal as="section" className={style.section}>
                        <div className={style.sectionHead}>
                            <p className={style.kicker}>Local know-how</p>
                            <h2 className={style.h2}>
                                ADU rules &amp; permits in {area.city}
                            </h2>
                        </div>
                        <div className={style.permitCard}>
                            <p className={style.permitDept}>
                                <Building2 className={style.permitDeptIcon} />
                                Reviewed by the {area.permitting.department}
                            </p>
                            <p className={style.body}>
                                Backyard Estates handles the entire permitting
                                process for you. Here&rsquo;s what
                                California&rsquo;s statewide ADU law means for
                                your {area.city} property:
                            </p>
                            <ul className={style.checkList}>
                                {area.permitting.notes.map((note, i) => (
                                    <li key={i} className={style.checkItem}>
                                        <Check className={style.checkIcon} />
                                        {note}
                                    </li>
                                ))}
                            </ul>
                            <p className={style.fineprint}>
                                Specific setbacks, fees, and overlay rules are
                                confirmed for your exact parcel during your
                                Formal Property Analysis.
                            </p>
                        </div>
                    </Reveal>

                    {/* =================== FLOOR PLANS =================== */}
                    {floorplans.length > 0 && (
                        <Reveal as="section" className={style.section}>
                            <div className={style.sectionHead}>
                                <p className={style.kicker}>Choose your layout</p>
                                <h2 className={style.h2}>
                                    ADU floor plans available in {area.city}
                                </h2>
                            </div>
                            <div className={style.chipRow}>
                                {floorplans.map((fp) => (
                                    <Link
                                        key={fp.slug.current}
                                        href={`/floorplans/${fp.slug.current}`}
                                        className={style.chip}
                                    >
                                        {fp.name}
                                    </Link>
                                ))}
                            </div>
                            <Link href="/floorplans" className={style.textLink}>
                                See all ADU floor plans &amp; pricing
                                <ArrowRight size={17} className={style.chipArrow} />
                            </Link>
                        </Reveal>
                    )}

                    {/* =================== LOCAL FAQ =================== */}
                    <Reveal as="section" className={style.section}>
                        <div className={style.sectionHead}>
                            <p className={style.kicker}>Good to know</p>
                            <h2 className={style.h2}>
                                {area.city} ADU questions, answered
                            </h2>
                        </div>
                        <div className={style.faqs}>
                            {area.localFaqs.map((f, i) => (
                                <Faq
                                    key={i}
                                    question={f.question}
                                    cta={{
                                        label: 'Talk to an ADU specialist',
                                        href: '/talk-to-an-adu-specialist',
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
                                        <MapPin size={15} className={style.chipArrow} />
                                        ADUs in {n.city}
                                    </Link>
                                ))}
                                <Link href="/adu-builder" className={style.chip}>
                                    All service areas
                                    <ArrowRight size={15} className={style.chipArrow} />
                                </Link>
                            </div>
                        </Reveal>
                    )}
                </div>

                <AttentionCTA
                    eyebrow="Get Started"
                    title={`Build your ADU in ${area.city}`}
                    description="Start with a free office visit. We pull up your property, show you what's possible, and give you a clear, all-in path forward — no pressure."
                    primaryLabel="Talk to an ADU Specialist"
                    primaryHref="/talk-to-an-adu-specialist"
                    secondaryText={`Or call ${business.phone.display}`}
                    secondaryHref={business.phone.href}
                />
            </main>
            <Footer />
        </>
    )
}
