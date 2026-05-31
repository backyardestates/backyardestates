"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import s from "./ProposalRowMenu.module.css";

interface Props {
    /** Proposal's addressKey — used both as the route param and the API key. */
    addressKey: string | null;
    /** Customer name shown in the delete-confirmation dialog. */
    customerName?: string | null;
    /** When false, only View is offered (no edit / delete / present / export). */
    canBuild?: boolean;
    /** Current customer-share state — toggles the "Share with customer" item.
     *  Omit to default to a one-way "Share with customer" action. */
    sharedWithCustomer?: boolean;
    /** Optional className applied to the wrapper, for layout overrides. */
    className?: string;
}

/**
 * Row-level kebab ("⋯") menu for every proposal list (My Proposals, Admin
 * Recent, Admin Proposals). Single source of truth for the per-proposal
 * actions: Start Presentation · Download PDF · Edit · Delete.
 *
 * Each action lands the user in the master tool with the proposal hydrated
 * from `?address=`. The Present/Download variants also pass `autoPresent=1`
 * / `autoExport=1`, which the master tool reads and acts on after load.
 *
 * Delete calls the existing DELETE /api/admin/proposals/[addressKey] for
 * both SAVED and DRAFT, then refreshes the route.
 */
export function ProposalRowMenu({ addressKey, customerName, canBuild = true, sharedWithCustomer, className }: Props) {
    const [open, setOpen] = useState(false);
    const [busy, setBusy] = useState(false);
    const wrapRef = useRef<HTMLDivElement | null>(null);
    const router = useRouter();

    // Close on outside click + Escape.
    useEffect(() => {
        if (!open) return;
        function onDoc(e: MouseEvent) {
            if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
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

    if (!addressKey) {
        return <span className={s.disabled}>—</span>;
    }

    function buildUrl(extra: Record<string, string>): string {
        const params = new URLSearchParams({ address: addressKey!, ...extra });
        return `/tools/admin/master?${params.toString()}`;
    }

    function navTo(extra: Record<string, string>) {
        setOpen(false);
        router.push(buildUrl(extra));
    }

    async function handleShare() {
        setOpen(false);
        const next = !sharedWithCustomer;
        setBusy(true);
        try {
            const res = await fetch(
                `/api/admin/proposals/${encodeURIComponent(addressKey!)}/share`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ shared: next }),
                },
            );
            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                throw new Error(data.error || `Request failed (${res.status})`);
            }
            router.refresh();
        } catch (err) {
            window.alert(`Couldn't update sharing: ${err instanceof Error ? err.message : String(err)}`);
        } finally {
            setBusy(false);
        }
    }

    async function handleDelete() {
        setOpen(false);
        const label = customerName?.trim() || "this proposal";
        if (!window.confirm(`Delete the proposal for ${label}? This cannot be undone.`)) {
            return;
        }
        setBusy(true);
        try {
            // Proposals can exist as SAVED, DRAFT, or both — try each.
            await Promise.all([
                fetch(`/api/admin/proposals/${encodeURIComponent(addressKey!)}?status=SAVED`, { method: "DELETE" }),
                fetch(`/api/admin/proposals/${encodeURIComponent(addressKey!)}?status=DRAFT`, { method: "DELETE" }),
            ]);
            router.refresh();
        } catch (err) {
            window.alert(`Failed to delete: ${err instanceof Error ? err.message : String(err)}`);
        } finally {
            setBusy(false);
        }
    }

    return (
        <div ref={wrapRef} className={`${s.wrap} ${className ?? ""}`}>
            <button
                type="button"
                className={s.trigger}
                aria-haspopup="menu"
                aria-expanded={open}
                aria-label="Proposal actions"
                disabled={busy}
                onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setOpen((v) => !v);
                }}
            >
                {busy ? "…" : "⋯"}
            </button>

            {open && (
                <div role="menu" className={s.menu}>
                    {canBuild && (
                        <button
                            role="menuitem"
                            type="button"
                            className={s.item}
                            onClick={() => navTo({ autoPresent: "1" })}
                        >
                            <span className={s.itemIcon}>▶</span>
                            Start presentation
                        </button>
                    )}
                    {canBuild && (
                        <button
                            role="menuitem"
                            type="button"
                            className={s.item}
                            onClick={() => navTo({ autoExport: "1" })}
                        >
                            <span className={s.itemIcon}>⬇</span>
                            Download PDF
                        </button>
                    )}
                    <button
                        role="menuitem"
                        type="button"
                        className={s.item}
                        onClick={() => navTo({})}
                    >
                        <span className={s.itemIcon}>{canBuild ? "✎" : "👁"}</span>
                        {canBuild ? "Edit" : "View"}
                    </button>
                    {canBuild && (
                        <>
                            <div className={s.divider} role="separator" />
                            <button
                                role="menuitem"
                                type="button"
                                className={s.item}
                                onClick={handleShare}
                            >
                                <span className={s.itemIcon}>{sharedWithCustomer ? "🔒" : "🔗"}</span>
                                {sharedWithCustomer ? "Stop customer access" : "Share with customer"}
                            </button>
                            <button
                                role="menuitem"
                                type="button"
                                className={`${s.item} ${s.itemDanger}`}
                                onClick={handleDelete}
                            >
                                <span className={s.itemIcon}>✕</span>
                                Delete
                            </button>
                        </>
                    )}
                </div>
            )}
        </div>
    );
}
