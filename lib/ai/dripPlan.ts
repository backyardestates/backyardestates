import { z } from "zod/v4";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { getAnthropic, CLAUDE_MODEL } from "./claude";

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

interface StoryRef {
    id: string;
    names?: string;
    purpose?: string;
    quote?: string;
}
interface PropertyRef {
    id: string;
    name?: string;
    sqft?: number;
    bed?: number;
    bath?: number;
}

export interface DripPlanInput {
    customerName?: string | null;
    motivation?: string | null;
    readiness?: string | null;
    concerns?: string[];
    bulletPoints?: string[];
    stories: StoryRef[];
    properties: PropertyRef[];
}

const SYSTEM_PROMPT = `You design a personalized email drip sequence for a prospect of Backyard Estates, a California ADU (backyard home) builder, after their office consultation.

You receive: the prospect's sentiment/intent (motivation, readiness, concerns), key points from the consultation, and Backyard Estates' available content — customer stories (with the customers' names, their purpose for building, and a quote) and completed builds (name, size, beds/baths). Each content item has an id.

Produce a sequence of 3 to 5 emails that nurtures this specific prospect toward booking their formal property analysis:
- Space the touches out: dayOffset 2–3 for the first, then roughly every 4–6 days (e.g. 3, 8, 14, 21).
- Match content to THIS prospect. If they're income-motivated, lead with a rental/ROI story; if they worried about fitting a unit on their lot, reference a completed build of similar size; if timeline was a concern, address permitting/build timelines. When you reference a specific story or build, put its id in contentRef so we can link to it.
- Each email: a warm, concise subject and a short body (3–6 sentences) from the Backyard Estates team to the prospect. Use the customer's first name if provided. End with a soft call-to-action toward the next step (scheduling the paid formal property analysis).
- Vary the angle across emails — don't repeat the same pitch. Ground every reference in the provided content; never invent stories, builds, prices, or timelines that weren't given.
- No placeholders like [NAME] — write naturally.`;

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
        },
        null,
        2,
    );

    const message = await client.messages.parse({
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
