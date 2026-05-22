"use client";

import React, { useMemo, useState } from "react";
import type { SiteWorkCategory, SiteWorkPreset } from "@prisma/client";

type CategoryWithItems = SiteWorkCategory & { items: SiteWorkPreset[] };

type SaveState =
    | { kind: "idle" }
    | { kind: "saving" }
    | { kind: "saved"; at: number }
    | { kind: "error"; message: string };

function money(n: number) {
    if (!Number.isFinite(n)) return "—";
    return n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}

function pctOfMarkup(m: number): string {
    if (!Number.isFinite(m)) return "—";
    const pct = (m - 1) * 100;
    return `${pct >= 0 ? "+" : ""}${pct.toFixed(0)}%`;
}

export function SiteWorkAdmin({ initialCategories }: { initialCategories: CategoryWithItems[] }) {
    const [cats, setCats] = useState<CategoryWithItems[]>(initialCategories);
    const [expanded, setExpanded] = useState<Set<string>>(new Set(initialCategories.map((c) => c.id)));
    const [save, setSave] = useState<SaveState>({ kind: "idle" });

    // Local UI state for add/edit modes
    const [addingCategory, setAddingCategory] = useState(false);
    const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
    const [addingPresetForCatId, setAddingPresetForCatId] = useState<string | null>(null);
    const [editingPresetId, setEditingPresetId] = useState<string | null>(null);

    const totalItems = useMemo(() => cats.reduce((sum, c) => sum + c.items.length, 0), [cats]);

    async function refresh() {
        const res = await fetch("/api/admin/settings/site-work");
        if (res.ok) {
            const data = await res.json();
            setCats(data.categories ?? []);
        }
    }

    function toggleCat(id: string) {
        setExpanded((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    }

    // ── Category mutations ──
    async function handleCreateCategory(label: string) {
        setSave({ kind: "saving" });
        try {
            const res = await fetch("/api/admin/settings/site-work", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ label, sortOrder: cats.length }),
            });
            if (!res.ok) throw new Error((await res.json())?.error ?? `HTTP ${res.status}`);
            await refresh();
            setAddingCategory(false);
            setSave({ kind: "saved", at: Date.now() });
        } catch (err) {
            setSave({ kind: "error", message: err instanceof Error ? err.message : String(err) });
        }
    }

    async function handleUpdateCategory(id: string, patch: Partial<SiteWorkCategory>) {
        setSave({ kind: "saving" });
        try {
            const res = await fetch(`/api/admin/settings/site-work/categories/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(patch),
            });
            if (!res.ok) throw new Error((await res.json())?.error ?? `HTTP ${res.status}`);
            await refresh();
            setEditingCategoryId(null);
            setSave({ kind: "saved", at: Date.now() });
        } catch (err) {
            setSave({ kind: "error", message: err instanceof Error ? err.message : String(err) });
        }
    }

    async function handleDeleteCategory(id: string, label: string) {
        if (!confirm(`Delete category "${label}" and all its items? This cannot be undone.`)) return;
        setSave({ kind: "saving" });
        try {
            const res = await fetch(`/api/admin/settings/site-work/categories/${id}`, { method: "DELETE" });
            if (!res.ok) throw new Error((await res.json())?.error ?? `HTTP ${res.status}`);
            await refresh();
            setSave({ kind: "saved", at: Date.now() });
        } catch (err) {
            setSave({ kind: "error", message: err instanceof Error ? err.message : String(err) });
        }
    }

    // ── Preset mutations ──
    async function handleCreatePreset(catId: string, payload: PresetForm) {
        setSave({ kind: "saving" });
        try {
            const res = await fetch("/api/admin/settings/site-work/presets", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ...payload, categoryId: catId }),
            });
            if (!res.ok) throw new Error((await res.json())?.error ?? `HTTP ${res.status}`);
            await refresh();
            setAddingPresetForCatId(null);
            setSave({ kind: "saved", at: Date.now() });
        } catch (err) {
            setSave({ kind: "error", message: err instanceof Error ? err.message : String(err) });
        }
    }

    async function handleUpdatePreset(id: string, patch: Partial<PresetForm>) {
        setSave({ kind: "saving" });
        try {
            const res = await fetch(`/api/admin/settings/site-work/presets/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(patch),
            });
            if (!res.ok) throw new Error((await res.json())?.error ?? `HTTP ${res.status}`);
            await refresh();
            setEditingPresetId(null);
            setSave({ kind: "saved", at: Date.now() });
        } catch (err) {
            setSave({ kind: "error", message: err instanceof Error ? err.message : String(err) });
        }
    }

    async function handleDeletePreset(id: string, label: string) {
        if (!confirm(`Delete preset "${label}"? This cannot be undone.`)) return;
        setSave({ kind: "saving" });
        try {
            const res = await fetch(`/api/admin/settings/site-work/presets/${id}`, { method: "DELETE" });
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
                <span
                    style={{
                        fontSize: 13,
                        color:
                            save.kind === "error" ? "#b8503e" : save.kind === "saved" ? "#1f7a4f" : "#8A8278",
                    }}
                >
                    {save.kind === "saving" && "Saving…"}
                    {save.kind === "saved" && `Saved at ${new Date(save.at).toLocaleTimeString()}`}
                    {save.kind === "error" && `Error: ${save.message}`}
                    {save.kind === "idle" && `${cats.length} categories · ${totalItems} presets`}
                </span>
                <button onClick={() => setAddingCategory(true)} style={btnPrimary}>+ Add category</button>
            </div>

            {addingCategory && (
                <InlineLabelForm
                    placeholder="Category label (e.g. Permits & engineering)"
                    onSubmit={handleCreateCategory}
                    onCancel={() => setAddingCategory(false)}
                />
            )}

            {cats.map((cat) => {
                const isOpen = expanded.has(cat.id);
                const totalCustomerPrice = cat.items.reduce((sum, it) => sum + it.beCost * it.markup, 0);
                return (
                    <section
                        key={cat.id}
                        style={{
                            background: "#fff",
                            border: "1px solid #e5e1d8",
                            borderRadius: 12,
                            overflow: "hidden",
                        }}
                    >
                        <header
                            style={{
                                display: "grid",
                                gridTemplateColumns: "auto 1fr auto auto auto",
                                gap: 14,
                                alignItems: "center",
                                padding: "14px 20px",
                                background: "#f7f5f0",
                                borderBottom: isOpen ? "1px solid #e5e1d8" : "none",
                                cursor: "pointer",
                            }}
                            onClick={() => toggleCat(cat.id)}
                        >
                            <span style={{ fontSize: 14, color: "#8A8278" }}>{isOpen ? "▾" : "▸"}</span>
                            {editingCategoryId === cat.id ? (
                                <input
                                    autoFocus
                                    defaultValue={cat.label}
                                    onClick={(e) => e.stopPropagation()}
                                    onBlur={(e) => handleUpdateCategory(cat.id, { label: e.target.value })}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter") (e.target as HTMLInputElement).blur();
                                        if (e.key === "Escape") setEditingCategoryId(null);
                                    }}
                                    style={{ ...inputStyle, fontSize: 16, fontWeight: 600 }}
                                />
                            ) : (
                                <span style={{ fontSize: 16, fontWeight: 600, color: "#14302F" }}>
                                    {cat.label}
                                    <span style={{ fontSize: 11, color: "#8A8278", marginLeft: 10, letterSpacing: "0.1em", textTransform: "uppercase" }}>
                                        {cat.slug}
                                    </span>
                                </span>
                            )}
                            <span style={{ fontSize: 12, color: "#8A8278", fontVariantNumeric: "tabular-nums" }}>
                                {cat.items.length} item{cat.items.length === 1 ? "" : "s"}
                            </span>
                            <button
                                onClick={(e) => { e.stopPropagation(); setEditingCategoryId(cat.id); }}
                                style={btnSecondarySm}
                            >
                                Rename
                            </button>
                            <button
                                onClick={(e) => { e.stopPropagation(); handleDeleteCategory(cat.id, cat.label); }}
                                style={btnDangerSm}
                            >
                                Delete
                            </button>
                        </header>

                        {isOpen && (
                            <div style={{ padding: "12px 20px 20px" }}>
                                {/* Items table */}
                                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                                    <div
                                        style={{
                                            display: "grid",
                                            gridTemplateColumns: "2fr 70px 110px 90px 130px 88px 88px",
                                            gap: 10,
                                            padding: "6px 8px",
                                            fontSize: 10,
                                            letterSpacing: "0.16em",
                                            textTransform: "uppercase",
                                            color: "#8A8278",
                                            fontWeight: 700,
                                        }}
                                    >
                                        <span>Label</span>
                                        <span>Unit</span>
                                        <span style={{ textAlign: "right" }}>BE cost</span>
                                        <span style={{ textAlign: "right" }}>Markup</span>
                                        <span style={{ textAlign: "right" }}>Customer / unit</span>
                                        <span />
                                        <span />
                                    </div>
                                    {cat.items.map((p) =>
                                        editingPresetId === p.id ? (
                                            <PresetFormRow
                                                key={p.id}
                                                initial={presetToForm(p)}
                                                onSubmit={(payload) => handleUpdatePreset(p.id, payload)}
                                                onCancel={() => setEditingPresetId(null)}
                                            />
                                        ) : (
                                            <PresetRow
                                                key={p.id}
                                                preset={p}
                                                onEdit={() => { setEditingPresetId(p.id); setAddingPresetForCatId(null); }}
                                                onDelete={() => handleDeletePreset(p.id, p.label)}
                                            />
                                        )
                                    )}
                                    {addingPresetForCatId === cat.id ? (
                                        <PresetFormRow
                                            initial={{
                                                label: "",
                                                unit: "flat",
                                                beCost: 0,
                                                markup: 1.0,
                                                sortOrder: cat.items.length,
                                                active: true,
                                                notes: "",
                                            }}
                                            onSubmit={(payload) => handleCreatePreset(cat.id, payload)}
                                            onCancel={() => setAddingPresetForCatId(null)}
                                        />
                                    ) : (
                                        <button
                                            onClick={() => { setAddingPresetForCatId(cat.id); setEditingPresetId(null); }}
                                            style={{
                                                marginTop: 6,
                                                padding: "8px 12px",
                                                background: "#fff",
                                                color: "#B8954A",
                                                border: "1px dashed #d4c4a0",
                                                borderRadius: 6,
                                                fontSize: 12,
                                                fontWeight: 600,
                                                cursor: "pointer",
                                                textAlign: "left",
                                            }}
                                        >
                                            + Add preset to {cat.label}
                                        </button>
                                    )}
                                </div>

                                {/* Category subtotal */}
                                <div
                                    style={{
                                        marginTop: 14,
                                        padding: "10px 8px 0",
                                        borderTop: "1px solid #f0ede7",
                                        display: "flex",
                                        justifyContent: "flex-end",
                                        gap: 18,
                                        fontSize: 12,
                                        color: "#8A8278",
                                    }}
                                >
                                    <span>If qty=1 on every preset: total customer price ≈ <strong style={{ color: "#14302F" }}>{money(totalCustomerPrice)}</strong></span>
                                </div>
                            </div>
                        )}
                    </section>
                );
            })}
        </div>
    );
}

