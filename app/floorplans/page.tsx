import { type SanityDocument } from 'next-sanity'
import { client } from '@/sanity/client'
const FLOORPLANS_QUERY = `*[_type == "floorplan" && isClickable != false && name != "Custom Estate"]|order(orderID asc){_id, bed, bath, sqft, price, name, body, publishedAt, drawing, slug}`
const options = { next: { revalidate: 30 } }

import Footer from '@/components/Footer'
import Nav from '@/components/Nav'
import FloorplansGrid from '@/components/FloorplansGrid'
import AttentionCTA from '@/components/AttentionCTA'

import { PackageCheck, Wand2, Home } from 'lucide-react'

import style from './page.module.css'
import { buildMetadata } from '@/lib/seo'

export const metadata = buildMetadata({
    title: 'ADU Floor Plans & All-In Pricing',
    description:
        'Browse Backyard Estates ADU floor plans (accessory dwelling units, granny flats, and casitas) — every plan is all-inclusive, fully customizable, and can be built on your property across the Inland Empire and LA area.',
    path: '/floorplans',
})

const VALUE_STRIP = [
    { icon: PackageCheck, label: 'All-inclusive pricing' },
    { icon: Wand2, label: 'Fully customizable' },
    { icon: Home, label: 'See it on your property' },
]

export default async function Floorplan() {
    const properties = await client.fetch<SanityDocument[]>(
        FLOORPLANS_QUERY,
        {},
        options
    )

    const sqfts = properties
        .map((p) => p.sqft)
        .filter((s): s is number => typeof s === 'number')
    const minSqft = sqfts.length ? Math.min(...sqfts) : null
    const maxSqft = sqfts.length ? Math.max(...sqfts) : null

    return (
        <>
            <Nav />
            <main className={style.main}>
                {/* Compact hero — three things, fast */}
                <section className={style.hero}>
                    <div className={style.heroText}>
                        <span className={style.heroEyebrow}>ADU floor plans</span>
                        <h1 className={style.heroTitle}>
                            Find the ADU that fits your backyard and your
                            budget
                        </h1>
                        {minSqft && maxSqft && (
                            <p className={style.heroSubtitle}>
                                Plans from {minSqft.toLocaleString()}–
                                {maxSqft.toLocaleString()} sq ft, each priced
                                all-in and ready to make yours.
                            </p>
                        )}
                    </div>
                    <ul className={style.valueStrip}>
                        {VALUE_STRIP.map((item) => {
                            const Icon = item.icon
                            return (
                                <li key={item.label}>
                                    <Icon
                                        className={style.valueIcon}
                                        aria-hidden="true"
                                    />
                                    <span>{item.label}</span>
                                </li>
                            )
                        })}
                    </ul>
                </section>

                {/* The plans — the highlight of the page */}
                <section className={style.plans}>
                    <FloorplansGrid properties={properties} />
                </section>

                <AttentionCTA
                    eyebrow="Get Started"
                    title="See it on your property"
                    description="Bring your address to a no-pressure office visit and we’ll show you exactly how any of these plans fits your lot — all-in pricing, customization, and timeline included."
                    primaryLabel="Schedule your office visit"
                    primaryHref="/talk-to-an-adu-specialist/office-consultation"
                    secondaryText="Or call (909) 500-0917"
                    secondaryHref="tel:+19095000917"
                />
            </main>
            <Footer />
        </>
    )
}
