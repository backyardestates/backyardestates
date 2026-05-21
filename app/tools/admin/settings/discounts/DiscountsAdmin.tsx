"use client";

import React, { useState } from "react";
import type { DiscountPreset } from "@prisma/client";

type SaveState =
    | { kind: "idle" }
    | { kind: "saving" }
    | { kind: "saved"; at: number }
    | { kind: "error"; message: string };

type DiscountForm = {
    label: string;
    slug: string;
    amount: number;
    sortOrder: number;
    active: boolean;
    notes: string;
};

function money(n: number) {
    if (!Number.isFinite(n)) return "—";
    return n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}

function toForm(d: DiscountPreset): DiscountForm {
    return {
        label: d.label,
        slug: d.slug,
        amount: d.amount,
        sortOrder: d.sortOrder,
        active: d.active,
        notes: d.notes ?? "",
    };
}

export function DiscountsAdmin({ initialDiscounts }: { initialDiscounts: DiscountPreset[] }) {
    const [items, setItems] = useState<DiscountPreset[]>(initialDiscounts);
    const [adding, setAdding] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [save, setSave] = useState<SaveState>({ kind: "idle" });

    async function refresh() {
        const res = await fetch("/api/admin/settings/discounts");
        if (res.ok) {
            const data = await res.json();
            setItems(data.discounts ?? []);
        }
    }

    async function handleCreate(payload: DiscountForm) {
        setSave({ kind: "saving" });
        try {
            const res = await fetch("/api/admin/settings/discounts", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            if (!res.ok) throw new Error((await res.json())?.error ?? `HTTP ${res.status}`);
            await refresh();
            setAdding(false);
            setSave({ kind: "saved", at: Date.now() });
        } catch (err) {
            setSave({ kind: "error", message: err instanceof Error ? err.message : String(err) });
        }
    }

    async function handleUpdate(id: string, patch: Partial<DiscountForm>) {
        setSave({ kind: "saving" });
        try {
            const res = await fetch(`/api/admin/settings/discounts/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(patch),
            });
            if (!res.ok) throw new Error((await res.json())?.error ?? `HTTP ${res.status}`);
            await refresh();
            setEditingId(null);
            setSave({ kind: "saved", at: Date.now() });
        } catch (err) {
            setSave({ kind: "error", message: err instanceof Error ? err.message : String(err) });
        }
    }

    async function handleDelete(id: string, label: string) {
        if (!confirm(`Delete "${label}"? This cannot be undone.`)) return;
        setSave({ kind: "saving" });
        try {
            const res = await fetch(`/api/admin/settings/discounts/${id}`, { method: "DELETE" });
            if (!res.ok) throw new Error((await res.json())?.error ?? `HTTP ${res.status}`);
            await refresh();
            setSave({ kind: "saved", at: Date.now() });
        } catch (err) {
            setSave({ kind: "error", message: err instanceof Error ? err.message : String(err) });
        }
    }

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span
                    style={{
                        fontSize: 13,
                        color: save.kind === "error" ? "#b8503e" : save.kind === "saved" ? "#1f7a4f" : "#8A8278",
                    }}
                >
                    {save.kind === "saving" && "Saving…"}
                    {save.kind === "saved" && `Saved at ${new Date(save.at).toLocaleTimeString()}`}
                    {save.kind === "error" && `Error: ${save.message}`}
                    {save.kind === "idle" && `${items.length} discount${items.length === 1 ? "" : "s"} in catalog`}
                </span>
                <button
                    onClick={() => { setAdding(true); setEditingId(null); }}
                    style={btnPrimary}
                >
                    + Add discount
                </button>
            </div>

            {/* Table header */}
            <div
                style={{
                    display: "grid",
                    gridTemplateColumns: "1.6fr 1fr 110px 80px 80px 88px 88px",
                    gap: 10,
                    padding: "8px 14px",
                    fontSize: 10,
                    letterSpacing: "0.16em",
                    textTransform: "uppercase",
                    color: "#8A8278",
                    fontWeight: 700,
                }}
            >
                <span>Label</span>
                <span>Slug</span>
                <span style={{ textAlign: "right" }}>Amount</span>
                <span style={{ textAlign: "center" }}>Sort</span>
                <span style={{ textAlign: "center" }}>Active</span>
                <span />
                <span />
            </div>

            {/* Add new row */}
            {adding && (
                <DiscountRowForm
                    initial={{ label: "", slug: "", amount: 0, sortOrder: items.length, active: true, notes: "" }}
                    onSubmit={handleCreate}
                    onCancel={() => setAdding(false)}
                />
            )}

            {/* Rows */}
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {items.map((d) =>
                    editingId === d.id ? (
                        <DiscountRowForm
                            key={d.id}
                            initial={toForm(d)}
                            onSubmit={(payload) => handleUpdate(d.id, payload)}
                            onCancel={() => setEditingId(null)}
                        />
                    ) : (
                        <DiscountRow
                            key={d.id}
                            discount={d}
                            onEdit={() => { setEditingId(d.id); setAdding(false); }}
                            onDelete={() => handleDelete(d.id, d.label)}
                        />
                    )
                )}
            </div>
        </div>
    );
}

function DiscountRow({
    discount,
    onEdit,
    onDelete,
}: {
    discount: DiscountPreset;
    onEdit: () => void;
    onDelete: () => void;
}) {
    return (
        <div
            style={{
                display: "grid",
                gridTemplateColumns: "1.6fr 1fr 110px 80px 80px 88px 88px",
                gap: 10,
                alignItems: "center",
                padding: "12px 14px",
                background: "#fff",
                border: "1px solid #e5e1d8",
                borderRadius: 8,
                fontSize: 13,
                color: "#14302F",
            }}
        >
            <span style={{ fontWeight: 600 }}>
                {discount.label}
                {discount.notes && (
                    <span style={{ display: "block", fontSize: 11, color: "#8A8278", fontStyle: "italic", marginTop: 2 }}>
                        {discount.notes}
                    </span>
                )}
            </span>
            <span style={{ fontSize: 11, color: "#8A8278", letterSpacing: "0.08em" }}>{discount.slug}</span>
            <span style={{ textAlign: "right", fontVariantNumeric: "tabular-nums", color: "#B8954A", fontWeight: 700 }}>
                {money(discount.amount)}
            </span>
            <span style={{ textAlign: "center", color: "#8A8278", fontVariantNumeric: "tabular-nums" }}>
                {discount.sortOrder}
            </span>
            <span style={{ textAlign: "center" }}>
                {discount.active ? (
                    <span style={{ color: "#1f7a4f", fontSize: 11, fontWeight: 700 }}>YES</span>
                ) : (
                    <span style={{ color: "#b8503e", fontSize: 11, fontWeight: 700 }}>NO</span>
                )}
            </span>
            <button onClick={onEdit} style={btnSecondarySm}>Edit</button>
            <button onClick={onDelete} style={btnDangerSm}>Delete</button>
        </div>
    );
}

function DiscountRowForm({
    initial,
    onSubmit,
    onCancel,
}: {
    initial: DiscountForm;
    onSubmit: (payload: DiscountForm) => void | Promise<void>;
    onCancel: () => void;
}) {
    const [v, setV] = useState<DiscountForm>(initial);
    function update<K extends keyof DiscountForm>(k: K, val: DiscountForm[K]) {
        setV((prev) => ({ ...prev, [k]: val }));
    }
    return (
        <form
            onSubmit={(e) => { e.preventDefault(); onSubmit(v); }}
            style={{
                display: "flex",
                flexDirection: "column",
                gap: 12,
                padding: "14px 16px",
                background: "#fff8eb",
                border: "1px solid #d4c4a0",
                borderRadius: 10,
            }}
        >
            <div
                style={{
                    display: "grid",
                    gridTemplateColumns: "1.6fr 1fr 110px 80px 80px 88px 88px",
                    gap: 10,
                    alignItems: "center",
                }}
            >
                <input
                    autoFocus
                    value={v.label}
                    onChange={(e) => update("label", e.target.value)}
                    placeholder="Label (e.g. Solar Panels)"
                    required
                    style={inputStyle}
                />
                <input
                    value={v.slug}
                    onChange={(e) => update("slug", e.target.value)}
                    placeholder="auto-from-label"
                    style={inputStyle}
                />
                <input
                    type="number"
                    min={0}
                    value={v.amount}
                    onChange={(e) => update("amount", Number(e.target.value))}
                    style={{ ...inputStyle, textAlign: "right" }}
                />
                <input
                    type="number"
                    value={v.sortOrder}
                    onChange={(e) => update("sortOrder", Number(e.target.value))}
                    style={{ ...inputStyle, textAlign: "center" }}
                />
                <label style={{ display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12 }}>
                    <input
                        type="checkbox"
                        checked={v.active}
                        onChange={(e) => update("active", e.target.checked)}
                    />
                </label>
                <button type="submit" style={btnPrimarySm}>Save</button>
                <button type="button" onClick={onCancel} style={btnSecondarySm}>Cancel</button>
            </div>
            <input
                value={v.notes}
                onChange={(e) => update("notes", e.target.value)}
                placeholder="Notes (optional)"
                style={inputStyle}
            />
        </form>
    );
}

const inputStyle: React.CSSProperties = {
    padding: "8px 12px",
    border: "1px solid #d4c4a0",
    borderRadius: 6,
    fontSize: 13,
    color: "#14302F",
    background: "#fff",
};

const btnPrimary: React.CSSProperties = {
    padding: "10px 18px",
    background: "#14302F",
    color: "#F7F5F0",
    border: 0,
    borderRadius: 8,
    fontSize: 13,
    fontWeight: 600,
    letterSpacing: "0.04em",
    cursor: "pointer",
};

const btnPrimarySm: React.CSSProperties = { ...btnPrimary, padding: "6px 12px", fontSize: 11, borderRadius: 6 };

const btnSecondarySm: React.CSSProperties = {
    padding: "6px 12px",
    background: "#fff",
    color: "#5A5550",
    border: "1px solid #d4c4a0",
    borderRadius: 6,
    fontSize: 11,
    fontWeight: 600,
    cursor: "pointer",
};

const btnDangerSm: React.CSSProperties = {
    padding: "6px 12px",
    background: "#fff",
    color: "#b8503e",
    border: "1px solid #f0c4b8",
    borderRadius: 6,
    fontSize: 11,
    fontWeight: 600,
    cursor: "pointer",
};
