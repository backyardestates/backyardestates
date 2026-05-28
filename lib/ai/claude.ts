import Anthropic from "@anthropic-ai/sdk";

/** The model the consultation AI runs on. Opus 4.7 — adaptive thinking only,
 *  no sampling params. See the claude-api skill. */
export const CLAUDE_MODEL = "claude-opus-4-7";

let client: Anthropic | null = null;

/** Lazy server-only Anthropic client. Throws a clear error if the key is
 *  missing so the route can surface a 503 rather than crash at import. */
export function getAnthropic(): Anthropic {
    if (!process.env.ANTHROPIC_API_KEY) {
        throw new Error("ANTHROPIC_API_KEY is not set on the server.");
    }
    if (!client) client = new Anthropic();
    return client;
}

export function isAnthropicConfigured(): boolean {
    return !!process.env.ANTHROPIC_API_KEY;
}
