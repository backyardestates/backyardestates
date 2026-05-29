import { z } from "zod/v4";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { getAnthropic, CLAUDE_MODEL } from "./claude";
import { EVERGREEN_LINKS, type LinkedStory, type LinkedProperty, type LinkedFloorplan } from "@/lib/drip/links";

// ── Output contract ──────────────────────────────────────────────────────────
export const DripPolishSchema = z.object({
    subject: z.string(),
    body: z.string(),
    // Sanity _id of a story / completed build the rewrite leans on, if any.
    contentRef: z.string().nullable(),
});

export type DripPolishResult = z.infer<typeof DripPolishSchema>;

const SYSTEM_PROMPT = `You polish a single follow-up email in a Backyard Estates drip sequence. Backyard Estates is a California company that designs and builds custom Accessory Dwelling Units (ADUs / backyard homes).

You receive the current email (subject + body), the rep's instruction for how to change it, what we know about this specific prospect (motivation, readiness, concerns, key points from their consultation), and Backyard Estates' available content — customer stories (names, purpose, quote) and completed builds (name, size, beds/baths), each with an id.

Rewrite the email to satisfy the rep's instruction while keeping it a warm, concise, professional touch from the Backyard Estates team to this prospect, nudging toward the next step (typically scheduling the paid formal property analysis).

Each content item (story, completed build, floorplan) has an id and a "url" (its real page; may be null). You also get "links" to a few evergreen pages.

Rules:
- Follow the rep's instruction precisely. If it asks to reference specific content, use it.
- Ground every claim in the prospect context or the provided content. NEVER invent stories, builds, prices, timelines, or commitments that weren't given.
- When you lean on a specific story, build, or floorplan, set contentRef to that item's id; otherwise set contentRef to null.
- Keep the body to roughly 3–6 sentences. No placeholders like [NAME] — use the real first name if known, otherwise write naturally.

LINKS — strict rules (broken links are unacceptable):
- When you mention a specific story, completed build, or floorplan, link to it as a markdown link using that exact item's "url": [descriptive anchor](url). You may also link the evergreen "links" when it fits.
- ONLY use a URL that appears verbatim in the provided data. NEVER invent, guess, or modify a URL, slug, or path. If an item's "url" is null, refer to it by name with no link.
- 1–2 well-placed links in the body at most. Never put a URL in the subject.`;

export interface DripPolishInput {
    currentSubject: string;
    currentBody: string;
    instruction: string;
    customerName?: string | null;
    motivation?: string | null;
    readiness?: string | null;
    concerns?: string[];
    bulletPoints?: string[];
    stories: LinkedStory[];
    properties: LinkedProperty[];
    floorplans: LinkedFloorplan[];
}

/** Rewrite one drip email per the rep's instruction, grounded in prospect
 *  context + Sanity content. Returns the draft; the caller saves it. */
export async function polishDripMessage(input: DripPolishInput): Promise<DripPolishResult> {
    const client = getAnthropic();

    const userContent = JSON.stringify(
        {
            instruction: input.instruction,
            currentEmail: { subject: input.currentSubject, body: input.currentBody },
            prospect: {
                name: input.customerName ?? null,
                motivation: input.motivation ?? null,
                readiness: input.readiness ?? null,
                concerns: input.concerns ?? [],
                keyPoints: input.bulletPoints ?? [],
            },
            availableStories: input.stories,
            availableCompletedBuilds: input.properties,
            availableFloorplans: input.floorplans,
            links: EVERGREEN_LINKS,
        },
        null,
        2,
    );

    const message = await client.messages.parse({
        model: CLAUDE_MODEL,
        max_tokens: 2000,
        system: [{ type: "text", text: SYSTEM_PROMPT, cache_control: { type: "ephemeral" } }],
        messages: [{ role: "user", content: userContent }],
        output_config: { format: zodOutputFormat(DripPolishSchema) },
    });

    const parsed = message.parsed_output;
    if (!parsed) throw new Error("Claude returned no polished draft.");
    return parsed;
}
