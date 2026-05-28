import { redirect } from "next/navigation";
import { Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getDbUser } from "@/lib/auth";

// Permissions change rarely (only via the admin matrix), so cache the resolved
// set per role for a short TTL to keep checks cheap. The matrix save calls
// bustPermissionCache() so changes take effect immediately, no redeploy.
const TTL_MS = 30_000;
const cache = new Map<Role, { perms: Set<string>; at: number }>();

export function bustPermissionCache(): void {
    cache.clear();
}

/** Resolve the effective permission set for a role from RolePermission grants. */
export async function getPermissions(role: Role): Promise<Set<string>> {
    const hit = cache.get(role);
    if (hit && Date.now() - hit.at < TTL_MS) return hit.perms;

    const rows = await prisma.rolePermission.findMany({
        where: { role, allowed: true },
        select: { permissionKey: true },
    });
    const perms = new Set(rows.map((r) => r.permissionKey));
    cache.set(role, { perms, at: Date.now() });
    return perms;
}

export async function can(role: Role, key: string): Promise<boolean> {
    return (await getPermissions(role)).has(key);
}

/**
 * Server-side guard for route handlers / actions. Throws UNAUTHORIZED (no
 * session) or FORBIDDEN (missing permission). Returns the DB user on success.
 */
export async function requirePermission(key: string) {
    const dbUser = await getDbUser(); // throws UNAUTHORIZED if not signed in
    const perms = await getPermissions(dbUser.role);
    if (!perms.has(key)) throw new Error("FORBIDDEN");
    return dbUser;
}

/**
 * Server-component page guard (mirrors guardPageRole): redirects to sign-in /
 * access-denied instead of throwing.
 */
export async function guardPagePermission(key: string, from: string) {
    try {
        return await requirePermission(key);
    } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        if (msg === "UNAUTHORIZED") {
            redirect(`/sign-in?redirect_url=${encodeURIComponent(from)}`);
        }
        const params = new URLSearchParams();
        params.set("need", key);
        params.set("from", from);
        redirect(`/access-denied?${params.toString()}`);
    }
}

/**
 * API-route guard (mirrors requireRole). Returns a Response to short-circuit
 * when not allowed, or null when authorized.
 */
export async function requireApiPermission(key: string): Promise<Response | null> {
    try {
        await requirePermission(key);
        return null;
    } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        const status = msg === "UNAUTHORIZED" ? 401 : 403;
        return new Response(JSON.stringify({ error: status === 401 ? "Unauthorized" : "Forbidden", need: key }), {
            status,
            headers: { "Content-Type": "application/json" },
        });
    }
}
