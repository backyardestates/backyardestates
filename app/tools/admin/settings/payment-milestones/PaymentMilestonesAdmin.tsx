"use client";

import React, { useMemo, useState } from "react";
import type { PaymentMilestoneDef } from "@prisma/client";

type SaveState =
    | { kind: "idle" }
    | { kind: "saving" }
    | { kind: "saved"; at: number }
    | { kind: "error"; message: string };

type MilestoneForm = {
    label: string;
    slug: string;
    trigger: string;
    sortOrder: number;
    weight: number;
    fixedAmount: number | null;
    active: boolean;
    notes: string;
};

function money(n: number) {
    if (!Number.isFinite(n)) return "—";
    return n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}

function toForm(m: PaymentMilestoneDef): MilestoneForm {
    return {
        label: m.label,
        slug: m.slug,
        trigger: m.trigger,
        sortOrder: m.sortOrder,
        weight: m.weight,
        fixedAmount: m.fixedAmount,
        active: m.active,
        notes: m.notes ?? "",
    };
}

const PREVIEW_TOTAL = 200_000;

export function PaymentMilestonesAdmin({ initialMilestones }: { initialMilestones: PaymentMilestoneDef[] }) {
    const [items, setItems] = useState<PaymentMilestoneDef[]>(initialMilestones);
    const [adding, setAdding] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [save, setSave] = useState<SaveState>({ kind: "idle" });

    // Live balloon preview (against a $200K example total) so admins can see
    // how their weights distribute before saving.
    const preview = useMemo(() => {
        const fixedSum = items.reduce((s, m) => s + (m.fixedAmount ?? 0), 0);
        const remaining = Math.max(0, PREVIEW_TOTAL - fixedSum);
        const flexWeights = items.filter((m) => m.fixedAmount == null).reduce((s, m) => s + m.weight, 0) || 1;
        return items.map((m) => {
            const amt = m.fixedAmount ?? Math.round((remaining * m.weight) / flexWeights);
            return { id: m.id, amt, pct: PREVIEW_TOTAL > 0 ? (amt / PREVIEW_TOTAL) * 100 : 0 };
        });
    }, [items]);

    const previewSum = preview.reduce((s, p) => s + p.amt, 0);

    async function refresh() {
        const res = await fetch("/api/admin/settings/payment-milestones");
        if (res.ok) {
            const data = await res.json();
            setItems(data.milestones ?? []);
        }
    }

    async function handleCreate(payload: MilestoneForm) {
        setSave({ kind: "saving" });
        try {
            const res = await fetch("/api/admin/settings/payment-milestones", {
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

    async function handleUpdate(id: string, patch: Partial<MilestoneForm>) {
        setSave({ kind: "saving" });
        try {
            const res = await fetch(`/api/admin/settings/payment-milestones/${id}`, {
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
            const res = await fetch(`/api/admin/settings/payment-milestones/${id}`, { method: "DELETE" });
            if (!res.ok) throw new Error((await res.json())?.error ?? `HTTP ${res.status}`);
            await refresh();
            setSave({ kind: "saved", at: Date.now() });
        } catch (err) {
            setSave({ kind: "error", message: err instanceof Error ? err.message : String(err) });
        }
    }

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Toolbar */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: 13, color: save.kind === "error" ? "#b8503e" : save.kind === "saved" ? "#1f7a4f" : "#8A8278" }}>
                    {save.kind === "saving" && "Saving…"}
                    {save.kind === "saved" && `Saved at ${new Date(save.at).toLocaleTimeString()}`}
                    {save.kind === "error" && `Error: ${save.message}`}
                    {save.kind === "idle" && `${items.length} milestone${items.length === 1 ? "" : "s"}`}
                </span>
                <span style={{ fontSize: 12, color: "#8A8278", fontStyle: "italic" }}>
                    Live preview: ${PREVIEW_TOTAL.toLocaleString()} contract → sum {money(previewSum)}
                </span>
                <button onClick={() => { setAdding(true); setEditingId(null); }} style={btnPrimary}>+ Add milestone</button>
            </div>

            {/* Table header */}
            <div
                style={{
                    display: "grid",
                    gridTemplateColumns: "32px 1.4fr 1.4fr 70px 90px 110px 130px 80px 88px 88px",
                    gap: 10,
                    padding: "8px 14px",
                    fontSize: 10,
                    letterSpacing: "0.16em",
                    textTransform: "uppercase",
                    color: "#8A8278",
                    fontWeight: 700,
                }}
            >
                <span>#</span>
                <span>Label</span>
                <span>Trigger</span>
                <span style={{ textAlign: "right" }}>Weight</span>
                <span style={{ textAlign: "right" }}>Fixed $</span>
                <span style={{ textAlign: "right" }}>@ $200K</span>
                <span style={{ textAlign: "right" }}>% of total</span>
                <span style={{ textAlign: "center" }}>Active</span>
                <span />
                <span />
            </div>

            {/* Add row */}
            {adding && (
                <MilestoneRowForm
                    initial={{
                        label: "",
                        slug: "",
                        trigger: "",
                        sortOrder: items.length,
                        weight: 10,
                        fixedAmount: null,
                        active: true,
                        notes: "",
                    }}
                    onSubmit={handleCreate}
                    onCancel={() => setAdding(false)}
                />
            )}

            {/* Rows */}
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {items.map((m, i) => {
                    const p = preview[i];
                    return editingId === m.id ? (
                        <MilestoneRowForm
                            key={m.id}
                            initial={toForm(m)}
                            onSubmit={(payload) => handleUpdate(m.id, payload)}
                            onCancel={() => setEditingId(null)}
                        />
                    ) : (
                        <MilestoneRow
                            key={m.id}
                            milestone={m}
                            index={i}
                            previewAmt={p?.amt ?? 0}
                            previewPct={p?.pct ?? 0}
                            onEdit={() => { setEditingId(m.id); setAdding(false); }}
                            onDelete={() => handleDelete(m.id, m.label)}
                        />
                    );
                })}
            </div>
        </div>
    );
}

function MilestoneRow({
    milestone,
    index,
    previewAmt,
    previewPct,
    onEdit,
    onDelete,
}: {
    milestone: PaymentMilestoneDef;
    index: number;
    previewAmt: number;
    previewPct: number;
    onEdit: () => void;
    onDelete: () => void;
}) {
    const isFixed = milestone.fixedAmount != null;
    return (
        <div
            style={{
                display: "grid",
                gridTemplateColumns: "32px 1.4fr 1.4fr 70px 90px 110px 130px 80px 88px 88px",
                gap: 10,
                alignItems: "center",
                padding: "12px 14px",
                background: isFixed ? "#fff8eb" : "#fff",
                border: `1px solid ${isFixed ? "#e8c87a" : "#e5e1d8"}`,
                borderRadius: 8,
                fontSize: 13,
                color: "#14302F",
            }}
        >
            <span style={{ textAlign: "center", color: "#B8954A", fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>
                {index + 1}
            </span>
            <span>
                <span style={{ fontWeight: 600 }}>{milestone.label}</span>
                <span style={{ fontSize: 11, color: "#8A8278", marginLeft: 8, letterSpacing: "0.06em" }}>
                    {milestone.slug}
                </span>
                {!milestone.active && (
                    <span style={{ fontSize: 9, color: "#b8503e", letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 700, marginLeft: 8 }}>
                        inactive
                    </span>
                )}
            </span>
            <span style={{ fontSize: 12, color: "#5A5550", fontStyle: "italic" }}>{milestone.trigger}</span>
            <span style={{ textAlign: "right", fontVariantNumeric: "tabular-nums" }}>
                {isFixed ? "—" : milestone.weight}
            </span>
            <span style={{ textAlign: "right", fontVariantNumeric: "tabular-nums", color: isFixed ? "#B8954A" : "#8A8278", fontWeight: isFixed ? 700 : 400 }}>
                {isFixed ? money(milestone.fixedAmount!) : "—"}
            </span>
            <span style={{ textAlign: "right", fontVariantNumeric: "tabular-nums", color: "#14302F", fontWeight: 600 }}>
                {money(previewAmt)}
            </span>
            <span style={{ textAlign: "right", fontVariantNumeric: "tabular-nums", color: "#8A8278" }}>
                {previewPct.toFixed(2)}%
            </span>
            <span style={{ textAlign: "center", fontSize: 11, fontWeight: 700, color: milestone.active ? "#1f7a4f" : "#b8503e" }}>
                {milestone.active ? "YES" : "NO"}
            </span>
            <button onClick={onEdit} style={btnSecondarySm}>Edit</button>
            <button onClick={onDelete} style={btnDangerSm}>Delete</button>
        </div>
    );
}

function MilestoneRowForm({
    initial,
    onSubmit,
    onCancel,
}: {
    initial: MilestoneForm;
    onSubmit: (payload: MilestoneForm) => void | Promise<void>;
    onCancel: () => void;
}) {
    const [v, setV] = useState<MilestoneForm>(initial);
    function update<K extends keyof MilestoneForm>(k: K, val: MilestoneForm[K]) {
        setV((prev) => ({ ...prev, [k]: val }));
    }
    const isFixed = v.fixedAmount != null;
    return (
        <form
            onSubmit={(e) => { e.preventDefault(); onSubmit(v); }}
            style={{
                padding: "14px 16px",
                background: "#fff8eb",
                border: "1px solid #d4c4a0",
                borderRadius: 10,
                display: "flex",
                flexDirection: "column",
                gap: 12,
            }}
        >
            <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr 1.4fr 90px 70px 110px 80px 88px 88px", gap: 10, alignItems: "center" }}>
                <input autoFocus value={v.label} onChange={(e) => update("label", e.target.value)} placeholder="Label" required style={inputStyle} />
                <input value={v.slug} onChange={(e) => update("slug", e.target.value)} placeholder="auto-slug" style={inputStyle} />
                <input value={v.trigger} onChange={(e) => update("trigger", e.target.value)} placeholder="Trigger" required style={inputStyle} />
                <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#5A5550" }}>
                    <input
                        type="checkbox"
                        checked={isFixed}
                        onChange={(e) => update("fixedAmount", e.target.checked ? 0 : null)}
                    />
                    Fixed $
                </label>
                <input
                    type="number"
                    value={v.weight}
                    disabled={isFixed}
                    onChange={(e) => update("weight", Number(e.target.value))}
                    style={{ ...inputStyle, textAlign: "right", opacity: isFixed ? 0.5 : 1 }}
                />
                <input
                    type="number"
                    value={v.fixedAmount ?? ""}
                    disabled={!isFixed}
                    onChange={(e) => update("fixedAmount", e.target.value === "" ? null : Number(e.target.value))}
                    placeholder={isFixed ? "$" : "—"}
                    style={{ ...inputStyle, textAlign: "right", opacity: isFixed ? 1 : 0.4 }}
                />
                <label style={{ display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12 }}>
                    <input type="checkbox" checked={v.active} onChange={(e) => update("active", e.target.checked)} />
                </label>
                <button type="submit" style={btnPrimarySm}>Save</button>
                <button type="button" onClick={onCancel} style={btnSecondarySm}>Cancel</button>
            </div>
            <input value={v.notes} onChange={(e) => update("notes", e.target.value)} placeholder="Notes (optional)" style={inputStyle} />
        </form>
    );
}

const inputStyle: React.CSSProperties = {
    padding: "6px 10px",
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