// ── Row display ──────────────────────────────────────────────────────────────

function PresetRow({
    preset,
    onEdit,
    onDelete,
}: {
    preset: SiteWorkPreset;
    onEdit: () => void;
    onDelete: () => void;
}) {
    const customerUnit = preset.unit === "quote" ? 0 : preset.beCost * preset.markup;
    return (
        <div
            style={{
                display: "grid",
                gridTemplateColumns: "2fr 70px 110px 90px 130px 88px 88px",
                gap: 10,
                padding: "8px 8px",
                alignItems: "center",
                background: "#fcfaf5",
                border: "1px solid #f0ede7",
                borderRadius: 6,
                fontSize: 13,
                color: "#14302F",
            }}
        >
            <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {preset.label}
                {!preset.active && (
                    <span style={{ fontSize: 9, color: "#b8503e", letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 700, marginLeft: 8 }}>
                        inactive
                    </span>
                )}
            </span>
            <span style={{ fontSize: 11, color: "#8A8278", letterSpacing: "0.08em", textTransform: "uppercase" }}>
                {preset.unit}
            </span>
            <span style={{ textAlign: "right", fontVariantNumeric: "tabular-nums" }}>
                {preset.unit === "quote" ? "—" : money(preset.beCost)}
            </span>
            <span style={{ textAlign: "right", fontVariantNumeric: "tabular-nums", color: "#B8954A", fontWeight: 600 }}>
                {pctOfMarkup(preset.markup)}
            </span>
            <span style={{ textAlign: "right", fontVariantNumeric: "tabular-nums", fontWeight: 600 }}>
                {preset.unit === "quote" ? "qty × markup" : money(customerUnit)}
            </span>
            <button onClick={onEdit} style={btnSecondarySm}>Edit</button>
            <button onClick={onDelete} style={btnDangerSm}>Delete</button>
        </div>
    );
}

