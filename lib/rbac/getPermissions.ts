import { redirect } from "next/navigation";
import { Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getDbUser } from "@/lib/auth";
import { ROLE_PERMISSION_DEFAULTS, PERMISSION_KEYS } from "@/lib/rbac/permissions";

// Permissions change rarely (only via the admin matrix), so cache the resolved
// set per role for a short TTL to keep checks cheap. The matrix save calls
// bustPermissionCache() so changes take effect immediately, no redeploy.
const TTL_MS = 30_000;
const cache = new Map<Role, { perms: Set<string>; at: number }>();

export function bustPermissionCache(): void {
    cache.clear();
}

/**
 * Resolve the effective permission set for a role. Lockout-safe: if a role has
 * NO RolePermission rows at all (unseeded DB), fall back to the code defaults so
 * staff never lose access just because the seed hasn't run. Once any row exists
 * for the role (i.e. it's been seeded or edited in the matrix), the DB is
 * authoritative — including a role with everything toggled off.
 */
export async function getPermissions(role: Role): Promise<Set<string>> {
    // ADMIN is a superuser: it always holds every capability (engagements, FPA,
    // proposals, settings, …). Resolving this in code rather than from the
    // RolePermission table means an admin can never be locked out of a tool by a
    // matrix edit or an unseeded/missing table.
    if (role === Role.ADMIN) return new Set(PERMISSION_KEYS);

    const hit = cache.get(role);
    if (hit && Date.now() - hit.at < TTL_MS) return hit.perms;

    const rows = await prisma.rolePermission.findMany({
        where: { role },
        select: { permissionKey: true, allowed: true },
    });
    const perms =
        rows.length === 0
            ? new Set(ROLE_PERMISSION_DEFAULTS[role] ?? [])
            : new Set(rows.filter((r) => r.allowed).map((r) => r.permissionKey));

    cache.set(role, { perms, at: Date.now() });
    return perms;
}

export async function can(role: Role, key: string): Promise<boolean> {
    return (await getPermissions(role)).has(key);
}

export async function canAny(role: Role, keys: string[]): Promise<boolean> {
    const perms = await getPermissions(role);
    return keys.some((k) => perms.has(k));
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

/** Like requirePermission, but passes if the user has ANY of the keys. */
export async function requireAnyPermission(keys: string[]) {
    const dbUser = await getDbUser();
    const perms = await getPermissions(dbUser.role);
    if (!keys.some((k) => perms.has(k))) throw new Error("FORBIDDEN");
    return dbUser;
}

/** Page guard variant that passes if the user has ANY of the keys. */
export async function guardPageAnyPermission(keys: string[], from: string) {
    try {
        return await requireAnyPermission(keys);
    } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        if (msg === "UNAUTHORIZED") {
            redirect(`/sign-in?redirect_url=${encodeURIComponent(from)}`);
        }
        const params = new URLSearchParams();
        params.set("need", keys.join(","));
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
