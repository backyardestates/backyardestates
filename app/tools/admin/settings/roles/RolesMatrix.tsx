"use client";

import { useState, Fragment } from "react";
import type { PermissionDef } from "@/lib/rbac/permissions";
import s from "./roles.module.css";

export function RolesMatrix({
    roles,
    roleLabels,
    permissions,
    initialGrants,
}: {
    roles: string[];
    roleLabels: Record<string, string>;
    permissions: PermissionDef[];
    initialGrants: Record<string, string[]>;
}) {
    const [grants, setGrants] = useState<Record<string, Set<string>>>(() => {
        const m: Record<string, Set<string>> = {};
        for (const r of roles) m[r] = new Set(initialGrants[r] ?? []);
        return m;
    });
    const [error, setError] = useState<string | null>(null);
    const [savedAt, setSavedAt] = useState<string | null>(null);

    // Group permissions in registry order.
    const groups: { group: string; perms: PermissionDef[] }[] = [];
    for (const p of permissions) {
        let g = groups.find((x) => x.group === p.group);
        if (!g) {
            g = { group: p.group, perms: [] };
            groups.push(g);
        }
        g.perms.push(p);
    }

    function setGrant(role: string, key: string, on: boolean) {
        setGrants((prev) => {
            const copy: Record<string, Set<string>> = {};
            for (const r of roles) copy[r] = new Set(prev[r]);
            if (on) copy[role].add(key);
            else copy[role].delete(key);
            return copy;
        });
    }

    async function toggle(role: string, key: string, next: boolean) {
        setError(null);
        setGrant(role, key, next); // optimistic
        try {
            const res = await fetch("/api/admin/roles/permissions", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ role, permissionKey: key, allowed: next }),
            });
            if (!res.ok) {
                const d = await res.json().catch(() => ({}));
                throw new Error(d.error || "Save failed");
            }
            setSavedAt(new Date().toLocaleTimeString());
        } catch (e) {
            setGrant(role, key, !next); // revert
            setError(e instanceof Error ? e.message : String(e));
        }
    }

    return (
        <>
            {savedAt && <p className={s.savedNote}>Saved {savedAt}</p>}
            {error && <p className={s.error}>{error}</p>}
            <div className={s.tableWrap}>
                <table className={s.table}>
                    <thead>
                        <tr>
                            <th className={s.permCol}>Permission</th>
                            {roles.map((r) => (
                                <th key={r}>{roleLabels[r] ?? r}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {groups.map((g) => (
                            <Fragment key={g.group}>
                                <tr className={s.groupRow}>
                                    <td colSpan={roles.length + 1}>{g.group}</td>
                                </tr>
                                {g.perms.map((p) => (
                                    <tr key={p.key}>
                                        <td className={s.permCol}>
                                            <span className={s.permLabel}>{p.label}</span>
                                            <span className={s.permKey}>{p.key}</span>
                                        </td>
                                        {roles.map((r) => {
                                            // ADMIN always has everything — locked on to prevent self-lockout.
                                            const isAdmin = r === "ADMIN";
                                            const checked = isAdmin || grants[r].has(p.key);
                                            return (
                                                <td key={r} className={s.cell}>
                                                    <input
                                                        type="checkbox"
                                                        checked={checked}
                                                        disabled={isAdmin}
                                                        onChange={(e) => toggle(r, p.key, e.target.checked)}
                                                    />
                                                </td>
                                            );
                                        })}
                                    </tr>
                                ))}
                            </Fragment>
                        ))}
                    </tbody>
                </table>
            </div>
        </>
    );
}
