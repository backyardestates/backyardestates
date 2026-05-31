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

/**
 * Turn any error thrown by an Anthropic call into a single readable line that
 * carries the detail we actually need to debug — HTTP status, the API error
 * `type`, the real message, and the request id. The raw SDK `APIError.message`
 * is a `"<status> <stringified-json>"` blob; a thrown `DOMException`/`Error`
 * only exposes `.message`. This normalizes both so the surfaced error is
 * actionable instead of a bare "The string did not match the expected pattern."
 */
export function describeAiError(err: unknown): string {
    if (err instanceof Anthropic.APIError) {
        const body = err.error as
            | { error?: { type?: string; message?: string } }
            | undefined;
        const type = err.type ?? body?.error?.type ?? err.name;
        const message = body?.error?.message ?? err.message;
        const reqId = err.requestID ? ` [request_id: ${err.requestID}]` : "";
        return `Anthropic API ${err.status ?? "?"} ${type}: ${message}${reqId} (model: ${CLAUDE_MODEL})`;
    }
    if (err instanceof Error) {
        return `${err.name}: ${err.message} (model: ${CLAUDE_MODEL})`;
    }
    return String(err);
}
