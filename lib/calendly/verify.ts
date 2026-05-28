import crypto from "node:crypto";

/**
 * Verify a Calendly webhook signature. Calendly sends a
 * `Calendly-Webhook-Signature: t=<unix>,v1=<hex>` header; the signed content is
 * `${t}.${rawBody}` HMAC-SHA256'd with the subscription's signing key.
 *
 * Returns true only when the key is configured AND the signature matches AND
 * the timestamp is within `toleranceSec` (replay guard).
 */
export function verifyCalendlySignature(
    rawBody: string,
    signatureHeader: string | null,
    signingKey: string | undefined,
    toleranceSec = 300,
): boolean {
    if (!signingKey || !signatureHeader) return false;

    const parts = Object.fromEntries(
        signatureHeader.split(",").map((kv) => {
            const [k, v] = kv.split("=");
            return [k?.trim(), v?.trim()];
        }),
    );
    const t = parts["t"];
    const v1 = parts["v1"];
    if (!t || !v1) return false;

    const ts = Number(t);
    if (!Number.isFinite(ts)) return false;
    if (Math.abs(Date.now() / 1000 - ts) > toleranceSec) return false;

    const expected = crypto
        .createHmac("sha256", signingKey)
        .update(`${t}.${rawBody}`)
        .digest("hex");

    try {
        return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(v1));
    } catch {
        return false;
    }
}