// ── Form types + components ──────────────────────────────────────────────────

type PresetForm = {
    label: string;
    unit: string;
    beCost: number;
    markup: number;
    sortOrder: number;
    active: boolean;
    notes: string;
};

function presetToForm(p: SiteWorkPreset): PresetForm {
    return {
        label: p.label,
        unit: p.unit,
        beCost: p.beCost,
        markup: p.markup,
        sortOrder: p.sortOrder,
        active: p.active,
        notes: p.notes ?? "",
    };
}

function PresetFormRow({
    initial,
    onSubmit,
    onCancel,
}: {
    initial: PresetForm;
    onSubmit: (payload: PresetForm) => void | Promise<void>;
    onCancel: () => void;
}) {
    const [v, setV] = useState<PresetForm>(initial);
    function update<K extends keyof PresetForm>(k: K, val: PresetForm[K]) {
        setV((prev) => ({ ...prev, [k]: val }));
    }
    return (
        <form
            onSubmit={(e) => { e.preventDefault(); onSubmit(v); }}
            style={{
                display: "grid",
                gridTemplateColumns: "2fr 70px 110px 90px 130px 88px 88px",
                gap: 10,
                padding: "8px 8px",
                alignItems: "center",
                background: "#fff8eb",
                border: "1px solid #d4c4a0",
                borderRadius: 6,
                fontSize: 13,
            }}
        >
            <input
                autoFocus
                value={v.label}
                onChange={(e) => update("label", e.target.value)}
                placeholder="Item label"
                required
                style={inputStyle}
            />
            <select value={v.unit} onChange={(e) => update("unit", e.target.value)} style={inputStyle}>
                <option value="flat">flat</option>
                <option value="sqft">sqft</option>
                <option value="lft">lft</option>
                <option value="quote">quote</option>
            </select>
            <input
                type="number"
                min={0}
                value={v.beCost}
                onChange={(e) => update("beCost", Number(e.target.value))}
                style={{ ...inputStyle, textAlign: "right" }}
            />
            <input
                type="number"
                step={0.05}
                min={0}
                value={v.markup}
                onChange={(e) => update("markup", Number(e.target.value))}
                style={{ ...inputStyle, textAlign: "right" }}
            />
            <span
                style={{
                    textAlign: "right",
                    fontVariantNumeric: "tabular-nums",
                    fontSize: 12,
                    color: "#8A8278",
                    fontStyle: "italic",
                }}
            >
                {v.unit === "quote" ? "qty × markup" : money(v.beCost * v.markup)}
            </span>
            <button type="submit" style={btnPrimarySm}>Save</button>
            <button type="button" onClick={onCancel} style={btnSecondarySm}>Cancel</button>
        </form>
    );
}

