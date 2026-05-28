import { NextResponse } from "next/server";
import { Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireDbRole } from "@/lib/auth";
import { PERMISSIONS, PERMISSION_KEYS } from "@/lib/rbac/permissions";
import { bustPermissionCache } from "@/lib/rbac/getPermissions";
import { ROLES, ROLE_LABELS } from "@/types/roles";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Gated by the ADMIN role (not a togglable permission) so an admin can never
// lock themselves out of the matrix that controls permissions.
function errResponse(err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg === "UNAUTHORIZED") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (msg === "FORBIDDEN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    console.error("[/api/admin/roles/permissions]", err);
    return NextResponse.json({ error: msg }, { status: 500 });
}

// GET — the registry + roles + current grants for the matrix.
export async function GET() {
    try {
        await requireDbRole([Role.ADMIN]);
        const rows = await prisma.rolePermission.findMany({
            where: { allowed: true },
            select: { role: true, permissionKey: true },
        });
        const grants: Record<string, string[]> = {};
        for (const role of ROLES) grants[role] = [];
        for (const r of rows) (grants[r.role] ??= []).push(r.permissionKey);

        return NextResponse.json({
            roles: ROLES,
            roleLabels: ROLE_LABELS,
            permissions: PERMISSIONS,
            grants,
        });
    } catch (err) {
        return errResponse(err);
    }
}

// POST — toggle one grant. Body: { role, permissionKey, allowed }.
export async function POST(req: Request) {
    try {
        const caller = await requireDbRole([Role.ADMIN]);
        const body = (await req.json()) as {
            role?: string;
            permissionKey?: string;
            allowed?: boolean;
        };
        const role = String(body.role ?? "").toUpperCase();
        const permissionKey = String(body.permissionKey ?? "");
        const allowed = !!body.allowed;

        if (!(ROLES as readonly string[]).includes(role)) {
            return NextResponse.json({ error: "Unknown role" }, { status: 400 });
        }
        if (!PERMISSION_KEYS.includes(permissionKey)) {
            return NextResponse.json({ error: "Unknown permission" }, { status: 400 });
        }

        await prisma.rolePermission.upsert({
            where: { role_permissionKey: { role: role as Role, permissionKey } },
            update: { allowed, updatedById: caller.id },
            create: { role: role as Role, permissionKey, allowed, updatedById: caller.id },
        });
        bustPermissionCache();

        return NextResponse.json({ ok: true });
    } catch (err) {
        return errResponse(err);
    }
}
