/**
 * One-time migration: pushes the 14 drafted cities from content/serviceAreas.ts
 * into Sanity as `serviceArea` documents, so they can be managed in the Studio.
 *
 * Run from the website repo:
 *   npx tsx scripts/seedServiceAreas.ts
 *
 * Idempotent: uses deterministic _id `serviceArea-<slug>` + createOrReplace, so
 * re-running overwrites rather than duplicating. Nearby cross-links become real
 * references; any nearby slug that isn't one of the 14 is dropped (no dangling).
 */
import 'dotenv/config'
import { createClient } from '@sanity/client'
import { SERVICE_AREAS } from '../content/serviceAreas'

const token = process.env.SANITY_API_WRITE_TOKEN
if (!token) {
    console.error('Missing SANITY_API_WRITE_TOKEN (run with: node --env-file=.env --import tsx scripts/seedServiceAreas.ts)')
    process.exit(1)
}

const client = createClient({
    projectId: '4sw2w31c',
    dataset: 'production',
    apiVersion: '2025-01-01',
    token,
    useCdn: false,
})

const docId = (slug: string) => `serviceArea-${slug}`
const validSlugs = new Set(SERVICE_AREAS.map((a) => a.slug))

// Turn a plain paragraph string into a Portable Text block.
function introBlock(text: string, i: number) {
    return {
        _type: 'block',
        _key: `intro-${i}`,
        style: 'normal',
        markDefs: [],
        children: [{ _type: 'span', _key: `intro-${i}-s`, text, marks: [] }],
    }
}

async function run() {
    const tx = client.transaction()

    for (const a of SERVICE_AREAS) {
        const doc = {
            _id: docId(a.slug),
            _type: 'serviceArea',
            city: a.city,
            slug: { _type: 'slug', current: a.slug },
            county: a.county,
            latitude: a.geo.lat,
            longitude: a.geo.lng,
            distanceFromUplandMi: a.distanceFromUplandMi,
            blurb: a.blurb,
            intro: a.intro.map(introBlock),
            permittingDepartment: a.permitting.department,
            permittingNotes: a.permitting.notes,
            neighborhoods: a.neighborhoods,
            localFaqs: a.localFaqs.map((f, i) => ({
                _type: 'cityFaq',
                _key: `faq-${i}`,
                question: f.question,
                answer: f.answer,
            })),
            nearby: a.nearby
                .filter((slug) => validSlugs.has(slug))
                .map((slug, i) => ({
                    _type: 'reference',
                    _key: `near-${i}`,
                    _ref: docId(slug),
                })),
        }
        tx.createOrReplace(doc)
        console.log(`• queued ${a.city} (${doc._id})`)
    }

    await tx.commit()
    console.log(`\n✅ Seeded ${SERVICE_AREAS.length} service areas into Sanity.`)
}

run().catch((e) => {
    console.error(e)
    process.exit(1)
})
