import { redirect } from "next/navigation";
import { Role, User } from "@prisma/client";
import { requireDbRole } from "@/lib/auth";

/**
 * Server-component auth guard. Wraps requireDbRole and converts thrown
 * UNAUTHORIZED/FORBIDDEN errors into friendly redirects:
 *
 *   - UNAUTHORIZED → /sign-in?redirect_url=<from>
 *   - FORBIDDEN    → /access-denied?need=<roles>&from=<from>
 *
 * On success returns the DB User row, ready for the page to use.
 *
 * Usage:
 *   const me = await guardPageRole([Role.ADMIN], "/tools/admin/dashboard");
 */
export async function guardPageRole(
    allowed: Role[],
    from: string,
): Promise<User> {
    try {
        return await requireDbRole(allowed);
    } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        if (msg === "UNAUTHORIZED") {
            redirect(`/sign-in?redirect_url=${encodeURIComponent(from)}`);
        }
        if (msg === "FORBIDDEN") {
            const params = new URLSearchParams();
            params.set("need", allowed.join(","));
            params.set("from", from);
            redirect(`/access-denied?${params.toString()}`);
        }
        throw err;
    }
}
