import { NextResponse } from "next/server";
import { requireApiPermission } from "@/lib/rbac/getPermissions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST /api/consultations/stt-token
// Mints a short-lived (~30s) Deepgram token so the browser can open a live
// transcription WebSocket directly. The long-lived DEEPGRAM_API_KEY never
// leaves the server; the token is only valid long enough to establish the
// connection, after which the stream stays open for the session.
export async function POST() {
    const denied = await requireApiPermission("consultation.run");
    if (denied) return denied;

    const key = process.env.DEEPGRAM_API_KEY;
    if (!key) {
        return NextResponse.json(
            { error: "DEEPGRAM_API_KEY is not configured on this server." },
            { status: 503 },
        );
    }

    const res = await fetch("https://api.deepgram.com/v1/auth/grant", {
        method: "POST",
        headers: {
            Authorization: `Token ${key}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ ttl_seconds: 30 }),
    });

    if (!res.ok) {
        const text = await res.text().catch(() => "");
        // 403 here means the key can transcribe but can't mint short-lived
        // tokens — it needs the `keys:write` scope (an Owner/Admin key).
        const hint =
            res.status === 403
                ? " The DEEPGRAM_API_KEY lacks the 'keys:write' scope required to mint streaming tokens — use a key with key-management permission."
                : "";
        return NextResponse.json(
            { error: `Could not start transcription (${res.status})${text ? `: ${text}` : ""}.${hint}` },
            { status: 502 },
        );
    }

    const data = (await res.json()) as { access_token?: string; expires_in?: number };
    if (!data.access_token) {
        return NextResponse.json(
            { error: "Transcription token grant returned no access_token." },
            { status: 502 },
        );
    }

    return NextResponse.json({ token: data.access_token, expiresIn: data.expires_in ?? 30 });
}
