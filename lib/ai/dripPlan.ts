import { z } from "zod/v4";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { getAnthropic, CLAUDE_MODEL } from "./claude";
import { EVERGREEN_LINKS, type LinkedStory, type LinkedProperty, type LinkedFloorplan } from "@/lib/drip/links";

// 3–5 touches enforced in the prompt (structured outputs can't constrain array
// length). contentRef is the Sanity _id of a referenced story / completed build.
export const DripPlanSchema = z.object({
    messages: z.array(
        z.object({
            dayOffset: z.number(),
            channel: z.enum(["email"]),
            subject: z.string(),
            body: z.string(),
            contentRef: z.string().optional(),
        }),
    ),
});
export type DripPlan = z.infer<typeof DripPlanSchema>;

export interface DripPlanInput {
    customerName?: string | null;
    motivation?: string | null;
    readiness?: string | null;
    concerns?: string[];
    bulletPoints?: string[];
    stories: LinkedStory[];
    properties: LinkedProperty[];
    floorplans: LinkedFloorplan[];
}

const SYSTEM_PROMPT = `You design a personalized email drip sequence for a prospect of Backyard Estates, a California ADU (backyard home) builder, after their office consultation.

You receive: the prospect's sentiment/intent (motivation, readiness, concerns), key points from the consultation, and Backyard Estates' available content — customer stories (names, purpose for building, a quote), completed builds (name, size, beds/baths), and floorplans (name, size, beds/baths). Each content item has an id and a "url" (its real page on the website; may be null). You're also given "links" to a few evergreen pages.

Produce a sequence of 3 to 5 emails that nurtures this specific prospect toward booking their formal property analysis:
- Space the touches out: dayOffset 2–3 for the first, then roughly every 4–6 days (e.g. 3, 8, 14, 21).
- Match content to THIS prospect. If they're income-motivated, lead with a rental/ROI story; if they worried about fitting a unit on their lot, reference a completed build or floorplan of similar size; if timeline was a concern, address permitting/build timelines. When you reference a specific story, build, or floorplan, put its id in contentRef.
- Each email: a warm, concise subject and a short body (3–6 sentences) from the Backyard Estates team to the prospect. Use the customer's first name if provided. End with a soft call-to-action toward the next step (scheduling the paid formal property analysis).
- Vary the angle across emails — don't repeat the same pitch. Ground every reference in the provided content; never invent stories, builds, prices, or timelines that weren't given.
- No placeholders like [NAME] — write naturally.

LINKS — strict rules (broken links are unacceptable):
- When you mention a specific story, completed build, or floorplan, link to it using a markdown link with that exact item's "url": [descriptive anchor text](url). You may also link the evergreen pages provided under "links" when it fits (e.g. the floorplans gallery or booking a consultation).
- ONLY use a URL that appears verbatim in the provided data (an item's "url" or one of the "links"). NEVER invent, guess, or modify a URL, slug, or path. If an item's "url" is null, refer to it by name with no link.
- Keep it natural: 1–2 well-placed links per email, not a list of links. Links go in the body, never the subject.`;

/** Generate a content-matched drip sequence for a prospect. */
export async function generateDripPlan(input: DripPlanInput): Promise<DripPlan> {
    const client = getAnthropic();

    const userContent = JSON.stringify(
        {
            customer: input.customerName ?? null,
            motivation: input.motivation ?? null,
            readiness: input.readiness ?? null,
            concerns: input.concerns ?? [],
            keyPoints: input.bulletPoints ?? [],
            availableStories: input.stories,
            availableCompletedBuilds: input.properties,
            availableFloorplans: input.floorplans,
            links: EVERGREEN_LINKS,
        },
        null,
        2,
    );

    const message = await client.beta.messages.parse({
        model: CLAUDE_MODEL,
        max_tokens: 4000,
        system: [{ type: "text", text: SYSTEM_PROMPT, cache_control: { type: "ephemeral" } }],
        messages: [{ role: "user", content: userContent }],
        output_config: { format: zodOutputFormat(DripPlanSchema) },
    });

    const parsed = message.parsed_output;
    if (!parsed) throw new Error("Claude returned no drip plan.");
    return parsed;
}
