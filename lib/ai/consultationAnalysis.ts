import { z } from "zod";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { getAnthropic, CLAUDE_MODEL } from "./claude";

// ── Output contract ──────────────────────────────────────────────────────────
// Structured outputs don't support array length / string length constraints, so
// "5–10" lives in the prompt, not the schema. zodOutputFormat strips any
// unsupported constraints and validates them client-side.
export const ConsultationAnalysisSchema = z.object({
    summary: z.string(),
    bulletPoints: z.array(z.string()),
    actionItems: z.array(
        z.object({
            task: z.string(),
            owner: z.enum(["rep", "customer", "architect", "unspecified"]),
            priority: z.enum(["high", "medium", "low"]),
        }),
    ),
    sentiment: z.object({
        overall: z.enum(["very_positive", "positive", "neutral", "hesitant", "negative"]),
        rationale: z.string(),
    }),
    intent: z.object({
        readiness: z.enum(["hot", "warm", "cold"]),
        primaryMotivation: z.string(),
        concerns: z.array(z.string()),
    }),
    nextStepsEmail: z.object({
        subject: z.string(),
        body: z.string(),
    }),
    marketingActions: z.array(
        z.object({
            title: z.string(),
            detail: z.string(),
            channel: z.enum(["email", "sms", "call", "content", "other"]),
        }),
    ),
});

export type ConsultationAnalysis = z.infer<typeof ConsultationAnalysisSchema>;

// Static, frozen system prompt → cacheable prefix. Do NOT interpolate
// per-request values here; the transcript + customer context go in the user
// message (after the cached prefix).
const SYSTEM_PROMPT = `You are an expert sales operations analyst for Backyard Estates, a California company that designs and builds custom Accessory Dwelling Units (ADUs / backyard homes).

You read the transcript of an in-office consultation between a Backyard Estates sales rep and a prospective customer, and produce a structured analysis the rep can act on immediately after the meeting.

Goals:
- Capture what the prospect actually said and wants — their goals, motivation, property situation, budget signals, timeline, and any concerns or objections.
- Identify concrete next steps and who owns each.
- Read sentiment and buying intent honestly. Do not inflate readiness; "hesitant" and "cold" are valid.
- Draft a warm, concise, professional next-steps email FROM the rep TO the prospect that: thanks them for coming in, summarizes the conversation in 2–4 sentences, lists the agreed action items, and clearly invites the next step (typically scheduling a paid formal property analysis). Use the customer's first name if known. Do not invent prices, timelines, or commitments that weren't discussed.
- Propose 5 to 10 distinct marketing / follow-up actions the team can take to nurture this specific prospect — tie each to something concrete from the conversation (e.g. match a concern to a customer testimonial, a completed build, a financing explainer, a timeline expectation). Each action names a channel.

Rules:
- Ground every output in the transcript. If something wasn't discussed, don't fabricate it.
- Be specific and concrete, not generic. "Send the Encinitas backyard-studio case study because they worried about fitting a unit on a small lot" beats "send a case study".
- Keep the email free of placeholders like [NAME] — use the real name if known, otherwise write naturally without a bracket.`;

export interface AnalyzeInput {
    transcript: string;
    customerName?: string | null;
    address?: string | null;
}

/** Run the consultation transcript through Claude and return structured notes,
 *  a next-steps email draft, and marketing follow-up actions. */
export async function analyzeConsultation(
    input: AnalyzeInput,
): Promise<ConsultationAnalysis> {
    const client = getAnthropic();

    const userContent = [
        input.customerName ? `Customer: ${input.customerName}` : null,
        input.address ? `Property: ${input.address}` : null,
        "",
        "Consultation transcript:",
        input.transcript,
    ]
        .filter((line): line is string => line !== null)
        .join("\n");

    const message = await client.messages.parse({
        model: CLAUDE_MODEL,
        max_tokens: 8000,
        system: [
            {
                type: "text",
                text: SYSTEM_PROMPT,
                cache_control: { type: "ephemeral" },
            },
        ],
        messages: [{ role: "user", content: userContent }],
        output_config: {
            format: zodOutputFormat(ConsultationAnalysisSchema),
        },
    });

    const parsed = message.parsed_output;
    if (!parsed) {
        throw new Error("Claude returned no structured output for the consultation.");
    }
    return parsed;
}
