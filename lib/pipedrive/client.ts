/**
 * Server-only Pipedrive client.
 *
 * Uses server-side env vars (PIPEDRIVE_API_TOKEN / PIPEDRIVE_DOMAIN) so the
 * token never ships in the browser bundle. NEVER import this from a "use
 * client" file — it must only be called from API routes or server components.
 *
 * Legacy code still references NEXT_PUBLIC_PIPEDRIVE_API_TOKEN; that variant
 * is kept as a fallback during the migration so newsletter forms etc. don't
 * break, but new code should rely exclusively on PIPEDRIVE_*.
 */

const DOMAIN =
    process.env.PIPEDRIVE_DOMAIN ?? process.env.NEXT_PUBLIC_PIPEDRIVE_DOMAIN;
const API_TOKEN =
    process.env.PIPEDRIVE_API_TOKEN ?? process.env.NEXT_PUBLIC_PIPEDRIVE_API_TOKEN;

export class PipedriveConfigError extends Error {}
export class PipedriveApiError extends Error {
    constructor(message: string, public status: number, public body: unknown) {
        super(message);
    }
}

export function isPipedriveConfigured(): boolean {
    return !!(DOMAIN && API_TOKEN);
}

function requireConfig(): { domain: string; token: string } {
    if (!DOMAIN) {
        throw new PipedriveConfigError(
            "PIPEDRIVE_DOMAIN is not set. Add it to .env.local (server-only).",
        );
    }
    if (!API_TOKEN) {
        throw new PipedriveConfigError(
            "PIPEDRIVE_API_TOKEN is not set. Add it to .env.local (server-only).",
        );
    }
    return { domain: DOMAIN, token: API_TOKEN };
}

/**
 * Make a Pipedrive REST request. Path is the URL after `/v1/` (no leading
 * slash). Query params can be passed via `query` and will be url-encoded.
 * Throws `PipedriveApiError` on non-2xx; resolves with parsed JSON on success.
 */
export async function pipedriveFetch<T = unknown>(
    path: string,
    {
        method = "GET",
        query,
        body,
    }: {
        method?: "GET" | "POST" | "PUT" | "DELETE";
        query?: Record<string, string | number | boolean | undefined>;
        body?: unknown;
    } = {},
): Promise<T> {
    const { domain, token } = requireConfig();

    const params = new URLSearchParams({ api_token: token });
    if (query) {
        for (const [k, v] of Object.entries(query)) {
            if (v !== undefined && v !== null) params.set(k, String(v));
        }
    }

    const url = `https://${domain}.pipedrive.com/v1/${path}?${params.toString()}`;

    const res = await fetch(url, {
        method,
        headers: body ? { "Content-Type": "application/json" } : undefined,
        body: body ? JSON.stringify(body) : undefined,
        // Pipedrive responses must not be cached — they're per-request state.
        cache: "no-store",
    });

    let payload: unknown = null;
    try {
        payload = await res.json();
    } catch {
        /* non-JSON body — leave as null */
    }

    if (!res.ok) {
        throw new PipedriveApiError(
            `Pipedrive ${method} /${path} returned ${res.status}`,
            res.status,
            payload,
        );
    }

    return payload as T;
}
