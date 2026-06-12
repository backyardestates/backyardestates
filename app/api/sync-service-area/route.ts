// Sanity webhook: when a property is published, auto-draft a service-area page
// for its city if one doesn't exist yet. Configure in Sanity → API → Webhooks:
//   URL:    https://www.backyardestates.com/api/sync-service-area?secret=<SECRET>
//   Trigger: on "create"/"update" for _type == "property"
//   Projection: { "city": coalesce(address.city, location) }
//
// Secured by a shared secret (env SERVICE_AREA_SYNC_SECRET). Idempotent: an
// already-covered city is a no-op. Always creates a DRAFT for human review.
import { NextResponse } from 'next/server'
import {
    writeClient,
    draftCity,
    notifyDraftsReady,
} from '@/lib/research/syncServiceAreas'

export const runtime = 'nodejs'
export const maxDuration = 300 // research can take up to a minute

function authorized(req: Request): boolean {
    const secret = process.env.SERVICE_AREA_SYNC_SECRET
    if (!secret) return false
    const url = new URL(req.url)
    const provided =
        url.searchParams.get('secret') || req.headers.get('x-sync-secret')
    return provided === secret
}

export async function POST(req: Request) {
    if (!authorized(req)) {
        return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
    }

    let body: any
    try {
        body = await req.json()
    } catch {
        return NextResponse.json({ error: 'invalid json' }, { status: 400 })
    }

    // Accept either the projected { city } or a raw property document.
    const rawCity: string | undefined =
        body?.city || body?.address?.city || body?.location
    const city = typeof rawCity === 'string' ? rawCity.split(',')[0].trim() : ''
    if (!city) {
        return NextResponse.json({ ok: true, skipped: 'no city in payload' })
    }

    try {
        const client = writeClient()
        const result = await draftCity(client, city)
        if (!result) {
            return NextResponse.json({ ok: true, city, skipped: 'already covered' })
        }
        await notifyDraftsReady([result])
        return NextResponse.json({ ok: true, drafted: result })
    } catch (e) {
        console.error('sync-service-area failed:', e)
        return NextResponse.json(
            { error: (e as Error).message },
            { status: 500 }
        )
    }
}

export async function GET() {
    return NextResponse.json({
        ok: true,
        usage: 'POST a Sanity property webhook here (with ?secret=...) to auto-draft a service-area page for a new city.',
    })
}
