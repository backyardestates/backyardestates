// Typed schema.org JSON-LD builders. All NAP/geo/area data comes from
// lib/business.ts so the structured data always matches what's on the page and
// in the footer. Rendered via <JsonLd> (components/JsonLd).
//
// NOTE: lib/schema.ts is Zod form schemas — unrelated. This is JSON-LD only.
import {
    SITE_URL,
    business,
    socialUrls,
    hasRealRating,
    AREA_SERVED,
    citySlug,
} from '@/lib/business'

type Json = Record<string, unknown>

const ORG_ID = `${SITE_URL}/#organization`
const BUSINESS_ID = `${SITE_URL}/#localbusiness`
const WEBSITE_ID = `${SITE_URL}/#website`
const LOGO_URL = `${SITE_URL}/images/backyard-estates-logo.png`

const postalAddress = (): Json => ({
    '@type': 'PostalAddress',
    streetAddress: business.address.street,
    addressLocality: business.address.city,
    addressRegion: business.address.state,
    postalCode: business.address.zip,
    addressCountry: business.address.country,
})

const aggregateRating = (): Json | undefined =>
    hasRealRating()
        ? {
              '@type': 'AggregateRating',
              ratingValue: business.rating.value,
              reviewCount: business.rating.count,
              bestRating: 5,
              worstRating: 1,
          }
        : undefined

/** Organization — the canonical entity. Injected site-wide. */
export function organizationSchema(): Json {
    return {
        '@type': 'Organization',
        '@id': ORG_ID,
        name: business.name,
        legalName: business.legalName,
        url: SITE_URL,
        logo: LOGO_URL,
        image: `${SITE_URL}/images/backyard-estates-OG.png`,
        description: business.description,
        email: business.email,
        telephone: business.phone.display,
        address: postalAddress(),
        ...(socialUrls().length ? { sameAs: socialUrls() } : {}),
        ...(business.foundingYear
            ? { foundingDate: String(business.foundingYear) }
            : {}),
    }
}

/** LocalBusiness (GeneralContractor). Injected site-wide; emphasize a city per page. */
export function localBusinessSchema(emphasizeCity?: string): Json {
    const cities = emphasizeCity
        ? [emphasizeCity, ...AREA_SERVED.filter((c) => c !== emphasizeCity)]
        : AREA_SERVED
    const rating = aggregateRating()
    return {
        '@type': ['GeneralContractor', 'HomeAndConstructionBusiness'],
        '@id': BUSINESS_ID,
        name: business.name,
        url: SITE_URL,
        logo: LOGO_URL,
        image: `${SITE_URL}/images/backyard-estates-OG.png`,
        description: business.description,
        telephone: business.phone.display,
        email: business.email,
        priceRange: business.priceRange,
        address: postalAddress(),
        geo: {
            '@type': 'GeoCoordinates',
            latitude: business.geo.lat,
            longitude: business.geo.lng,
        },
        areaServed: cities.map((city) => ({
            '@type': 'City',
            name: `${city}, CA`,
        })),
        openingHoursSpecification: business.hours.map((h) => ({
            '@type': 'OpeningHoursSpecification',
            dayOfWeek: h.days,
            opens: h.opens,
            closes: h.closes,
        })),
        parentOrganization: { '@id': ORG_ID },
        ...(socialUrls().length ? { sameAs: socialUrls() } : {}),
        ...(rating ? { aggregateRating: rating } : {}),
        ...(business.license ? { hasCredential: business.license } : {}),
    }
}

/** WebSite node (helps Google show the site name / sitelinks). */
export function websiteSchema(): Json {
    return {
        '@type': 'WebSite',
        '@id': WEBSITE_ID,
        url: SITE_URL,
        name: business.name,
        publisher: { '@id': ORG_ID },
        inLanguage: 'en-US',
    }
}

/** The site-wide @graph injected once in the root layout. */
export function siteGraph(): Json {
    return {
        '@context': 'https://schema.org',
        '@graph': [organizationSchema(), localBusinessSchema(), websiteSchema()],
    }
}

// ---------------------------------------------------------------------------
// Per-page schema
// ---------------------------------------------------------------------------

export interface FloorplanLike {
    name?: string | null
    bed?: number | null
    bath?: number | null
    sqft?: number | null
    price?: number | null
    slug?: string | null
}

