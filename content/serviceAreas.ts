// ⚠️ SUPERSEDED BY SANITY. The live /adu-builder pages now read the `serviceArea`
// document type from Sanity (managed in the Studio). This file remains only as
// the source for the one-time migration (scripts/seedServiceAreas.ts) and as a
// backup of the originally-drafted copy. Editing it no longer changes the site.
//
// Service-area landing pages: one genuinely-unique page per city we build in,
// served at /adu-builder/[slug]. This drives the biggest local-SEO lever, so
// every entry must be REAL and DISTINCT (Google penalizes templated "doorway"
// pages). Copy here is drafted starter content — the Backyard Estates team
// should fact-check each `permitting` block and `intro` against current city
// rules before relying on it.
//
// Permitting notes intentionally lean on California's STATEWIDE ADU law (which
// applies in every city below) plus the correct local planning counter, rather
// than city-specific setback/fee numbers that change often. Add verified local
// specifics over time.
import { citySlug } from '@/lib/business'

export type County = 'San Bernardino' | 'Riverside' | 'Los Angeles'

export interface CityFaq {
    question: string
    answer: string
}

export interface ServiceArea {
    /** URL slug — derived from city, but stored so it's stable. */
    slug: string
    city: string
    county: County
    /** ~34.x, -117.x — used for the LocalBusiness geo emphasis. */
    geo: { lat: number; lng: number }
    distanceFromUplandMi: number
    /** One-line meta/hero summary. */
    blurb: string
    /** 250–400 words of UNIQUE, city-specific prose. */
    intro: string[]
    /** Why ADUs are in demand specifically here. */
    intent: string
    permitting: {
        department: string
        notes: string[]
    }
    neighborhoods: string[]
    localFaqs: CityFaq[]
    /** Slugs of nearby city pages for cross-linking. */
    nearby: string[]
}

// Shared, statewide-accurate ADU permitting facts (apply in every CA city).
const CA_STATE_ADU_FACTS = [
    'California law requires cities to approve a complete ADU application ministerially (no public hearing) within 60 days.',
    'Detached ADUs up to 800 sq ft with 4-foot side and rear setbacks must be allowed by right, and most lots qualify for an ADU up to 1,200 sq ft.',
    'No additional off-street parking can be required when the property is within half a mile of public transit.',
    'Owner-occupancy cannot be required for ADUs permitted through the end of 2025, making an ADU a true rental-income option.',
]

