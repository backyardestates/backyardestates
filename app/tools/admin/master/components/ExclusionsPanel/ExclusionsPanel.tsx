// Proposal-wide exclusions editor — structured line items (name + price + note).
//
// Lives in the Estimator step. Each exclusion is a carve-out that shows on the
// comparison slide as small "Not included" text and is listed on the generated
// agreement. State lives in AdminMasterClient and is persisted in the proposal
// snapshot, so each proposal carries its own exclusions.
//
// Styled to visually "pop" (amber accent rail + heading) so it isn't lost
// among the site-work rows above it.

"use client";

import React from "react";
import type { ExclusionItem } from "@/lib/store/presentationStore";
import s from "./ExclusionsPanel.module.css";

interface Props {
    value: ExclusionItem[];
    onChange: (next: ExclusionItem[]) => void;
}

function newId(): string {
    return (typeof crypto !== "undefined" && "randomUUID" in crypto)
        ? crypto.randomUUID()
        : `excl_${Date.now()}_${Math.round(Math.random() * 1e6)}`;
}

export function ExclusionsPanel({ value, onChange }: Props) {
    const items = value ?? [];
    const activeCount = items.filter((e) => e.name.trim().length > 0).length;

    function add() {
        onChange([...items, { id: newId(), name: "", price: 0, note: "" }]);
    }

    function update(id: string, patch: Partial<ExclusionItem>) {
        onChange(items.map((e) => (e.id === id ? { ...e, ...patch } : e)));
    }

    function remove(id: string) {
        onChange(items.filter((e) => e.id !== id));
    }

    return (
        <section className={s.root}>
            <header className={s.header}>
                <span className={s.titleWrap}>
                    <span className={s.badge} aria-hidden>
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="9" />
                            <path d="M15 9l-6 6M9 9l6 6" />
                        </svg>
                    </span>
                    <span className={s.title}>Exclusions</span>
                    {activeCount > 0 && <span className={s.count}>{activeCount}</span>}
                </span>
                <button type="button" className={s.addBtn} onClick={add}>
                    <span aria-hidden>+</span> Add exclusion
                </button>
            </header>

            <p className={s.hint}>
                Carve-outs shown under the comparison on the presentation (small print)
                and listed on the agreement. Give each a name, an optional price, and a
                short reason.
            </p>

            {items.length === 0 ? (
                <button type="button" className={s.empty} onClick={add}>
                    No exclusions yet — <strong>add one</strong> (e.g. &ldquo;Solar panels&rdquo;,
                    &ldquo;Refrigerator&rdquo;).
                </button>
            ) : (
                <div className={s.list}>
                    <div className={s.rowHead}>
                        <span>Item</span>
                        <span>Price</span>
                        <span>Reason / note</span>
                        <span />
                    </div>
                    {items.map((e) => {
                        const active = e.name.trim().length > 0;
                        return (
                            <div key={e.id} className={`${s.row} ${active ? s.rowActive : ""}`}>
                                <input
                                    className={s.nameInput}
                                    type="text"
                                    placeholder="Solar panels"
                                    value={e.name}
                                    onChange={(ev) => update(e.id, { name: ev.target.value })}
                                />
                                <div className={s.moneyWrap}>
                                    <span className={s.moneyPrefix}>$</span>
                                    <input
                                        className={s.priceInput}
                                        type="text"
                                        inputMode="numeric"
                                        placeholder="0"
                                        value={e.price === 0 ? "" : String(e.price)}
                                        onChange={(ev) => {
                                            const n = parseFloat(ev.target.value.replace(/[^0-9.]/g, ""));
                                            update(e.id, { price: Number.isFinite(n) ? Math.max(0, n) : 0 });
                                        }}
                                    />
                                </div>
                                <input
                                    className={s.noteInput}
                                    type="text"
                                    placeholder="Can be added later"
                                    value={e.note}
                                    onChange={(ev) => update(e.id, { note: ev.target.value })}
                                />
                                <button
                                    type="button"
                                    className={s.removeBtn}
                                    onClick={() => remove(e.id)}
                                    aria-label={`Remove ${e.name || "exclusion"}`}
                                    title="Remove"
                                >
                                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden>
                                        <path d="M6 6l12 12M18 6L6 18" />
                                    </svg>
                                </button>
                            </div>
                        );
                    })}
                </div>
            )}
        </section>
    );
}
