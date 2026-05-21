// Magic-link style one-click role-assignment URLs.
//
// The signup notification email contains buttons like "Make Admin" that link
// directly to /api/admin/users/role-link?...&sig=… — the recipient doesn't
// need to be signed in. Security comes from:
//   1. HMAC-SHA256 over (userId | role | exp) using a server-side secret.
//      Tampering with userId/role/exp invalidates the signature.
//   2. Short expiry (default 7 days). Old emails stop working.
//   3. The secret never leaves the server.
//
// The shared secret comes from SIGNUP_LINK_SECRET, falling back to
// CLERK_WEBHOOK_SECRET (which the same webhook already requires) so admins
// don't have to provision yet another env var to get this working.

import crypto from "node:crypto";
import type { AppRole } from "../../types/roles";

const DEFAULT_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 days

function getSecret(): string {
    const secret = process.env.SIGNUP_LINK_SECRET ?? process.env.CLERK_WEBHOOK_SECRET ?? "";
    if (!secret) {
        throw new Error(
            "signedRoleLink: no SIGNUP_LINK_SECRET or CLERK_WEBHOOK_SECRET configured"
        );
    }
    return secret;
}

function sign(userId: string, role: AppRole, exp: number): string {
    const payload = `${userId}|${role}|${exp}`;
    return crypto.createHmac("sha256", getSecret()).update(payload).digest("hex");
}

/** Build a fully-qualified URL the email can render as a button. */
export function buildRoleLink(args: {
    baseUrl: string;
    userId: string;
    role: AppRole;
    ttlSeconds?: number;
}): string {
    const exp = Math.floor(Date.now() / 1000) + (args.ttlSeconds ?? DEFAULT_TTL_SECONDS);
    const sig = sign(args.userId, args.role, exp);
    const params = new URLSearchParams({
        u: args.userId,
        r: args.role,
        exp: String(exp),
        sig,
    });
    return `${args.baseUrl.replace(/\/$/, "")}/api/admin/users/role-link?${params.toString()}`;
}

/** Verify a presented userId/role/exp/sig tuple. Constant-time compare. */
export function verifyRoleLink(args: {
    userId: string;
    role: string;
    exp: string;
    sig: string;
}): { ok: true; role: AppRole } | { ok: false; reason: string } {
    const expNum = Number(args.exp);
    if (!Number.isFinite(expNum)) return { ok: false, reason: "Bad exp" };
    if (expNum < Math.floor(Date.now() / 1000)) {
        return { ok: false, reason: "Link expired" };
    }

    const role = args.role.toUpperCase();
    if (role !== "ADMIN" && role !== "ARCHITECT" && role !== "CUSTOMER") {
        return { ok: false, reason: "Bad role" };
    }

    let expected: string;
    try {
        expected = sign(args.userId, role as AppRole, expNum);
    } catch (err) {
        return { ok: false, reason: err instanceof Error ? err.message : "Sign failed" };
    }
    if (
        args.sig.length !== expected.length ||
        !crypto.timingSafeEqual(Buffer.from(args.sig), Buffer.from(expected))
    ) {
        return { ok: false, reason: "Invalid signature" };
    }
    return { ok: true, role: role as AppRole };
}
