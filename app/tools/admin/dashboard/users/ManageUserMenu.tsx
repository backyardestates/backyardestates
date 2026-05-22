"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Role } from "@prisma/client";
import s from "./users.module.css";

interface Props {
    userId: string;
    displayName: string;
    currentRole: Role;
    /** True when the row is the signed-in admin. Disables both
     *  role-change and delete actions on themselves. */
    isSelf: boolean;
}

interface DeleteBlocker {
    field: string;
    count: number;
    label: string;
}

const ALL_ROLES: Role[] = [Role.CUSTOMER, Role.ARCHITECT, Role.ADMIN];

export function ManageUserMenu({ userId, displayName, currentRole, isSelf }: Props) {
    const router = useRouter();
    const [open, setOpen] = useState(false);
    const [optimisticRole, setOptimisticRole] = useState<Role>(currentRole);
    const [pending, startTransition] = useTransition();
    const [error, setError] = useState<string | null>(null);

    const wrapRef = useRef<HTMLDivElement | null>(null);

    // Close on outside click + Escape
    useEffect(() => {
        if (!open) return;
        function onDoc(e: MouseEvent) {
            if (!wrapRef.current) return;
            if (!wrapRef.current.contains(e.target as Node)) setOpen(false);
        }
        function onKey(e: KeyboardEvent) {
            if (e.key === "Escape") setOpen(false);
        }
        document.addEventListener("mousedown", onDoc);
        document.addEventListener("keydown", onKey);
        return () => {
            document.removeEventListener("mousedown", onDoc);
            document.removeEventListener("keydown", onKey);
        };
    }, [open]);

    function changeRole(next: Role) {
        if (isSelf) return;
        if (next === optimisticRole) return;
        if (
            !window.confirm(
                `Change ${displayName}'s role to ${next}? They'll need to sign out and back in to see the change.`
            )
        ) {
            return;
        }
        const previous = optimisticRole;
        setOptimisticRole(next);
        setError(null);
        startTransition(async () => {
            try {
                const res = await fetch(`/api/admin/users/${userId}/role`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ role: next }),
                });
                if (!res.ok) {
                    const data = await res.json().catch(() => ({}));
                    throw new Error(data.error ?? `Request failed (${res.status})`);
                }
                router.refresh();
            } catch (err) {
                setOptimisticRole(previous);
                setError(err instanceof Error ? err.message : "Update failed");
            }
        });
    }

    function deleteUser() {
        if (isSelf) return;
        const confirmed = window.confirm(
            `Delete ${displayName}?\n\n` +
            `This removes their Clerk account AND the local DB row.\n` +
            `If they've created proposals or feasibility reports the delete will be refused — ` +
            `you'd need to transfer those first.\n\n` +
            `This action cannot be undone.`
        );
        if (!confirmed) return;
        setError(null);

        startTransition(async () => {
            try {
                const res = await fetch(`/api/admin/users/${userId}`, { method: "DELETE" });
                if (res.status === 409) {
                    const data = (await res.json().catch(() => ({}))) as { blockers?: DeleteBlocker[] };
                    const lines = (data.blockers ?? [])
                        .map((b) => `  • ${b.count} ${b.label}`)
                        .join("\n");
                    window.alert(
                        `Can't delete ${displayName} — they have linked data:\n\n` +
                        `${lines}\n\n` +
                        `Remove or transfer these records first, then try again.`
                    );
                    return;
                }
                if (!res.ok) {
                    const data = (await res.json().catch(() => ({}))) as { error?: string };
                    throw new Error(data.error ?? `Request failed (${res.status})`);
                }
                setOpen(false);
                router.refresh();
            } catch (err) {
                const msg = err instanceof Error ? err.message : "Delete failed";
                setError(msg);
                window.alert(`Delete failed: ${msg}`);
            }
        });
    }

    if (isSelf) {
        return (
            <span className={s.manageBtnDisabled} title="You can't manage your own account here.">
                You
            </span>
        );
    }

    return (
        <div className={s.manageWrap} ref={wrapRef}>
            <button
                type="button"
                className={s.manageBtn}
                onClick={() => setOpen((v) => !v)}
                disabled={pending}
                aria-haspopup="menu"
                aria-expanded={open}
            >
                {pending ? "Working…" : "Manage"}
                <span className={s.manageCaret} aria-hidden>▾</span>
            </button>

            {open && (
                <div className={s.manageMenu} role="menu">
                    <div className={s.manageHeader}>
                        <span className={s.manageHeaderName}>{displayName}</span>
                        <span className={s.manageHeaderRole}>Current: {optimisticRole}</span>
                    </div>

                    <div className={s.manageGroup}>
                        <div className={s.manageGroupLabel}>Change role</div>
                        {ALL_ROLES.map((r) => (
                            <button
                                key={r}
                                type="button"
                                role="menuitemradio"
                                aria-checked={optimisticRole === r}
                                className={`${s.manageItem} ${optimisticRole === r ? s.manageItemActive : ""}`}
                                onClick={() => changeRole(r)}
                                disabled={pending || optimisticRole === r}
                            >
                                <span className={`${s.rolePill} ${s[`role_${r}`] ?? ""}`}>{r}</span>
                                {optimisticRole === r && <span className={s.manageCheck}>✓</span>}
                            </button>
                        ))}
                    </div>

                    <div className={s.manageDivider} />

                    <button
                        type="button"
                        role="menuitem"
                        className={`${s.manageItem} ${s.manageItemDanger}`}
                        onClick={deleteUser}
                        disabled={pending}
                    >
                        Delete user…
                    </button>

                    {error && <div className={s.manageError}>⚠ {error}</div>}
                </div>
            )}
        </div>
    );
}
