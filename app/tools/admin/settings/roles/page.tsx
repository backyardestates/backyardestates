import { Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { guardPageRole } from "@/lib/auth/guardPage";
import { PERMISSIONS } from "@/lib/rbac/permissions";
import { ROLES, ROLE_LABELS } from "@/types/roles";
import { RolesMatrix } from "./RolesMatrix";
import s from "./roles.module.css";

export const dynamic = "force-dynamic";

export default async function RolesPage() {
    await guardPageRole([Role.ADMIN], "/tools/admin/settings/roles");

    const rows = await prisma.rolePermission
        .findMany({ where: { allowed: true }, select: { role: true, permissionKey: true } })
        .catch(() => []);

    const grants: Record<string, string[]> = {};
    for (const role of ROLES) grants[role] = [];
    for (const r of rows) (grants[r.role] ??= []).push(r.permissionKey);

    return (
        <div className={s.shell}>
            <header className={s.header}>
                <h1 className={s.title}>Roles &amp; access</h1>
                <p className={s.subtitle}>
                    Toggle which tools and actions each role can use. Changes take effect right
                    away. Admins always have full access.
                </p>
            </header>
            <RolesMatrix
                roles={[...ROLES]}
                roleLabels={ROLE_LABELS}
                permissions={PERMISSIONS}
                initialGrants={grants}
            />
        </div>
    );
}
