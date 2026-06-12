// Researches a city with Claude (Opus 4.8 + web search) and returns structured,
// on-brand service-area content for a draft /adu-builder/[city] page.
//
// The web_search server tool grounds the copy in real facts (the actual city
// planning department, county, neighborhoods, ADU demand drivers). The model
// then calls the `save_service_area` tool, whose validated input we return.
import Anthropic from '@anthropic-ai/sdk'
import { business, COUNTIES_SERVED, ADU_SYNONYMS } from '@/lib/business'
import type { ServiceAreaContent, County } from '@/lib/serviceAreaDoc'

const MODEL = 'claude-opus-4-8'

const SAVE_TOOL = {
    name: 'save_service_area',
    description:
        'Save the finalized, fact-checked service-area page content. Call this exactly once, after researching the city.',
    input_schema: {
        type: 'object' as const,
        properties: {
            county: {
                type: 'string',
                enum: ['San Bernardino', 'Riverside', 'Los Angeles'],
                description: 'The California county this city is in.',
            },
            latitude: { type: 'number', description: 'City centroid latitude.' },
            longitude: { type: 'number', description: 'City centroid longitude.' },
            blurb: {
                type: 'string',
                description:
                    'One-sentence hero subtitle (40–180 chars), specific to this city.',
            },
            intro: {
                type: 'array',
                items: { type: 'string' },
                description:
                    '3 unique paragraphs (~250–350 words total) of genuinely local, specific copy — real neighborhoods, lot characteristics, ADU demand drivers, and the company being close/experienced. Warm, confident, factual. No fabricated statistics.',
            },
            permittingDepartment: {
                type: 'string',
                description:
                    'The exact name of the city department that reviews ADU permits, e.g. "City of Fontana Planning Division". Verify via web search.',
            },
            permittingNotes: {
                type: 'array',
                items: { type: 'string' },
                description:
                    "4 short bullet facts about ADU permitting that apply here, grounded in CURRENT California statewide ADU law (60-day ministerial approval, 800 sq ft by-right with 4-ft setbacks, up to 1,200 sq ft on most lots, no added parking within half a mile of transit, no owner-occupancy requirement through 2025). Keep them accurate; don't invent city-specific numbers.",
            },
            neighborhoods: {
                type: 'array',
                items: { type: 'string' },
                description: '3–5 real neighborhoods or districts in this city.',
            },
            avgMonthlyRentLow: {
                type: 'number',
                description:
                    'Low end of a realistic monthly rent (USD) for a 1–2 bedroom ADU / small unit in this city, based on current local rental data. Whole dollars, e.g. 2200.',
            },
            avgMonthlyRentHigh: {
                type: 'number',
                description:
                    'High end of a realistic monthly rent (USD) for a 1–2 bedroom ADU in this city. Whole dollars, e.g. 3200.',
            },
            localFaqs: {
                type: 'array',
                items: {
                    type: 'object',
                    properties: {
                        question: { type: 'string' },
                        answer: { type: 'string' },
                    },
                    required: ['question', 'answer'],
                    additionalProperties: false,
                },
                description:
                    '3 city-specific Q&As (cost, permitting, rental/ADU use) with concise, accurate answers in the company voice.',
            },
        },
        required: [
            'county',
            'latitude',
            'longitude',
            'blurb',
            'intro',
            'permittingDepartment',
            'permittingNotes',
            'neighborhoods',
            'localFaqs',
            'avgMonthlyRentLow',
            'avgMonthlyRentHigh',
        ],
        additionalProperties: false,
    },
}

const SYSTEM = `You are a local-market researcher and copywriter for ${business.name}, an ADU (accessory dwelling unit) design-build contractor headquartered in Upland, California. ADUs are also called ${ADU_SYNONYMS.slice(2).join(', ')}.

You write the content for one city's landing page at /adu-builder/[city]. The company builds throughout ${COUNTIES_SERVED.join(', ')} within ~30 miles of Upland.

Process:
1. Use web_search to verify, for the given city: which California county it's in, the exact name of the city department that reviews ADU permits, its real neighborhoods/districts, typical lot characteristics, what drives ADU demand there (colleges, rents, multigenerational families, large lots, etc.), and a realistic CURRENT monthly rent range for a 1–2 bedroom ADU / small rental in that city (for avgMonthlyRentLow/High).
2. Ground all permitting claims in CURRENT California statewide ADU law — do NOT invent city-specific setback or fee numbers.
3. Write genuinely UNIQUE, locally-specific copy in a warm, confident, factual voice (matching a premium design-build contractor). Never use templated mad-libs where only the city name changes — each city must read as distinctly its own.
4. Call save_service_area exactly once with the finalized content.

Accuracy matters more than flourish: this becomes a real, human-reviewed draft. If you can't verify a specific local fact, prefer accurate statewide facts over guessing.`

/**
 * Research a city and return structured service-area content.
 * @param city e.g. "Fontana"
 * @param countyHint optional known county to steer the model
 */
export async function researchServiceArea(
    city: string,
    countyHint?: County
): Promise<ServiceAreaContent> {
    const client = new Anthropic() // reads ANTHROPIC_API_KEY

    const userPrompt = `Research and write the service-area page for: ${city}, California${
        countyHint ? ` (${countyHint} County)` : ''
    }. Build an ADU there with ${business.name}. Verify the real city planning department and local details via web search, then call save_service_area.`

    const messages: Anthropic.MessageParam[] = [
        { role: 'user', content: userPrompt },
    ]

    // Server-side web_search may pause the turn; loop until the model calls our tool.
    for (let i = 0; i < 8; i++) {
        const response = await client.messages.create({
            model: MODEL,
            max_tokens: 8000,
            thinking: { type: 'adaptive' },
            system: SYSTEM,
            tools: [
                { type: 'web_search_20260209', name: 'web_search' } as any,
                SAVE_TOOL as any,
            ],
            messages,
        })

        const save = response.content.find(
            (b): b is Anthropic.ToolUseBlock =>
                b.type === 'tool_use' && b.name === 'save_service_area'
        )
        if (save) {
            const input = save.input as Omit<ServiceAreaContent, 'city'>
            return { city, ...input }
        }

        if (response.stop_reason === 'pause_turn') {
            // Server tool loop hit its cap; re-send to resume.
            messages.push({ role: 'assistant', content: response.content })
            continue
        }

        // Model produced something else (e.g. asked a question). Nudge it once.
        messages.push({ role: 'assistant', content: response.content })
        messages.push({
            role: 'user',
            content:
                'Finish researching if needed, then call save_service_area with the finalized content.',
        })
    }

    throw new Error(
        `Research for "${city}" did not produce save_service_area output after several turns.`
    )
}
