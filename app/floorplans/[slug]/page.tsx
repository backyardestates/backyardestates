import { type SanityDocument } from 'next-sanity'
import { client } from '@/sanity/client'
const options = { next: { revalidate: 30 } }

import { notFound } from 'next/navigation'

import CustomerStory from '@/components/CustomerStory'
import CustomFloorplanShowcase from '@/components/CustomFloorplanShowcase'
import FloorplanHero from '@/components/FloorplanHero'
import FloorplanInclusions from '@/components/FloorplanInclusions'
import Footer from '@/components/Footer'
import HomeownerQuotes from '@/components/HomeownerQuotes'
import IncludedServices from '@/components/IncludedServices'
import LotPlacementCTA from '@/components/LotPlacementCTA'
import Nav from '@/components/Nav'
import OfficeVisitShowcase from '@/components/OfficeVisitShowcase'
import OtherFloorplans from '@/components/OtherFloorplans'
import SelectionsGallery from '@/components/SelectionsGallery'
import SoftCTA from '@/components/SoftCTA'

import { MapPin, CalendarDays, PencilRuler } from 'lucide-react'

import {
    OFFICE_VISIT_HREF,
    PHONE_DISPLAY,
    PHONE_HREF,
} from '@/content/financing'
import { getInclusions } from '@/content/inclusions'
import { BUILD_PHASES } from '@/content/timeline'
import { groupSelections } from '@/lib/groupSelections'
import {
    cityOf,
    uniqueCities,
    formatCities,
    sqftQualifier,
} from '@/lib/estateFacts'
import {
    FLOORPLAN_ESTATES_QUERY,
    OTHER_FLOORPLANS_QUERY,
    SELECTIONS_QUERY,
    TESTIMONIALS_POOL_QUERY,
} from '@/sanity/queries'

import style from './page.module.css'

const FLOORPLAN_QUERY = `
    *[_type == "floorplan" && slug.current == $slug][0]{
    _id,name,body,images,bed,bath,sqft,price,drawing,download,videoID,relatedProperties[]->{name,thumbnail,slug,name,bed,bath,sqft,floorplan->{name,bed,bath,sqft,slug}}}`

const FLOORPLAN_SIZES_QUERY = `*[_type == "floorplan" && name != "Custom Estate"]{name,bed,sqft}`

const HOW_IT_WORKS = [
    {
        icon: CalendarDays,
        step: 1,
        title: 'Start with an office visit',
        text: 'A free, educational session — not a sales pitch. We pull up your property on the big screen and show you exactly what’s possible.',
    },
    {
        icon: MapPin,
        step: 2,
        title: 'We analyze your property',
        text: 'We review your lot, city rules, setbacks, and utilities to find the smartest placement and the layout that best fits your goals.',
    },
    {
        icon: PencilRuler,
        step: 3,
        title: 'We design, permit & build',
        text: 'Our architects turn it into permit-ready custom plans, then we handle all 11 city departments and construction end-to-end.',
    },
]

