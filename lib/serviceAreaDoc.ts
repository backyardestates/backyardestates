// Builds a Sanity `serviceArea` document from plain researched content.
// Shared by the manual seed, the on-demand sync script, and the webhook.
import { business } from '@/lib/business'

export type County = 'San Bernardino' | 'Riverside' | 'Los Angeles'

export interface ServiceAreaContent {
    city: string
    county: County
    latitude: number
    longitude: number
    /** One-line hero subtitle. */
    blurb: string
    /** 2–4 unique paragraphs. */
    intro: string[]
    permittingDepartment: string
    permittingNotes: string[]
    neighborhoods: string[]
    localFaqs: { question: string; answer: string }[]
    /** Researched local ADU monthly rent range (optional). */
    avgMonthlyRentLow?: number
    avgMonthlyRentHigh?: number
}

/** URL/id slug for a city: "San Dimas" -> "san-dimas". */
export function slugifyCity(city: string): string {
    return city
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
}

/** Document _id for a city's serviceArea (published form). */
export function serviceAreaId(slug: string): string {
    return `serviceArea-${slug}`
}

/** Great-circle distance in miles between two lat/lng points. */
export function milesFromUpland(lat: number, lng: number): number {
    const R = 3958.8
    const toRad = (d: number) => (d * Math.PI) / 180
    const dLat = toRad(lat - business.geo.lat)
    const dLng = toRad(lng - business.geo.lng)
    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(toRad(business.geo.lat)) *
            Math.cos(toRad(lat)) *
            Math.sin(dLng / 2) ** 2
    return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)))
}

function introBlocks(paragraphs: string[]) {
    return paragraphs.map((text, i) => ({
        _type: 'block',
        _key: `intro-${i}`,
        style: 'normal',
        markDefs: [],
        children: [{ _type: 'span', _key: `intro-${i}-s`, text, marks: [] }],
    }))
}

/**
 * Build a Sanity serviceArea document from researched content.
 * `draft` controls the _id prefix (`drafts.` = unpublished, needs review).
 * `nearbySlugs` become real references to other serviceArea docs.
 */
export function buildServiceAreaDoc(
    content: ServiceAreaContent,
    nearbySlugs: string[],
    { draft = true }: { draft?: boolean } = {}
) {
    const slug = slugifyCity(content.city)
    const baseId = serviceAreaId(slug)
    return {
        _id: draft ? `drafts.${baseId}` : baseId,
        _type: 'serviceArea',
        city: content.city,
        slug: { _type: 'slug', current: slug },
        county: content.county,
        latitude: content.latitude,
        longitude: content.longitude,
        distanceFromUplandMi: milesFromUpland(
            content.latitude,
            content.longitude
        ),
        blurb: content.blurb,
        ...(content.avgMonthlyRentLow != null
            ? { avgMonthlyRentLow: content.avgMonthlyRentLow }
            : {}),
        ...(content.avgMonthlyRentHigh != null
            ? { avgMonthlyRentHigh: content.avgMonthlyRentHigh }
            : {}),
        intro: introBlocks(content.intro),
        permittingDepartment: content.permittingDepartment,
        permittingNotes: content.permittingNotes,
        neighborhoods: content.neighborhoods,
        localFaqs: content.localFaqs.map((f, i) => ({
            _type: 'cityFaq',
            _key: `faq-${i}`,
            question: f.question,
            answer: f.answer,
        })),
        nearby: nearbySlugs.map((s, i) => ({
            _type: 'reference',
            _key: `near-${i}`,
            _ref: serviceAreaId(s),
        })),
    }
}