/** Product + Offer for an ADU floor plan. */
export function productSchema(fp: FloorplanLike, image?: string): Json {
    const url = fp.slug ? `${SITE_URL}/floorplans/${fp.slug}` : SITE_URL
    const props: Json[] = []
    if (fp.sqft) props.push({ '@type': 'PropertyValue', name: 'Square footage', value: fp.sqft, unitCode: 'FTK' })
    if (fp.bed) props.push({ '@type': 'PropertyValue', name: 'Bedrooms', value: fp.bed })
    if (fp.bath) props.push({ '@type': 'PropertyValue', name: 'Bathrooms', value: fp.bath })
    return {
        '@context': 'https://schema.org',
        '@type': 'Product',
        name: `${fp.name} ADU`,
        description: `The ${fp.name} accessory dwelling unit (ADU) by Backyard Estates, with all-in pricing.`,
        category: 'Accessory Dwelling Unit',
        url,
        ...(image ? { image } : {}),
        brand: { '@type': 'Brand', name: business.name },
        ...(props.length ? { additionalProperty: props } : {}),
        ...(fp.price
            ? {
                  offers: {
                      '@type': 'Offer',
                      price: fp.price,
                      priceCurrency: 'USD',
                      availability: 'https://schema.org/InStock',
                      seller: { '@id': ORG_ID },
                      url,
                  },
              }
            : {}),
    }
}

export interface ReviewLike {
    names?: string | null
    quote?: string | null
    city?: string | null
    floorplan?: string | null
    slug?: string | null
}

/** A single Review (no star rating — quotes only — unless real data exists). */
export function reviewSchema(r: ReviewLike): Json | null {
    if (!r.quote || !r.names) return null
    return {
        '@context': 'https://schema.org',
        '@type': 'Review',
        reviewBody: r.quote,
        author: { '@type': 'Person', name: r.names },
        itemReviewed: { '@id': BUSINESS_ID },
        ...(r.city ? { locationCreated: { '@type': 'Place', name: `${r.city}, CA` } } : {}),
    }
}

/** Multiple reviews as an array (drops incomplete entries). */
export function reviewSchemas(reviews: ReviewLike[]): Json[] {
    return reviews.map(reviewSchema).filter((x): x is Json => x !== null)
}

export interface ArticleLike {
    title?: string | null
    slug?: string | null
    category?: string | null
    image?: string | null
    updatedAt?: string | null
    publishedAt?: string | null
}

/** BlogPosting for a blog article. */
export function articleSchema(a: ArticleLike): Json {
    const url =
        a.category && a.slug
            ? `${SITE_URL}/blog/${a.category}/${a.slug}`
            : SITE_URL
    return {
        '@context': 'https://schema.org',
        '@type': 'BlogPosting',
        headline: a.title ?? '',
        ...(a.image ? { image: a.image } : {}),
        ...(a.publishedAt ? { datePublished: a.publishedAt } : {}),
        ...(a.updatedAt ? { dateModified: a.updatedAt } : {}),
        author: { '@id': ORG_ID },
        publisher: { '@id': ORG_ID },
        mainEntityOfPage: { '@type': 'WebPage', '@id': url },
        url,
    }
}

export interface BreadcrumbItem {
    name: string
    href: string
}

/** BreadcrumbList from a [{name, href}] trail. */
export function breadcrumbSchema(items: BreadcrumbItem[]): Json {
    return {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: items.map((it, i) => ({
            '@type': 'ListItem',
            position: i + 1,
            name: it.name,
            item: it.href.startsWith('http') ? it.href : `${SITE_URL}${it.href}`,
        })),
    }
}

export interface FaqItem {
    question: string
    answer: string
}

/** FAQPage from [{question, answer}]. */
export function faqSchema(faqs: FaqItem[]): Json {
    return {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: faqs.map((f) => ({
            '@type': 'Question',
            name: f.question,
            acceptedAnswer: { '@type': 'Answer', text: f.answer },
        })),
    }
}

export interface VideoLike {
    name: string
    description?: string
    wistiaId?: string | null
    thumbnailUrl?: string
    uploadDate?: string
}

/** VideoObject for an embedded Wistia testimonial/walkthrough. */
export function videoObjectSchema(v: VideoLike): Json | null {
    if (!v.wistiaId) return null
    return {
        '@context': 'https://schema.org',
        '@type': 'VideoObject',
        name: v.name,
        description: v.description ?? v.name,
        thumbnailUrl: v.thumbnailUrl ?? `https://embed-ssl.wistia.com/deliveries/${v.wistiaId}.jpg`,
        embedUrl: `https://fast.wistia.net/embed/iframe/${v.wistiaId}`,
        ...(v.uploadDate ? { uploadDate: v.uploadDate } : {}),
        publisher: { '@id': ORG_ID },
    }
}

/** Helper: city page URL for a served city. */
export function cityUrl(city: string): string {
    return `${SITE_URL}/adu-builder/${citySlug(city)}`
}