function InlineLabelForm({
    placeholder,
    onSubmit,
    onCancel,
}: {
    placeholder: string;
    onSubmit: (label: string) => void | Promise<void>;
    onCancel: () => void;
}) {
    const [label, setLabel] = useState("");
    return (
        <form
            onSubmit={(e) => { e.preventDefault(); if (label.trim()) onSubmit(label.trim()); }}
            style={{
                display: "flex",
                gap: 10,
                padding: "12px 16px",
                background: "#fff",
                border: "1px solid #d4c4a0",
                borderRadius: 10,
                alignItems: "center",
            }}
        >
            <input
                autoFocus
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder={placeholder}
                style={{ ...inputStyle, flex: 1 }}
                required
            />
            <button type="submit" style={btnPrimary}>Create</button>
            <button type="button" onClick={onCancel} style={btnSecondary}>Cancel</button>
        </form>
    );
}

// ── Styles ───────────────────────────────────────────────────────────────────

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

const btnSecondary: React.CSSProperties = {
    padding: "10px 18px",
    background: "#fff",
    color: "#5A5550",
    border: "1px solid #d4c4a0",
    borderRadius: 8,
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
};

const btnSecondarySm: React.CSSProperties = { ...btnSecondary, padding: "6px 12px", fontSize: 11, borderRadius: 6 };

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
