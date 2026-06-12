/**
 * On-demand "auto-add cities" runner.
 *
 *   npx tsx scripts/syncServiceAreas.ts                 # scan properties for uncovered cities
 *   npx tsx scripts/syncServiceAreas.ts "Fontana" "Ontario" "San Dimas"   # draft specific cities
 *
 * Researches each city with Claude (web-search grounded) and writes a DRAFT
 * serviceArea to Sanity for human review. Idempotent: already-covered cities
 * (published or draft) are skipped. Needs ANTHROPIC_API_KEY + SANITY_API_WRITE_TOKEN.
 */
import 'dotenv/config'
import {
    writeClient,
    draftCity,
    uncoveredCities,
    notifyDraftsReady,
    type DraftResult,
} from '../lib/research/syncServiceAreas'

async function main() {
    const client = writeClient()
    const argCities = process.argv.slice(2)
    const cities = argCities.length ? argCities : await uncoveredCities(client)

    if (!cities.length) {
        console.log('✅ No uncovered cities — every property city already has a page.')
        return
    }

    console.log(`Drafting ${cities.length} city page(s): ${cities.join(', ')}\n`)

    const drafts: DraftResult[] = []
    for (const city of cities) {
        process.stdout.write(`• ${city} … researching `)
        try {
            const result = await draftCity(client, city)
            if (!result) {
                console.log('↳ already covered, skipped')
                continue
            }
            drafts.push(result)
            console.log(`↳ ✅ draft created (${result.id})`)
        } catch (e) {
            console.log('↳ ❌ failed')
            console.error(`   ${(e as Error).message}`)
        }
    }

    if (drafts.length) {
        await notifyDraftsReady(drafts)
        console.log(
            `\n✅ Created ${drafts.length} DRAFT page(s). Review + publish them in Sanity Studio:`
        )
        drafts.forEach((d) => console.log(`   - ${d.city} (/adu-builder/${d.slug})`))
        console.log('\nThey are NOT live until you publish them.')
    } else {
        console.log('\nNo new drafts created.')
    }
}

main().catch((e) => {
    console.error(e)
    process.exit(1)
})
