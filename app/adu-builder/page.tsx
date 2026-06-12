import Link from 'next/link'
import { MapPin, ArrowRight, ArrowUpRight } from 'lucide-react'

import Nav from '@/components/Nav'
import Footer from '@/components/Footer'
import AttentionCTA from '@/components/AttentionCTA'
import JsonLd from '@/components/JsonLd'
import Reveal from '@/components/Reveal'

import { client } from '@/sanity/client'
import { SERVICE_AREAS_QUERY } from '@/sanity/queries'

import { buildMetadata } from '@/lib/seo'
import { business, COUNTIES_SERVED } from '@/lib/business'
import { localBusinessSchema, breadcrumbSchema } from '@/lib/jsonLd'

import style from './page.module.css'

const options = { next: { revalidate: 3600 } }

export const metadata = buildMetadata({
    title: 'ADU Builder Serving the Inland Empire & Greater LA',
    description:
        'Backyard Estates builds custom ADUs (accessory dwelling units, granny flats, and casitas) across the Inland Empire, San Bernardino, Riverside, and Los Angeles counties. Find your city and see local projects.',
    path: '/adu-builder',
})

type AreaRow = { slug: string; city: string; county: string }
const COUNTY_ORDER = ['San Bernardino', 'Riverside', 'Los Angeles'] as const

export default async function ServiceAreasIndex() {
    const areas = await client.fetch<AreaRow[]>(SERVICE_AREAS_QUERY, {}, options)

    const byCounty = COUNTY_ORDER.map((county) => ({
        county,
        cities: areas
            .filter((a) => a.county === county)
            .sort((a, b) => a.city.localeCompare(b.city)),
    })).filter((g) => g.cities.length > 0)

    const ld = [
        localBusinessSchema(),
        breadcrumbSchema([
            { name: 'Home', href: '/' },
            { name: 'Service areas', href: '/adu-builder' },
        ]),
    ]

    return (
        <>
            <JsonLd data={ld} />
            <Nav />
            <main className={style.main}>
                <div className={style.inner}>
                    <header className={style.hero}>
                        <div className={style.heroInner}>
                            <p className={style.eyebrow}>
                                <span className={style.eyebrowDot} />
                                Service Areas
                            </p>
                            <h1 className={style.h1}>
                                ADU Builder for the{' '}
                                <span className={style.accent}>
                                    Inland Empire
                                </span>{' '}
                                &amp; Greater Los Angeles
                            </h1>
                            <p className={style.lede}>
                                Backyard Estates designs and builds custom ADUs
                                — accessory dwelling units, also called granny
                                flats, casitas, in-law suites, and backyard
                                homes — across{' '}
                                {COUNTIES_SERVED.join(', ').replace(
                                    /,([^,]*)$/,
                                    ', and$1'
                                )}
                                . We&rsquo;re headquartered in Upland and build
                                throughout a roughly 30-mile radius. Find your
                                city below.
                            </p>
                            <div className={style.heroCtas}>
                                <Link
                                    href="/talk-to-an-adu-specialist"
                                    className={style.primaryBtn}
                                >
                                    Talk to an ADU specialist
                                    <ArrowRight size={18} />
                                </Link>
                            </div>
                        </div>
                    </header>

                    {byCounty.map((group, gi) => (
                        <Reveal
                            as="section"
                            key={group.county}
                            className={style.section}
                            delay={gi * 80}
                        >
                            <div className={style.countyHead}>
                                <h2 className={style.h2}>
                                    {group.county} County
                                </h2>
                                <span className={style.countyCount}>
                                    {group.cities.length}{' '}
                                    {group.cities.length === 1
                                        ? 'city'
                                        : 'cities'}
                                </span>
                            </div>
                            <div className={style.cityGrid}>
                                {group.cities.map((c, i) => (
                                    <Reveal key={c.slug} delay={i * 50}>
                                        <Link
                                            href={`/adu-builder/${c.slug}`}
                                            className={style.cityCard}
                                        >
                                            <span className={style.cityName}>
                                                <MapPin
                                                    className={
                                                        style.cityNameIcon
                                                    }
                                                />
                                                {c.city}
                                            </span>
                                            <ArrowUpRight
                                                size={18}
                                                className={style.cityArrow}
                                            />
                                        </Link>
                                    </Reveal>
                                ))}
                            </div>
                        </Reveal>
                    ))}
                </div>

                <AttentionCTA
                    eyebrow="Get Started"
                    title="Not sure if your lot qualifies?"
                    description="Start with a free office visit. We pull up your property, show you what's possible, and give you a clear, all-in path forward."
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
