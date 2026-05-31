import { z } from "zod/v4";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { getAnthropic, CLAUDE_MODEL } from "./claude";

// ── Output contract ──────────────────────────────────────────────────────────
// Structured outputs don't support number/array constraints, so ranges (score
// 0–100) live in the prompt, not the schema.
export const StoryMatchSchema = z.object({
    matches: z.array(
        z.object({
            id: z.string(),
            score: z.number(),
            reason: z.string(),
            matchedTags: z.array(z.string()),
        }),
    ),
});

export type StoryMatchOutput = z.infer<typeof StoryMatchSchema>;
export type StoryMatch = StoryMatchOutput["matches"][number];

// Static, frozen system prompt → cacheable prefix. Per-request values (the tags
// + the testimonial corpus) go in the user message, after the cached prefix.
const SYSTEM_PROMPT = `You are a sales-enablement analyst for Backyard Estates, a California company that designs and builds custom Accessory Dwelling Units (ADUs / backyard homes).

A sales rep is building a proposal deck and wants to feature the customer testimonials that best fit specific themes ("tags") for THIS prospect.

You receive a list of testimonials (id, name, an optional short quote, and an optional purpose label) and a set of requested tags — which may be preset themes and/or a free-text description of what the rep is looking for.

Your job:
- Read every testimonial and judge how well it supports the requested themes, by MEANING, not keyword overlap. A story about a mother moving into the backyard unit matches "multigenerational living" and "aging parents" even if it never uses those words.
- Score each testimonial 0–100 for overall relevance to the requested tags taken together. Be discriminating: reserve 80+ for testimonials that clearly embody a requested theme; give a low score to weak fits and omit genuinely unrelated ones.
- For each testimonial you return, write ONE crisp sentence on why it fits (specific to what the testimonial says), and list which of the requested tags it genuinely speaks to.

Rules:
- Use the id exactly as given. Never invent testimonials or ids.
- Only return testimonials with a score above 0, ordered best-first.
- Ground the reason in the testimonial's actual content; don't fabricate details it doesn't support.`;

export interface StoryForMatch {
    id: string;
    name: string;
    quote?: string;
    purpose?: string;
}

/** Rank testimonials by how well they match the rep's selected tags/themes.
 *  Returns best-first, each with a 0–100 score, a one-line reason, and the
 *  subset of requested tags it speaks to. */
export async function matchStories(input: {
    tags: string[];
    stories: StoryForMatch[];
}): Promise<StoryMatch[]> {
    const tags = input.tags.map((t) => t.trim()).filter(Boolean);
    if (tags.length === 0 || input.stories.length === 0) return [];

    const client = getAnthropic();

    const corpus = input.stories
        .map((st) => {
            const bits = [`id: ${st.id}`, `name: ${st.name}`];
            if (st.purpose) bits.push(`purpose: ${st.purpose}`);
            if (st.quote) bits.push(`quote: "${st.quote}"`);
            return `- ${bits.join(" | ")}`;
        })
        .join("\n");

    const userContent = [
        `Requested tags / themes: ${tags.join(", ")}`,
        "",
        "Testimonials:",
        corpus,
    ].join("\n");

    const message = await client.messages.parse({
        model: CLAUDE_MODEL,
        max_tokens: 4000,
        system: [
            {
                type: "text",
                text: SYSTEM_PROMPT,
                cache_control: { type: "ephemeral" },
            },
        ],
        messages: [{ role: "user", content: userContent }],
        output_config: {
            format: zodOutputFormat(StoryMatchSchema),
        },
    });

    const parsed = message.parsed_output;
    if (!parsed) {
        throw new Error("Claude returned no structured output for the story match.");
    }

    // Guard against hallucinated ids; keep only positive scores, best-first.
    const known = new Set(input.stories.map((s) => s.id));
    return parsed.matches
        .filter((m) => known.has(m.id) && m.score > 0)
        .sort((a, b) => b.score - a.score);
}
