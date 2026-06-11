// Single source of truth for Backyard Estates' business identity (NAP), service
// area, social profiles, and the facts that feed SEO metadata, JSON-LD schema,
// the footer, and llms.txt. Change a number here and it updates everywhere.
//
// ⚠️  ITEMS MARKED `TODO(real-data)` need the real values before going live.
//     They are placeholders that keep the site fully functional in the meantime.

export const SITE_URL = 'https://www.backyardestates.com'

export const business = {
    name: 'Backyard Estates',
    legalName: 'Backyard Estates',
    // What the company does, in one entity-defining sentence (used in llms.txt,
    // schema description, and default meta description).
    tagline:
        'ADU (accessory dwelling unit) design-build contractor serving the Inland Empire, San Bernardino County, Riverside County, and Los Angeles County.',
    description:
        'Backyard Estates is an ADU (accessory dwelling unit) design-build contractor based in Upland, California. We handle design, plans, permitting, and construction with all-in pricing — serving the Inland Empire, San Bernardino County, Riverside County, and Los Angeles County.',

    // ---- NAP (Name / Address / Phone) — must match Google Business Profile ----
    phone: {
        display: '(909) 500-0917',
        href: 'tel:+19095000917',
    },
    email: 'contact@backyardestates.com',
    address: {
        street: '2335 W Foothill Blvd #18',
        city: 'Upland',
        state: 'CA',
        zip: '91786',
        country: 'US',
    },
    // Upland, CA office. 
    // Google Business Profile (Business Profile → "Edit" → map pin) so the
    // LocalBusiness `geo` and map signals are precise.
    geo: { lat: 34.10738, lng: -117.69707 },

    // Mon–Fri 8AM–5PM
    hours: [
        {
            days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
            opens: '08:00',
            closes: '17:00',
        },
    ],
    hoursDisplay: 'Monday through Friday, 8AM–5PM',

    // Typical all-in ADU price band ($$$$ for a high-ticket builder).
    priceRange: '$$$',

    // CSLB contractor's license. 
    license: 'CL#1076065', // e.g. 'CSLB #1234567'

    foundingYear: 2020,

    // ---- Social / review profiles (schema `sameAs` + footer links) ----

    social: {
        instagram: 'https://www.instagram.com/backyardestates', // e.g. 'https://www.instagram.com/backyardestates'
        facebook: 'https://www.facebook.com/backyardestates', // e.g. 'https://www.facebook.com/backyardestates'
        youtube: 'https://www.youtube.com/@backyardestates', // e.g. 'https://www.youtube.com/@backyardestates'
        googleBusiness: 'https://maps.app.goo.gl/waJuag1k53b3n1ku5', // the Google Business Profile / Maps share link
        yelp: 'https://www.yelp.com/biz/backyard-estates-upland',
    },

    // ---- Real Google review numbers (for AggregateRating schema) ----
    // ⚠️  These MUST be the real, current Google Business Profile numbers.
    //     Fabricated ratings risk a Google manual action. Until filled, schema
    //     omits AggregateRating (see lib/jsonLd.ts).
    rating: {
        value: 4.9,
        count: 26,
    },
} as const

/** Social profile URLs that are actually set — used for schema `sameAs`. */
export function socialUrls(): string[] {
    return Object.values(business.social).filter(Boolean) as string[]
}

/** True only when real Google review numbers are present. */
export function hasRealRating(): boolean {
    return business.rating.value > 0 && business.rating.count > 0
}

// ---------------------------------------------------------------------------
// Service area — every city within ~30 miles of Upland we actively build in.
// `hasProject: true` means we have a real completed build there (drawn from the
// customer-story map) — these get a richer landing page first.
// ---------------------------------------------------------------------------
export type County =
    | 'San Bernardino'
    | 'Riverside'
    | 'Los Angeles'

export interface ServedCity {
    city: string
    county: County
    hasProject?: boolean
}

export const SERVED_CITIES: ServedCity[] = [
    // San Bernardino County
    { city: 'Upland', county: 'San Bernardino', hasProject: true },
    { city: 'Rancho Cucamonga', county: 'San Bernardino', hasProject: true },
    { city: 'Montclair', county: 'San Bernardino', hasProject: true },
    { city: 'Chino', county: 'San Bernardino', hasProject: true },
    { city: 'Chino Hills', county: 'San Bernardino' },
    { city: 'Ontario', county: 'San Bernardino' },
    { city: 'Fontana', county: 'San Bernardino' },
    { city: 'Rialto', county: 'San Bernardino' },
    // Riverside County
    { city: 'Corona', county: 'Riverside', hasProject: true },
    { city: 'Norco', county: 'Riverside', hasProject: true },
    { city: 'Riverside', county: 'Riverside' },
    { city: 'Eastvale', county: 'Riverside' },
    { city: 'Jurupa Valley', county: 'Riverside' },
    { city: 'Moreno Valley', county: 'Riverside' },
    // Los Angeles County
    { city: 'Claremont', county: 'Los Angeles', hasProject: true },
    { city: 'La Verne', county: 'Los Angeles', hasProject: true },
    { city: 'Glendora', county: 'Los Angeles', hasProject: true },
    { city: 'Covina', county: 'Los Angeles', hasProject: true },
    { city: 'West Covina', county: 'Los Angeles', hasProject: true },
    { city: 'Pomona', county: 'Los Angeles', hasProject: true },
    { city: 'Temple City', county: 'Los Angeles', hasProject: true },
    { city: 'Montebello', county: 'Los Angeles', hasProject: true },
]

/** URL slug for a city name: "Rancho Cucamonga" -> "rancho-cucamonga". */
export function citySlug(city: string): string {
    return city
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
}

/** Plain city-name list for schema `areaServed`. */
export const AREA_SERVED: string[] = SERVED_CITIES.map((c) => c.city)

export const COUNTIES_SERVED = [
    'San Bernardino County',
    'Riverside County',
    'Los Angeles County',
] as const

// ADU synonyms — woven into prose and used so LLMs map every term to us.
export const ADU_SYNONYMS = [
    'ADU',
    'accessory dwelling unit',
    'granny flat',
    'in-law suite',
    'casita',
    'guest house',
    'second unit',
    'backyard home',
] as const
