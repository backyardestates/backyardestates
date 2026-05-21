// Server-side auth guard for API route handlers.
//
// Middleware already gates /tools/* and /api/admin/* by role, but the
// /api/rentcast/** and /api/hasdata/** endpoints aren't covered by any
// middleware matcher — so we add an inline auth check inside each handler
// to make sure unauthenticated callers can't burn through our (paid)
// third-party API quotas.
//
// Usage:
//   export async function GET(req: Request) {
//       const guard = await requireRole(["ADMIN", "ARCHITECT"]);
//       if (guard) return guard;          // 401 / 403 response
//       …rest of handler
//   }

import { auth } from "@clerk/nextjs/server";
import { normalizeRole, type AppRole } from "../../types/roles";

/**
 * Verifies the caller is signed in AND has one of the allowed roles.
 * Returns a `Response` to short-circuit the handler when not allowed,
 * or `null` when the caller is authorized.
 */
export async function requireRole(allowed: AppRole[]): Promise<Response | null> {
    const { userId, sessionClaims } = await auth();
    if (!userId) {
        return new Response(
            JSON.stringify({ error: "Unauthorized" }),
            { status: 401, headers: { "Content-Type": "application/json" } }
        );
    }
    const role = normalizeRole((sessionClaims as { role?: unknown } | null)?.role);
    if (!allowed.includes(role)) {
        return new Response(
            JSON.stringify({ error: "Forbidden", need: allowed }),
            { status: 403, headers: { "Content-Type": "application/json" } }
        );
    }
    return null;
}