export default async function Floorplan({
    params,
}: {
    params: Promise<{ slug: string }>
}) {
    const { slug } = await params

    const [
        floorplan,
        estates,
        selections,
        allFloorplans,
        testimonialPool,
        otherFloorplans,
    ] = await Promise.all([
        client.fetch<SanityDocument>(FLOORPLAN_QUERY, { slug }, options),
        client.fetch<SanityDocument[]>(
            FLOORPLAN_ESTATES_QUERY,
            { slug },
            options
        ),
        client.fetch<SanityDocument[]>(SELECTIONS_QUERY, {}, options),
        client.fetch<SanityDocument[]>(FLOORPLAN_SIZES_QUERY, {}, options),
        client.fetch<SanityDocument[]>(TESTIMONIALS_POOL_QUERY, {}, options),
        client.fetch<SanityDocument[]>(OTHER_FLOORPLANS_QUERY, { slug }, options),
    ])

    if (!floorplan) {
        notFound()
    }

    const { bed, sqft } = floorplan

    const solarIncluded = (bed ?? 0) >= 2
    const inclusions = getInclusions(solarIncluded)
    const groupedSelections =
        selections && selections.length ? groupSelections(selections) : null

    // ----- Data-derived proof facts (no invented numbers) -----
    const cities = uniqueCities(estates as any)
    const citiesLabel = formatCities(cities)
    const qualifier = sqftQualifier({ bed, sqft }, allFloorplans as any)

    // Homeowner quotes from this estate's properties (deduped by story slug)
    const quotes: {
        names: string
        quote: string
        slug?: string
        portraitUrl?: string
        city?: string
    }[] = []
    const seenQuote = new Set<string>()
    for (const e of estates as any[]) {
        const t = e.testimonial
        if (t?.quote) {
            const key = t.slug || t.names
            if (key && !seenQuote.has(key)) {
                seenQuote.add(key)
                quotes.push({
                    names: t.names,
                    quote: t.quote,
                    slug: t.slug,
                    portraitUrl: t.portrait?.url || t.portrait?.secure_url,
                    city: cityOf(e),
                })
            }
        }
    }

    // Always surface 3 quotes — when this plan's estates supply fewer, top up
    // with random testimonials from across all properties (excluding any
    // already shown above).
    if (quotes.length < 3) {
        const fillers: typeof quotes = []
        for (const e of testimonialPool as any[]) {
            const t = e.testimonial
            if (t?.quote) {
                const key = t.slug || t.names
                if (key && !seenQuote.has(key)) {
                    seenQuote.add(key)
                    fillers.push({
                        names: t.names,
                        quote: t.quote,
                        slug: t.slug,
                        portraitUrl: t.portrait?.url || t.portrait?.secure_url,
                        city: cityOf(e),
                    })
                }
            }
        }
        for (let i = fillers.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1))
                ;[fillers[i], fillers[j]] = [fillers[j], fillers[i]]
        }
        quotes.push(...fillers.slice(0, 3 - quotes.length))
    }

    return (
        <>
            <Nav />
            <main className={style.main}>
                <FloorplanHero
                    floorplan={floorplan}
                    citiesLabel={citiesLabel}
                    citiesCount={cities.length}
                    qualifier={qualifier}
                />

                {/* 3. Included in every build */}
                <section className={style.included}>
                    <div className={`${style.sectionIntro} ${style.fadeInUp}`}>
                        <span className={style.eyebrow}>
                            Everything included
                        </span>
                        <h2 className={style.sectionTitle}>
                            Included in every build
                        </h2>
                        <p className={style.sectionLede}>
                            From the kitchen to the systems behind the walls —
                            here&rsquo;s exactly what comes standard with the{' '}
                            {floorplan.name}.
                        </p>
                    </div>
                    <FloorplanInclusions categories={inclusions} />
                    <IncludedServices />
                </section>

                {/* 4. Estates built from this plan */}
                <CustomFloorplanShowcase
                    estates={estates as any}
                    floorplanName={floorplan.name}
                />

                {/* 5. How it works — office visit → analysis → architect */}
                <section className={style.valueProps}>
                    <div
                        className={`${style.valuePropsIntro} ${style.fadeInUp}`}
                    >
                        <span className={style.eyebrow}>How it works</span>
                        <h2 className={style.sectionTitle}>
                            From your backyard to move-in
                        </h2>
                    </div>
                    <div className={style.valueGrid}>
                        {HOW_IT_WORKS.map((s) => {
                            const Icon = s.icon
                            return (
                                <div key={s.step} className={style.valueCard}>
                                    <span className={style.stepNumber}>
                                        {s.step}
                                    </span>
                                    <Icon className={style.valueIcon} />
                                    <h3>{s.title}</h3>
                                    <p>{s.text}</p>
                                </div>
                            )
                        })}
                    </div>
                    <p className={style.timelineStrip}>
                        Typical timeline — Plans {BUILD_PHASES[0].timeline} ·
                        Permits {BUILD_PHASES[1].timeline} · Construction{' '}
                        {BUILD_PHASES[2].timeline}
                    </p>
                </section>

                {/* 7. Final CTA — office visit showcase */}
                <OfficeVisitShowcase floorplanName={floorplan.name} />



                {/* 6. What homeowners say */}
                <HomeownerQuotes quotes={quotes} />



                {/* 8. Finishes & selections */}
                {groupedSelections && (
                    <section className={style.selections}>
                        <div
                            className={`${style.sectionIntro} ${style.fadeInUp}`}
                        >
                            <span className={style.eyebrow}>Make it yours</span>
                            <h2 className={style.sectionTitle}>
                                Finishes &amp; selections
                            </h2>
                            <p className={style.sectionLede}>
                                Every finish and fixture is chosen with
                                intention. Explore the standard options and
                                available upgrades.
                            </p>
                        </div>
                        <SelectionsGallery
                            data={groupedSelections}
                            variant="catalog"
                        />
                        <SoftCTA
                            linkText="See everything that’s included"
                            href="/selections"
                        />
                    </section>
                )}

                {/* 5b. See it on your lot — drag-and-rotate placement CTA */}
                <section id="on-your-lot" className={style.lotCta}>
                    <LotPlacementCTA
                        plans={[{ name: floorplan.name, sqft }]}
                        ctaHref={OFFICE_VISIT_HREF}
                        phoneDisplay={PHONE_DISPLAY}
                        phoneHref={PHONE_HREF}
                    />
                </section>

                {/* 9. Keep exploring — other floorplans */}
                <OtherFloorplans floorplans={otherFloorplans as any} />
            </main>
            <Footer />
        </>
    )
}
