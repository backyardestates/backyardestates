import type { MetadataRoute } from 'next'
import { client } from '@/sanity/client'
import { SITE_URL } from '@/lib/business'
import {
    SITEMAP_FLOORPLANS_QUERY,
    SITEMAP_PROPERTIES_QUERY,
    SITEMAP_STORIES_QUERY,
    SITEMAP_POSTS_QUERY,
    SITEMAP_OPEN_HOUSES_QUERY,
    SERVICE_AREAS_QUERY,
} from '@/sanity/queries'

const options = { next: { revalidate: 3600 } }

type SlugRow = { slug: string; _updatedAt?: string; category?: string }

const abs = (path: string) => `${SITE_URL}${path}`

// Static, indexable marketing routes (tool/booking/legal-noindex pages excluded).
const STATIC_ROUTES: Array<{
    path: string
    priority: number
    changeFrequency: MetadataRoute.Sitemap[number]['changeFrequency']
}> = [
    { path: '/', priority: 1.0, changeFrequency: 'weekly' },
    { path: '/floorplans', priority: 0.9, changeFrequency: 'weekly' },
    { path: '/pricing', priority: 0.9, changeFrequency: 'weekly' },
    { path: '/properties', priority: 0.9, changeFrequency: 'weekly' },
    { path: '/customer-stories', priority: 0.8, changeFrequency: 'weekly' },
    { path: '/standard-inclusions', priority: 0.7, changeFrequency: 'monthly' },
    { path: '/roi', priority: 0.7, changeFrequency: 'monthly' },
    { path: '/about-us', priority: 0.6, changeFrequency: 'monthly' },
    { path: '/about-us/our-process', priority: 0.6, changeFrequency: 'monthly' },
    { path: '/about-us/our-team', priority: 0.5, changeFrequency: 'monthly' },
    { path: '/frequently-asked-questions', priority: 0.7, changeFrequency: 'monthly' },
    { path: '/talk-to-an-adu-specialist', priority: 0.8, changeFrequency: 'monthly' },
    { path: '/talk-to-an-adu-specialist/office-consultation', priority: 0.6, changeFrequency: 'monthly' },
    { path: '/talk-to-an-adu-specialist/schedule-call', priority: 0.6, changeFrequency: 'monthly' },
    { path: '/talk-to-an-adu-specialist/formal-property-analysis', priority: 0.6, changeFrequency: 'monthly' },
    { path: '/adu-builder', priority: 0.8, changeFrequency: 'monthly' },
    { path: '/events', priority: 0.5, changeFrequency: 'weekly' },
    { path: '/events/adu-seminar', priority: 0.5, changeFrequency: 'monthly' },
    { path: '/blog', priority: 0.6, changeFrequency: 'weekly' },
    { path: '/submit-a-referral', priority: 0.3, changeFrequency: 'yearly' },
    { path: '/legal/privacy-policy', priority: 0.2, changeFrequency: 'yearly' },
    { path: '/legal/terms-of-use', priority: 0.2, changeFrequency: 'yearly' },
]

/** Fetch a slug list, returning [] if Sanity is unreachable so the build never breaks. */
async function safeFetch(query: string): Promise<SlugRow[]> {
    try {
        return (await client.fetch<SlugRow[]>(query, {}, options)) ?? []
    } catch {
        return []
    }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const now = new Date()

    const [floorplans, properties, stories, posts, openHouses, serviceAreas] =
        await Promise.all([
            safeFetch(SITEMAP_FLOORPLANS_QUERY),
            safeFetch(SITEMAP_PROPERTIES_QUERY),
            safeFetch(SITEMAP_STORIES_QUERY),
            safeFetch(SITEMAP_POSTS_QUERY),
            safeFetch(SITEMAP_OPEN_HOUSES_QUERY),
            safeFetch(SERVICE_AREAS_QUERY),
        ])

    const staticEntries: MetadataRoute.Sitemap = STATIC_ROUTES.map((r) => ({
        url: abs(r.path),
        lastModified: now,
        changeFrequency: r.changeFrequency,
        priority: r.priority,
    }))

    const cityEntries: MetadataRoute.Sitemap = serviceAreas.map((c) => ({
        url: abs(`/adu-builder/${c.slug}`),
        lastModified: c._updatedAt ? new Date(c._updatedAt) : now,
        changeFrequency: 'monthly',
        priority: 0.8,
    }))

    const floorplanEntries: MetadataRoute.Sitemap = floorplans.map((f) => ({
        url: abs(`/floorplans/${f.slug}`),
        lastModified: f._updatedAt ? new Date(f._updatedAt) : now,
        changeFrequency: 'monthly',
        priority: 0.8,
    }))

    const propertyEntries: MetadataRoute.Sitemap = properties.map((p) => ({
        url: abs(`/properties/${p.slug}`),
        lastModified: p._updatedAt ? new Date(p._updatedAt) : now,
        changeFrequency: 'monthly',
        priority: 0.7,
    }))

    const storyEntries: MetadataRoute.Sitemap = stories.map((s) => ({
        url: abs(`/customer-stories/${s.slug}`),
        lastModified: s._updatedAt ? new Date(s._updatedAt) : now,
        changeFrequency: 'monthly',
        priority: 0.6,
    }))

    const postEntries: MetadataRoute.Sitemap = posts
        .filter((p) => p.category && p.slug)
        .map((p) => ({
            url: abs(`/blog/${p.category}/${p.slug}`),
            lastModified: p._updatedAt ? new Date(p._updatedAt) : now,
            changeFrequency: 'monthly',
            priority: 0.5,
        }))

    const openHouseEntries: MetadataRoute.Sitemap = openHouses.map((o) => ({
        url: abs(`/events/open-house/${o.slug}`),
        lastModified: o._updatedAt ? new Date(o._updatedAt) : now,
        changeFrequency: 'weekly',
        priority: 0.4,
    }))

    return [
        ...staticEntries,
        ...cityEntries,
        ...floorplanEntries,
        ...propertyEntries,
        ...storyEntries,
        ...postEntries,
        ...openHouseEntries,
    ]
}
