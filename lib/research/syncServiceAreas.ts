// Core "auto-add a city" engine, shared by the on-demand script
// (scripts/syncServiceAreas.ts) and the Sanity webhook
// (app/api/sync-service-area/route.ts).
//
// Flow: find an uncovered city -> research it with Claude -> pick nearby cities
// -> write a DRAFT serviceArea to Sanity -> notify the team to review & publish.
import { createClient, type SanityClient } from '@sanity/client'
import { Resend } from 'resend'

import { researchServiceArea } from './serviceAreaResearch'
import {
    buildServiceAreaDoc,
    slugifyCity,
    type County,
} from '@/lib/serviceAreaDoc'
import { SITE_URL } from '@/lib/business'

export function writeClient(): SanityClient {
    const token = process.env.SANITY_API_WRITE_TOKEN
    if (!token) throw new Error('Missing SANITY_API_WRITE_TOKEN')
    return createClient({
        projectId: '4sw2w31c',
        dataset: 'production',
        apiVersion: '2025-01-01',
        token,
        useCdn: false,
    })
}

/** Slugs already covered by a serviceArea — published OR draft — to avoid dupes. */
export async function coveredSlugs(client: SanityClient): Promise<Set<string>> {
    const slugs: (string | null)[] = await client.fetch(
        `*[_type == "serviceArea"].slug.current`
    )
    return new Set(slugs.filter(Boolean) as string[])
}

interface ExistingArea {
    slug: string
    city: string
    latitude?: number
    longitude?: number
}

async function existingServiceAreas(
    client: SanityClient
): Promise<ExistingArea[]> {
    // Published only (exclude drafts) so a city with a lingering draft doesn't
    // appear twice and get picked as two separate "nearby" entries.
    return client.fetch(
        `*[_type == "serviceArea" && defined(slug.current) && !(_id in path("drafts.**"))]{ "slug": slug.current, city, latitude, longitude }`
    )
}

/** The N closest existing service-area slugs to a point (excludes self). */
function pickNearby(
    lat: number,
    lng: number,
    selfSlug: string,
    existing: ExistingArea[],
    n = 3
): string[] {
    const dist = (a: ExistingArea) => {
        if (a.latitude == null || a.longitude == null) return Infinity
        return (a.latitude - lat) ** 2 + (a.longitude - lng) ** 2
    }
    const seen = new Set<string>()
    return existing
        .filter((a) => a.slug !== selfSlug)
        .sort((a, b) => dist(a) - dist(b))
        .map((a) => a.slug)
        .filter((slug) => (seen.has(slug) ? false : (seen.add(slug), true)))
        .slice(0, n)
}

export interface DraftResult {
    city: string
    slug: string
    id: string
}

/**
 * Research a city and write a DRAFT serviceArea. Returns null if the city is
 * already covered (published or draft). Throws on research/write failure.
 */
export async function draftCity(
    client: SanityClient,
    city: string,
    countyHint?: County
): Promise<DraftResult | null> {
    const slug = slugifyCity(city)
    const covered = await coveredSlugs(client)
    if (covered.has(slug)) return null

    const content = await researchServiceArea(city, countyHint)
    const existing = await existingServiceAreas(client)
    const nearby = pickNearby(
        content.latitude,
        content.longitude,
        slug,
        existing
    )

    const doc = buildServiceAreaDoc(content, nearby, { draft: true })
    await client.createOrReplace(doc)
    return { city: content.city, slug, id: doc._id }
}

/** Distinct property cities that don't yet have a serviceArea page. */
export async function uncoveredCities(client: SanityClient): Promise<string[]> {
    const rows: { city: string | null }[] = await client.fetch(
        `*[_type == "property" && (defined(address.city) || defined(location))]{
            "city": coalesce(address.city, location)
        }`
    )
    const covered = await coveredSlugs(client)
    const seen = new Set<string>()
    const out: string[] = []
    for (const r of rows) {
        if (!r.city) continue
        // Normalize "Upland, CA" / "Pomona " -> "Upland" / "Pomona"
        const city = r.city.split(',')[0].trim()
        if (!city) continue
        const slug = slugifyCity(city)
        if (covered.has(slug) || seen.has(slug)) continue
        seen.add(slug)
        out.push(city)
    }
    return out
}

/** Best-effort email to the team that new drafts are ready to review. */
export async function notifyDraftsReady(drafts: DraftResult[]): Promise<void> {
    if (!drafts.length || !process.env.RESEND_API_KEY) return
    try {
        const resend = new Resend(process.env.RESEND_API_KEY)
        const list = drafts
            .map(
                (d) =>
                    `• ${d.city} — review at ${SITE_URL.replace('www.', '')}/studio (draft) then it goes live at ${SITE_URL}/adu-builder/${d.slug}`
            )
            .join('\n')
        // Who gets the "new city drafted" alert (NOT the public contact email).
        const notifyTo =
            process.env.SERVICE_AREA_NOTIFY_EMAIL || 'edgar@backyardestates.com'
        await resend.emails.send({
            from: 'Backyard Estates <noreply@backyardestates.com>',
            to: [notifyTo],
            subject: `New ADU city page draft${drafts.length > 1 ? 's' : ''} ready to review (${drafts.length})`,
            text: `Auto-research drafted ${drafts.length} new service-area page${
                drafts.length > 1 ? 's' : ''
            }. Open Sanity Studio, fact-check the permitting details, and publish:\n\n${list}\n\nThese are DRAFTS — they are not live until you publish them.`,
        })
    } catch (e) {
        // Never let a notification failure break the drafting flow.
        console.error('notifyDraftsReady failed:', e)
    }
}
