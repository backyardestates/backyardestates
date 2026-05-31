import crypto from "node:crypto";

// Thin Dropbox Sign (HelloSign) client. Auth is HTTP Basic with the API key as
// the username and an empty password.
const API_BASE = "https://api.hellosign.com/v3";

export function isDropboxSignConfigured(): boolean {
    return !!process.env.DROPBOX_SIGN_API_KEY;
}

function authHeader(): string {
    const key = process.env.DROPBOX_SIGN_API_KEY ?? "";
    return "Basic " + Buffer.from(`${key}:`).toString("base64");
}

export interface SendSignatureInput {
    file: Buffer;
    fileName: string;
    fileType: string;
    signerEmail: string;
    signerName: string;
    title: string;
    subject?: string;
    message?: string;
    metadata?: Record<string, string>;
}

/** Send a single-signer signature request for the given document. */
export async function sendSignatureRequest(
    input: SendSignatureInput,
): Promise<{ signatureRequestId: string }> {
    if (!process.env.DROPBOX_SIGN_API_KEY) {
        throw new Error("DROPBOX_SIGN_API_KEY is not set.");
    }

    const form = new FormData();
    form.append("title", input.title);
    if (input.subject) form.append("subject", input.subject);
    if (input.message) form.append("message", input.message);
    form.append("signers[0][email_address]", input.signerEmail);
    form.append("signers[0][name]", input.signerName);
    // Default to test mode unless explicitly disabled (avoids accidental live sends).
    form.append("test_mode", process.env.DROPBOX_SIGN_TEST_MODE === "false" ? "0" : "1");
    for (const [k, v] of Object.entries(input.metadata ?? {})) {
        form.append(`metadata[${k}]`, v);
    }
    form.append(
        "file[0]",
        new Blob([new Uint8Array(input.file)], { type: input.fileType }),
        input.fileName,
    );

    const res = await fetch(`${API_BASE}/signature_request/send`, {
        method: "POST",
        headers: { Authorization: authHeader() },
        body: form,
    });
    if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(`Dropbox Sign send failed (${res.status})${text ? `: ${text}` : ""}`);
    }
    const data = (await res.json()) as {
        signature_request?: { signature_request_id?: string };
    };
    const id = data.signature_request?.signature_request_id;
    if (!id) throw new Error("Dropbox Sign returned no signature_request_id.");
    return { signatureRequestId: id };
}

/**
 * Download the executed (signed) PDF for a completed signature request.
 *
 * Right after the `all_signed` event the combined file can still be assembling;
 * Dropbox Sign answers with 409 ("file not ready") in that window, so we retry a
 * few times before giving up. Returns the raw PDF bytes.
 */
export async function downloadSignedPdf(signatureRequestId: string): Promise<Buffer> {
    if (!process.env.DROPBOX_SIGN_API_KEY) {
        throw new Error("DROPBOX_SIGN_API_KEY is not set.");
    }
    const url = `${API_BASE}/signature_request/files/${encodeURIComponent(
        signatureRequestId,
    )}?file_type=pdf`;

    let lastErr = "";
    for (let attempt = 0; attempt < 3; attempt++) {
        const res = await fetch(url, { headers: { Authorization: authHeader() } });
        if (res.ok) {
            return Buffer.from(await res.arrayBuffer());
        }
        lastErr = `${res.status} ${await res.text().catch(() => "")}`.trim();
        // 409 = still preparing; anything else is a hard failure.
        if (res.status !== 409) break;
        await new Promise((r) => setTimeout(r, 1500));
    }
    throw new Error(`Dropbox Sign file download failed: ${lastErr}`);
}

/**
 * Verify a Dropbox Sign event callback. The event_hash is HMAC-SHA256 of
 * (event_time + event_type) keyed by the API key.
 */
export function verifyEventHash(
    eventTime: string,
    eventType: string,
    eventHash: string,
): boolean {
    const key = process.env.DROPBOX_SIGN_API_KEY;
    if (!key || !eventHash) return false;
    const expected = crypto
        .createHmac("sha256", key)
        .update(`${eventTime}${eventType}`)
        .digest("hex");
    try {
        return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(eventHash));
    } catch {
        return false;
    }
}