export const SERVICE_AREAS: ServiceArea[] = [
    {
        slug: citySlug('Upland'),
        city: 'Upland',
        county: 'San Bernardino',
        geo: { lat: 34.0975, lng: -117.6484 },
        distanceFromUplandMi: 0,
        blurb:
            'ADU builder headquartered in Upland — design, permits, and construction handled in-house.',
        intro: [
            'Backyard Estates is based in Upland, and it is the city we know best. Our office sits on West Foothill Boulevard, minutes from the established neighborhoods north of the 210 and the larger lots toward San Antonio Heights. We have walked more Upland backyards than anyone, pulled permits through the Upland Planning Division, and built completed ADUs you can drive past today.',
            'Upland’s mix of generous lot sizes, mature trees, and strong rental demand from nearby Claremont Colleges and Cal Poly Pomona makes it one of the best ADU markets in the Inland Empire. Whether you want a detached unit for aging parents, a rental on a deep R-1 lot, or a junior ADU carved from an existing footprint, we design to your property and your goals.',
            'Because Upland is home, our team can meet you on-site quickly, navigate the city’s review process firsthand, and keep the build close to the people managing it. That proximity is part of why local homeowners consistently describe the experience as smooth and stress-free.',
        ],
        intent:
            'Large R-1 lots, strong rental demand from nearby colleges, and many multigenerational families.',
        permitting: {
            department: 'City of Upland Planning Division',
            notes: CA_STATE_ADU_FACTS,
        },
        neighborhoods: ['San Antonio Heights', 'Upland Hills', 'Historic Downtown Upland', 'North Upland'],
        localFaqs: [
            {
                question: 'How much does it cost to build an ADU in Upland, CA?',
                answer:
                    'Backyard Estates builds ADUs in Upland with all-in pricing that covers design, plans, permits, site work, and construction. Your exact number depends on your lot and the floor plan you choose; the precise price is confirmed during a Formal Property Analysis, which is fully credited toward your build.',
            },
            {
                question: 'Where do I get an ADU permit in Upland?',
                answer:
                    'ADU permits are handled by the City of Upland Planning Division. Backyard Estates manages the entire permitting process for you, including plan submittal and the city’s 60-day ministerial review.',
            },
            {
                question: 'Can I rent out an ADU in Upland?',
                answer:
                    'Yes. Under current California law, ADUs permitted through the end of 2025 cannot carry an owner-occupancy requirement, so an Upland ADU can be used as a long-term rental for added income.',
            },
        ],
        nearby: [citySlug('Rancho Cucamonga'), citySlug('Montclair'), citySlug('Claremont')],
    },
    {
        slug: citySlug('Rancho Cucamonga'),
        city: 'Rancho Cucamonga',
        county: 'San Bernardino',
        geo: { lat: 34.1064, lng: -117.5931 },
        distanceFromUplandMi: 4,
        blurb:
            'Custom ADUs in Rancho Cucamonga — from Alta Loma’s big lots to Victoria Gardens-area neighborhoods.',
        intro: [
            'Rancho Cucamonga is one of our most active markets, and for good reason. The deep lots of Alta Loma and Etiwanda were practically made for a detached ADU, and the city’s strong schools and proximity to employment keep rental demand high year-round. We have completed builds here that families now use for everything from a downstairs suite for grandparents to a fully independent rental.',
            'The terrain in north Rancho Cucamonga can add wrinkles — sloped lots, equestrian overlays in parts of Alta Loma, and established landscaping worth protecting. That is exactly the kind of thing we map out during your property analysis so the placement and foundation are right the first time. Closer to Foothill and Victoria Gardens, tighter lots often favor a smartly-placed compact plan that still lives large.',
            'Being just minutes from our Upland office means we are on-site fast and stay close to your project from permit to final walkthrough.',
        ],
        intent:
            'Deep Alta Loma/Etiwanda lots, top-rated schools, and steady rental demand near major employers.',
        permitting: {
            department: 'City of Rancho Cucamonga Planning Department',
            notes: CA_STATE_ADU_FACTS,
        },
        neighborhoods: ['Alta Loma', 'Etiwanda', 'Victoria', 'Terra Vista'],
        localFaqs: [
            {
                question: 'Are ADUs allowed on Alta Loma equestrian lots?',
                answer:
                    'In most cases, yes. California’s statewide ADU rules apply across Rancho Cucamonga, and large Alta Loma lots are often ideal for a detached ADU. We confirm any overlay or setback specifics for your exact parcel during the Formal Property Analysis.',
            },
            {
                question: 'How long does an ADU take to build in Rancho Cucamonga?',
                answer:
                    'After permitting, most Backyard Estates ADUs are built in a matter of months. We give you a week-by-week construction timeline up front so you always know what is happening next.',
            },
            {
                question: 'Who issues ADU permits in Rancho Cucamonga?',
                answer:
                    'The City of Rancho Cucamonga Planning Department reviews ADU applications. Backyard Estates prepares and manages the full submittal on your behalf.',
            },
        ],
        nearby: [citySlug('Upland'), citySlug('Montclair'), citySlug('Fontana')],
    },
    {
        slug: citySlug('Claremont'),
        city: 'Claremont',
        county: 'Los Angeles',
        geo: { lat: 34.0967, lng: -117.7198 },
        distanceFromUplandMi: 3,
        blurb:
            'ADUs in Claremont built to respect the City of Trees — and the Claremont Colleges rental market.',
        intro: [
            'Claremont is one of the strongest ADU markets we serve, and one of the most rewarding to build in. With the seven Claremont Colleges, the rental demand for a well-built backyard home is consistent and premium. We have completed multiple ADUs across Claremont — more than in almost any other city — and homeowners here repeatedly tell us they felt supported through every step, including the city’s more design-conscious review.',
            '“The City of Trees” takes its character seriously, from the historic Village to the tree-lined streets north of Foothill. That means thoughtful placement, mature-landscape protection, and plans that fit the neighborhood rather than fight it. Our architects design to that context so your ADU adds value without friction.',
            'Just three miles from our Upland office, Claremont projects get fast site visits and close attention from start to finish.',
        ],
        intent:
            'Premium rental demand from the Claremont Colleges and many homeowners building for family or income.',
        permitting: {
            department: 'City of Claremont Community Development Department',
            notes: CA_STATE_ADU_FACTS,
        },
        neighborhoods: ['The Claremont Village', 'North Claremont', 'Claraboya', 'Padua Hills'],
        localFaqs: [
            {
                question: 'Is it harder to build an ADU in Claremont?',
                answer:
                    'Claremont takes neighborhood character seriously, but California’s statewide ADU law still applies, and ministerial approval is required for qualifying projects. Backyard Estates has completed many Claremont ADUs and handles the city process for you end to end.',
            },
            {
                question: 'Can I build an ADU to rent to Claremont Colleges students or staff?',
                answer:
                    'Yes. An ADU is a popular way for Claremont homeowners to earn rental income given the steady demand from the colleges, and current law does not require you to live on-site for ADUs permitted through 2025.',
            },
            {
                question: 'Where are ADU permits handled in Claremont?',
                answer:
                    'The City of Claremont Community Development Department reviews ADU applications. We prepare the plans and manage submittal and review on your behalf.',
            },
        ],
        nearby: [citySlug('Upland'), citySlug('La Verne'), citySlug('Pomona')],
    },
    {
        slug: citySlug('Montclair'),
        city: 'Montclair',
        county: 'San Bernardino',
        geo: { lat: 34.0775, lng: -117.6897 },
        distanceFromUplandMi: 3,
        blurb:
            'Affordable, high-value ADUs in Montclair — a smart way to add income or family space.',
        intro: [
            'Montclair sits right between Upland and the LA County line, and its practical, well-sized lots make it a great value for an ADU. Homeowners here are often building to bring family closer — a son near his mother, a multigenerational household under one property — exactly the kind of project our Montclair customers have loved.',
            'With easy access to the 10 and the Montclair Transit Center, an ADU here is attractive both for family living and as a rental, since transit proximity can remove added parking requirements. We design compact, efficient plans that make the most of Montclair’s lots without overbuilding.',
            'Three miles from our office, Montclair projects get quick, hands-on attention.',
        ],
        intent:
            'Great lot value, transit access, and strong multigenerational-family demand.',
        permitting: {
            department: 'City of Montclair Planning Division',
            notes: CA_STATE_ADU_FACTS,
        },
        neighborhoods: ['North Montclair', 'Montclair Place area', 'Mission Boulevard corridor'],
        localFaqs: [
            {
                question: 'Is an ADU a good investment in Montclair?',
                answer:
                    'Montclair’s lot values and transit access make ADUs an efficient way to add rental income or multigenerational living space. Backyard Estates builds with all-in pricing so you know your total cost before you start.',
            },
            {
                question: 'Do I need extra parking for an ADU in Montclair?',
                answer:
                    'Not if your property is within half a mile of public transit, such as the Montclair Transit Center — California law removes the added-parking requirement in that case. We confirm this for your parcel during your analysis.',
            },
            {
                question: 'Who approves ADUs in Montclair?',
                answer:
                    'The City of Montclair Planning Division handles ADU review. Backyard Estates manages the entire permitting process for you.',
            },
        ],
        nearby: [citySlug('Upland'), citySlug('Chino'), citySlug('Pomona')],
    },
    {
        slug: citySlug('Chino'),
        city: 'Chino',
        county: 'San Bernardino',
        geo: { lat: 34.0122, lng: -117.6889 },
        distanceFromUplandMi: 8,
        blurb:
            'ADUs in Chino — from large semi-rural lots to newer family neighborhoods.',
        intro: [
            'Chino offers some of the most generous lots in our service area, including semi-rural parcels where a detached ADU has plenty of room to breathe. We have built here for families creating comfortable multigenerational space — room for a daughter, grandchildren, and future needs — on properties with the space to do it well.',
            'The contrast across Chino is real: established large lots toward the agricultural preserve, and tighter newer subdivisions near The Preserve and Chino Hills. Each calls for a different approach, and we tailor placement, size, and foundation to the parcel. Larger lots can often support our bigger floor plans, giving you a genuinely independent second home.',
            'From our Upland office, Chino is a short drive, so site visits and oversight stay easy.',
        ],
        intent:
            'Large lots and growing multigenerational households wanting room for extended family.',
        permitting: {
            department: 'City of Chino Development Services / Planning Division',
            notes: CA_STATE_ADU_FACTS,
        },
        neighborhoods: ['The Preserve', 'Los Serranos', 'College Park', 'Central Chino'],
        localFaqs: [
            {
                question: 'How big of an ADU can I build in Chino?',
                answer:
                    'Many Chino lots are large enough to support a sizable detached ADU. Under state law most lots allow up to 1,200 sq ft; your specific maximum is confirmed during the Formal Property Analysis.',
            },
            {
                question: 'Can I build an ADU for my parents or adult children in Chino?',
                answer:
                    'Absolutely — multigenerational living is one of the most common reasons Chino homeowners build with us. We design for privacy and independence while keeping family close.',
            },
            {
                question: 'Who handles ADU permits in Chino?',
                answer:
                    'The City of Chino Development Services Department reviews ADU applications. Backyard Estates prepares and manages the submittal for you.',
            },
        ],
        nearby: [citySlug('Montclair'), citySlug('Pomona'), citySlug('Corona')],
    },
    {
        slug: citySlug('Glendora'),
        city: 'Glendora',
        county: 'Los Angeles',
        geo: { lat: 34.1361, lng: -117.865 },
        distanceFromUplandMi: 10,
        blurb:
            'ADUs in Glendora — building thoughtfully into the foothills and the “Pride of the Foothills.”',
        intro: [
            'Glendora’s foothill setting makes for beautiful properties and a few real engineering considerations. The lots climbing toward the San Gabriels north of Sierra Madre Avenue can mean slope, views, and grading questions worth getting right — and that is precisely where our up-front property analysis pays off. One Glendora homeowner called his build the most pleasant experience he’d ever had constructing a structure, and getting the foundation strategy right on a hillside lot is a big part of why.',
            'Closer to the Glendora Village and the flatter south side, projects are more straightforward and a great fit for a rental or a family suite. Either way, we design to the lot rather than forcing a template onto it.',
            'Glendora is an easy reach from our Upland office, so we stay close to your project throughout.',
        ],
        intent:
            'Desirable foothill neighborhoods, strong home values, and homeowners adding long-term family space.',
        permitting: {
            department: 'City of Glendora Planning Division',
            notes: CA_STATE_ADU_FACTS,
        },
        neighborhoods: ['Glendora Village', 'North Glendora', 'Gordon Highlands', 'South Glendora'],
        localFaqs: [
            {
                question: 'Can I build an ADU on a sloped or hillside lot in Glendora?',
                answer:
                    'Often, yes. Hillside lots take extra planning for grading and foundations, which is exactly what our Formal Property Analysis is designed to resolve before construction starts.',
            },
            {
                question: 'How much does an ADU cost in Glendora, CA?',
                answer:
                    'Backyard Estates uses all-in pricing covering design, permits, and construction. Foothill lots can add site work, so your exact figure is confirmed on-site during your property analysis, fully credited toward the build.',
            },
            {
                question: 'Who approves ADUs in Glendora?',
                answer:
                    'The City of Glendora Planning Division reviews ADU applications, and Backyard Estates manages the process for you.',
            },
        ],
        nearby: [citySlug('La Verne'), citySlug('Covina'), citySlug('Claremont')],
    },
    {
        slug: citySlug('La Verne'),
        city: 'La Verne',
        county: 'Los Angeles',
        geo: { lat: 34.1008, lng: -117.7678 },
        distanceFromUplandMi: 6,
        blurb:
            'ADUs in La Verne — established neighborhoods, University of La Verne demand, and room for family.',
        intro: [
            'La Verne blends old-town charm with steady rental demand from the University of La Verne, which makes it a natural fit for a backyard home. We have built here for families creating shared space to raise children together and for homeowners who simply wanted more flexibility on a well-loved property.',
            'North of Foothill, the lots get larger and lend themselves to a fully detached ADU; closer to the historic downtown and the university, smart compact plans shine. Our designs respect the established character of La Verne’s neighborhoods while adding real, usable space.',
            'Six miles from our Upland office, La Verne is close enough for fast site visits and steady oversight.',
        ],
        intent:
            'University rental demand plus established family neighborhoods building for the next generation.',
        permitting: {
            department: 'City of La Verne Community Development Department',
            notes: CA_STATE_ADU_FACTS,
        },
        neighborhoods: ['Old Town La Verne', 'North La Verne', 'Live Oak', 'Marshall Canyon area'],
        localFaqs: [
            {
                question: 'Can I rent an ADU to University of La Verne students?',
                answer:
                    'Yes. La Verne’s university creates steady rental demand, and current state law does not require owner-occupancy for ADUs permitted through 2025, so a La Verne ADU works well as a rental.',
            },
            {
                question: 'Can two families share one property with an ADU in La Verne?',
                answer:
                    'Many of our La Verne homeowners build exactly for that — a separate, private home on the same lot so families can stay close. We design for independence and privacy on both sides.',
            },
            {
                question: 'Who issues ADU permits in La Verne?',
                answer:
                    'The City of La Verne Community Development Department reviews ADU applications; Backyard Estates handles the submittal and review for you.',
            },
        ],
        nearby: [citySlug('Claremont'), citySlug('Glendora'), citySlug('Pomona')],
    },
    {
        slug: citySlug('Covina'),
        city: 'Covina',
        county: 'Los Angeles',
        geo: { lat: 34.0901, lng: -117.8903 },
        distanceFromUplandMi: 12,
        blurb:
            'ADUs in Covina — reliable, on-time builds for one of the San Gabriel Valley’s steady markets.',
        intro: [
            'Covina homeowners tend to value exactly what we do best: a reliable, transparent process that finishes on time and on budget. One Covina family told us we were on time, stuck to the price, and made the whole thing seamless — that is the standard we hold across the San Gabriel Valley.',
            'Covina’s mix of mid-century neighborhoods and walkable downtown means a range of lot sizes, from comfortable R-1 parcels north of the 10 to tighter lots near the Metrolink station. Transit proximity near the station can remove added-parking requirements, which helps for rentals. We size and place each ADU to the specific lot.',
            'Covina is a straightforward drive from our Upland office, and we keep your project close from permit to move-in.',
        ],
        intent:
            'Steady San Gabriel Valley demand, Metrolink access, and homeowners wanting a dependable build.',
        permitting: {
            department: 'City of Covina Community Development Department',
            notes: CA_STATE_ADU_FACTS,
        },
        neighborhoods: ['Downtown Covina', 'North Covina', 'Charter Oak area', 'South Covina'],
        localFaqs: [
            {
                question: 'Will my ADU in Covina finish on time and on budget?',
                answer:
                    'That is exactly what Backyard Estates is known for. We use all-in pricing and give you a week-by-week timeline, and Covina homeowners specifically praise our on-time, on-budget delivery.',
            },
            {
                question: 'Do I need extra parking for a Covina ADU?',
                answer:
                    'If your property is within half a mile of transit such as the Covina Metrolink station, California law removes the added-parking requirement. We confirm this for your parcel.',
            },
            {
                question: 'Who approves ADUs in Covina?',
                answer:
                    'The City of Covina Community Development Department handles ADU review, and we manage the full process on your behalf.',
            },
        ],
        nearby: [citySlug('West Covina'), citySlug('Glendora'), citySlug('La Verne')],
    },
    {
        slug: citySlug('West Covina'),
        city: 'West Covina',
        county: 'Los Angeles',
        geo: { lat: 34.0686, lng: -117.9389 },
        distanceFromUplandMi: 15,
        blurb:
            'ADUs in West Covina — beautifully designed second homes for families and young couples.',
        intro: [
            'West Covina is a city of established, family-oriented neighborhoods, and ADUs here are often about giving the next generation a foothold — a young couple starting out with independence while staying close to family. That is exactly the kind of project our West Covina homeowners have built and loved.',
            'The hilly south side around South Hills and the flatter neighborhoods near the 10 offer different building conditions, and we tailor each design accordingly. With strong home values across the city, a well-built ADU adds meaningful long-term value alongside the immediate benefit of more space.',
            'Though a bit farther west, West Covina is an easy freeway run from our Upland office, and we keep every project closely managed.',
        ],
        intent:
            'Family neighborhoods building for adult children, plus strong home values that reward added space.',
        permitting: {
            department: 'City of West Covina Planning Division',
            notes: CA_STATE_ADU_FACTS,
        },
        neighborhoods: ['South Hills', 'Woodside Village', 'Merced/Cameron area', 'BKK area'],
        localFaqs: [
            {
                question: 'Can I build an ADU for my adult kids in West Covina?',
                answer:
                    'Yes — it is one of the most common reasons West Covina homeowners build with us. An ADU gives adult children their own private home while keeping family close on the same lot.',
            },
            {
                question: 'Does an ADU add value to a West Covina home?',
                answer:
                    'A permitted, well-built ADU adds both livable space and resale value. Combined with rental potential, it is one of the highest-return improvements you can make to a West Covina property.',
            },
            {
                question: 'Who issues ADU permits in West Covina?',
                answer:
                    'The City of West Covina Planning Division reviews ADU applications, and Backyard Estates manages the submittal for you.',
            },
        ],
        nearby: [citySlug('Covina'), citySlug('Pomona'), citySlug('Montebello')],
    },
    {
        slug: citySlug('Pomona'),
        city: 'Pomona',
        county: 'Los Angeles',
        geo: { lat: 34.0551, lng: -117.7522 },
        distanceFromUplandMi: 5,
        blurb:
            'ADUs in Pomona — single-story comfort for aging parents and smart rental income near Cal Poly.',
        intro: [
            'Pomona pairs strong rental demand — driven by Cal Poly Pomona and Western University — with a wide range of established neighborhoods, making it one of the most versatile ADU markets we serve. We have built here for families creating a safe, single-story home for aging parents while also adding future rental income, and the process felt, in one homeowner’s words, smooth with no stress whatsoever.',
            'From the historic homes of Lincoln Park to the larger lots in the north and the neighborhoods near the colleges, Pomona offers real flexibility on size and placement. Single-story, accessible designs are especially popular here for multigenerational living, and we design them for genuine independence.',
            'At just five miles from our Upland office, Pomona projects get fast, attentive service.',
        ],
        intent:
            'College-driven rental demand and many families building accessible homes for aging parents.',
        permitting: {
            department: 'City of Pomona Planning Division',
            notes: CA_STATE_ADU_FACTS,
        },
        neighborhoods: ['Lincoln Park', 'Ganesha Hills', 'Phillips Ranch', 'Westmont'],
        localFaqs: [
            {
                question: 'Can I build a single-story ADU for aging parents in Pomona?',
                answer:
                    'Yes — accessible, single-story ADUs are one of the most popular builds we do in Pomona, giving aging parents a private, safe home while staying close to family.',
            },
            {
                question: 'Is an ADU good for rental income near Cal Poly Pomona?',
                answer:
                    'Very much so. Demand from Cal Poly Pomona and Western University supports steady rental interest, and current law does not require owner-occupancy for ADUs permitted through 2025.',
            },
            {
                question: 'Who approves ADUs in Pomona?',
                answer:
                    'The City of Pomona Planning Division reviews ADU applications, and Backyard Estates handles the entire process for you.',
            },
        ],
        nearby: [citySlug('Claremont'), citySlug('Montclair'), citySlug('Chino')],
    },
    {
        slug: citySlug('Corona'),
        city: 'Corona',
        county: 'Riverside',
        geo: { lat: 33.8753, lng: -117.5664 },
        distanceFromUplandMi: 18,
        blurb:
            'ADUs in Corona — Riverside County builds for growing families who want to stay close.',
        intro: [
            'Corona is our anchor in Riverside County, and the demand here is strong: growing families who want a safe, independent home on the same property so they can support one another. One Corona family told us that if they had to start the whole process over, they would still choose Backyard Estates — the kind of trust we work to earn on every Riverside County build.',
            'Corona’s newer master-planned communities and its older neighborhoods near downtown call for different approaches, and Riverside County / City of Corona review has its own rhythm. Because we have already built and permitted here, we know how to keep a Corona project moving. Larger lots in areas like Sierra Del Oro and South Corona often support a full detached ADU.',
            'Corona is a straightforward freeway run from Upland, and we manage the distance with clear timelines and steady communication.',
        ],
        intent:
            'Fast-growing families wanting independent on-site homes, with lots large enough for detached ADUs.',
        permitting: {
            department: 'City of Corona Planning & Development Department',
            notes: CA_STATE_ADU_FACTS,
        },
        neighborhoods: ['Sierra Del Oro', 'South Corona', 'Corona Hills', 'Downtown Corona'],
        localFaqs: [
            {
                question: 'Do you build ADUs in Corona and Riverside County?',
                answer:
                    'Yes. Corona is one of our active Riverside County markets, and we have completed builds here. We handle the City of Corona permitting process for you from start to finish.',
            },
            {
                question: 'How big of an ADU can I build in Corona?',
                answer:
                    'Many Corona lots support a full detached ADU. State law allows up to 1,200 sq ft on most lots; your exact maximum is confirmed during the Formal Property Analysis.',
            },
            {
                question: 'Who issues ADU permits in Corona?',
                answer:
                    'The City of Corona Planning & Development Department reviews ADU applications, and Backyard Estates manages the submittal on your behalf.',
            },
        ],
        nearby: [citySlug('Norco'), citySlug('Chino'), citySlug('Riverside')],
    },
    {
        slug: citySlug('Norco'),
        city: 'Norco',
        county: 'Riverside',
        geo: { lat: 33.9311, lng: -117.5486 },
        distanceFromUplandMi: 16,
        blurb:
            'ADUs in Norco — large equestrian-friendly lots built with care in “Horsetown USA.”',
        intro: [
            'Norco is unlike anywhere else we build. “Horsetown USA” keeps its rural, equestrian character on purpose, with large lots, horse trails, and animal-keeping that homeowners want to preserve. That is a feature, not an obstacle — those big lots are excellent for a detached ADU, and we design placement that respects corrals, trails, and existing outbuildings.',
            'One Norco family built so their children could afford to stay close, and they pointed to the care that went into the work — everyone truly cared about what they were doing. On rural Norco parcels, getting septic, setbacks, and access right matters, and that is exactly what our up-front analysis handles.',
            'Norco is an easy reach from Upland, and we keep the build closely managed despite the rural setting.',
        ],
        intent:
            'Large equestrian lots ideal for detached ADUs, and families building so kids can stay in town.',
        permitting: {
            department: 'City of Norco Planning Division',
            notes: CA_STATE_ADU_FACTS,
        },
        neighborhoods: ['North Norco', 'Norco Hills', 'Downtown Norco'],
        localFaqs: [
            {
                question: 'Can I build an ADU on an equestrian lot in Norco?',
                answer:
                    'Yes — Norco’s large lots are often ideal for a detached ADU. We design placement around corrals, trails, and outbuildings, and confirm septic and setback specifics during your property analysis.',
            },
            {
                question: 'Do Norco ADUs work on septic systems?',
                answer:
                    'Many do. Septic capacity and location are part of what we verify on-site before construction so the design works with your existing system.',
            },
            {
                question: 'Who approves ADUs in Norco?',
                answer:
                    'The City of Norco Planning Division reviews ADU applications, and Backyard Estates handles the entire permitting process for you.',
            },
        ],
        nearby: [citySlug('Corona'), citySlug('Riverside'), citySlug('Chino')],
    },
    {
        slug: citySlug('Temple City'),
        city: 'Temple City',
        county: 'Los Angeles',
        geo: { lat: 34.1072, lng: -118.0578 },
        distanceFromUplandMi: 20,
        blurb:
            'ADUs in Temple City — proactive retirement and rental income in the heart of the San Gabriel Valley.',
        intro: [
            'Temple City homeowners are often thinking ahead, and an ADU is a smart, proactive move — one local couple built theirs specifically to strengthen their retirement, and told us everything just fell into place. The city’s tree-lined, tidy neighborhoods and strong San Gabriel Valley rental demand make a backyard home both livable and financially sound.',
            'Lots in Temple City tend toward the classic, comfortable R-1 size, which suits a thoughtfully placed detached ADU or a junior unit. Strong schools and central location keep rental interest high, and we design plans that fit the neighborhood’s neat, well-kept character.',
            'Temple City is a bit farther west, but a quick freeway run from Upland, and we keep every project closely managed.',
        ],
        intent:
            'Homeowners building for retirement income, with strong SGV rental demand and steady lot sizes.',
        permitting: {
            department: 'City of Temple City Community Development Department',
            notes: CA_STATE_ADU_FACTS,
        },
        neighborhoods: ['Central Temple City', 'Temple City Gateway', 'Camellia area'],
        localFaqs: [
            {
                question: 'Is an ADU a good retirement strategy in Temple City?',
                answer:
                    'Many Temple City homeowners build with us specifically for retirement — an ADU can generate rental income or house family, and all-in pricing makes the investment predictable.',
            },
            {
                question: 'How much rent can an ADU earn in Temple City?',
                answer:
                    'Rents depend on size and finish, but San Gabriel Valley demand is strong. We can walk through realistic numbers for your plan during your free office visit.',
            },
            {
                question: 'Who issues ADU permits in Temple City?',
                answer:
                    'The City of Temple City Community Development Department reviews ADU applications, and Backyard Estates manages the process for you.',
            },
        ],
        nearby: [citySlug('Covina'), citySlug('West Covina'), citySlug('Montebello')],
    },
    {
        slug: citySlug('Montebello'),
        city: 'Montebello',
        county: 'Los Angeles',
        geo: { lat: 34.0095, lng: -118.1137 },
        distanceFromUplandMi: 28,
        blurb:
            'ADUs in Montebello — peace of mind and real financial relief, built by a team you can trust.',
        intro: [
            'Montebello is the western edge of our service area, and the homeowners we have built for here value trust above all — one Montebello homeowner said the best part was being able to sleep well at night, knowing he chose the right team. On larger projects that deliver real financial relief, that confidence is everything.',
            'Montebello’s established neighborhoods and hillside areas near the golf course offer a range of lot conditions, and its dense, central LA County location keeps rental demand strong. We design ADUs that fit older neighborhoods gracefully while adding genuinely independent living space.',
            'Montebello is farther from our Upland base, so we lean on clear timelines and steady communication to keep the build feeling close and well-managed.',
        ],
        intent:
            'Central LA County rental demand and homeowners seeking trustworthy, life-changing builds.',
        permitting: {
            department: 'City of Montebello Planning Division',
            notes: CA_STATE_ADU_FACTS,
        },
        neighborhoods: ['Montebello Hills', 'Central Montebello', 'Bella Vista'],
        localFaqs: [
            {
                question: 'Can an ADU help with my finances in Montebello?',
                answer:
                    'Yes — many Montebello homeowners build for rental income or to consolidate family living costs. We use all-in pricing so the financial picture is clear before you commit.',
            },
            {
                question: 'Do you build in Montebello even though it is farther from Upland?',
                answer:
                    'Yes. Montebello is within our service area, and we manage the distance with clear week-by-week timelines and consistent communication throughout the build.',
            },
            {
                question: 'Who approves ADUs in Montebello?',
                answer:
                    'The City of Montebello Planning Division reviews ADU applications, and Backyard Estates handles the full permitting process for you.',
            },
        ],
        nearby: [citySlug('West Covina'), citySlug('Temple City'), citySlug('Covina')],
    },
]

export const SERVICE_AREA_SLUGS = SERVICE_AREAS.map((a) => a.slug)

export function getServiceArea(slug: string): ServiceArea | undefined {
    return SERVICE_AREAS.find((a) => a.slug === slug)
}
