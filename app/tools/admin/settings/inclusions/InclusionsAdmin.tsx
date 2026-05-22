"use client";

import React, { useMemo, useState } from "react";
import type { InclusionCategory, InclusionRow, Slide4SidebarConfig } from "@prisma/client";

type CategoryWithRows = InclusionCategory & { rows: InclusionRow[] };

type SaveState =
    | { kind: "idle" }
    | { kind: "saving" }
    | { kind: "saved"; at: number }
    | { kind: "error"; message: string };

export function InclusionsAdmin({
    initialCategories,
    initialSidebar,
}: {
    initialCategories: CategoryWithRows[];
    initialSidebar: Slide4SidebarConfig;
}) {
    const [cats, setCats] = useState<CategoryWithRows[]>(initialCategories);
    const [sidebar, setSidebar] = useState<Slide4SidebarConfig>(initialSidebar);
    const [expanded, setExpanded] = useState<Set<string>>(new Set(initialCategories.map((c) => c.id)));
    const [save, setSave] = useState<SaveState>({ kind: "idle" });

    const [addingCategory, setAddingCategory] = useState(false);
    const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
    const [addingRowForCatId, setAddingRowForCatId] = useState<string | null>(null);
    const [editingRowId, setEditingRowId] = useState<string | null>(null);

    // Sidebar editor — raw textareas, one item per line.
    const [deptText, setDeptText] = useState<string>(initialSidebar.deptPills.join("\n"));
    const [feeText, setFeeText] = useState<string>(initialSidebar.feeBullets.join("\n"));

    const totalRows = useMemo(() => cats.reduce((s, c) => s + c.rows.length, 0), [cats]);

    async function refresh() {
        const res = await fetch("/api/admin/settings/inclusions");
        if (res.ok) {
            const data = await res.json();
            setCats(data.categories ?? []);
            setSidebar(data.sidebar ?? sidebar);
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
    async function handleCreateCategory(name: string) {
        setSave({ kind: "saving" });
        try {
            const res = await fetch("/api/admin/settings/inclusions", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, sortOrder: cats.length }),
            });
            if (!res.ok) throw new Error((await res.json())?.error ?? `HTTP ${res.status}`);
            await refresh();
            setAddingCategory(false);
            setSave({ kind: "saved", at: Date.now() });
        } catch (err) {
            setSave({ kind: "error", message: err instanceof Error ? err.message : String(err) });
        }
    }

    async function handleUpdateCategory(id: string, patch: Partial<InclusionCategory>) {
        setSave({ kind: "saving" });
        try {
            const res = await fetch(`/api/admin/settings/inclusions/categories/${id}`, {
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

    async function handleDeleteCategory(id: string, name: string) {
        if (!confirm(`Delete category "${name}" and all its rows? This cannot be undone.`)) return;
        setSave({ kind: "saving" });
        try {
            const res = await fetch(`/api/admin/settings/inclusions/categories/${id}`, { method: "DELETE" });
            if (!res.ok) throw new Error((await res.json())?.error ?? `HTTP ${res.status}`);
            await refresh();
            setSave({ kind: "saved", at: Date.now() });
        } catch (err) {
            setSave({ kind: "error", message: err instanceof Error ? err.message : String(err) });
        }
    }

    // ── Row mutations ──
    async function handleCreateRow(categoryId: string, payload: RowForm) {
        setSave({ kind: "saving" });
        try {
            const res = await fetch("/api/admin/settings/inclusions/rows", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ...payload, categoryId }),
            });
            if (!res.ok) throw new Error((await res.json())?.error ?? `HTTP ${res.status}`);
            await refresh();
            setAddingRowForCatId(null);
            setSave({ kind: "saved", at: Date.now() });
        } catch (err) {
            setSave({ kind: "error", message: err instanceof Error ? err.message : String(err) });
        }
    }

    async function handleUpdateRow(id: string, patch: Partial<RowForm>) {
        setSave({ kind: "saving" });
        try {
            const res = await fetch(`/api/admin/settings/inclusions/rows/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(patch),
            });
            if (!res.ok) throw new Error((await res.json())?.error ?? `HTTP ${res.status}`);
            await refresh();
            setEditingRowId(null);
            setSave({ kind: "saved", at: Date.now() });
        } catch (err) {
            setSave({ kind: "error", message: err instanceof Error ? err.message : String(err) });
        }
    }

    async function handleDeleteRow(id: string, label: string) {
        if (!confirm(`Delete row "${label}"? This cannot be undone.`)) return;
        setSave({ kind: "saving" });
        try {
            const res = await fetch(`/api/admin/settings/inclusions/rows/${id}`, { method: "DELETE" });
            if (!res.ok) throw new Error((await res.json())?.error ?? `HTTP ${res.status}`);
            await refresh();
            setSave({ kind: "saved", at: Date.now() });
        } catch (err) {
            setSave({ kind: "error", message: err instanceof Error ? err.message : String(err) });
        }
    }

    // ── Sidebar mutation ──
    async function handleSaveSidebar() {
        setSave({ kind: "saving" });
        try {
            const deptPills = deptText.split("\n").map((l) => l.trim()).filter(Boolean);
            const feeBullets = feeText.split("\n").map((l) => l.trim()).filter(Boolean);
            const res = await fetch("/api/admin/settings/inclusions/sidebar", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ deptPills, feeBullets }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data?.error ?? `HTTP ${res.status}`);
            setSidebar(data.sidebar);
            setDeptText((data.sidebar.deptPills ?? []).join("\n"));
            setFeeText((data.sidebar.feeBullets ?? []).join("\n"));
            setSave({ kind: "saved", at: Date.now() });
        } catch (err) {
            setSave({ kind: "error", message: err instanceof Error ? err.message : String(err) });
        }
    }

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: 13, color: save.kind === "error" ? "#b8503e" : save.kind === "saved" ? "#1f7a4f" : "#8A8278" }}>
                    {save.kind === "saving" && "Saving…"}
                    {save.kind === "saved" && `Saved at ${new Date(save.at).toLocaleTimeString()}`}
                    {save.kind === "error" && `Error: ${save.message}`}
                    {save.kind === "idle" && `${cats.length} categories · ${totalRows} rows`}
                </span>
                <button onClick={() => setAddingCategory(true)} style={btnPrimary}>+ Add category</button>
            </div>

            {addingCategory && (
                <InlineLabelForm
                    placeholder="Category name (e.g. Kitchen)"
                    onSubmit={handleCreateCategory}
                    onCancel={() => setAddingCategory(false)}
                />
            )}

            {/* Inclusion categories accordion */}
            {cats.map((cat) => {
                const isOpen = expanded.has(cat.id);
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
                                    defaultValue={cat.name}
                                    onClick={(e) => e.stopPropagation()}
                                    onBlur={(e) => handleUpdateCategory(cat.id, { name: e.target.value })}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter") (e.target as HTMLInputElement).blur();
                                        if (e.key === "Escape") setEditingCategoryId(null);
                                    }}
                                    style={{ ...inputStyle, fontSize: 16, fontWeight: 600 }}
                                />
                            ) : (
                                <span style={{ fontSize: 16, fontWeight: 600, color: "#14302F" }}>
                                    {cat.name}
                                    <span style={{ fontSize: 11, color: "#8A8278", marginLeft: 10, letterSpacing: "0.1em", textTransform: "uppercase" }}>
                                        {cat.slug}
                                    </span>
                                </span>
                            )}
                            <span style={{ fontSize: 12, color: "#8A8278", fontVariantNumeric: "tabular-nums" }}>
                                {cat.rows.length} row{cat.rows.length === 1 ? "" : "s"}
                            </span>
                            <button
                                onClick={(e) => { e.stopPropagation(); setEditingCategoryId(cat.id); }}
                                style={btnSecondarySm}
                            >
                                Rename
                            </button>
                            <button
                                onClick={(e) => { e.stopPropagation(); handleDeleteCategory(cat.id, cat.name); }}
                                style={btnDangerSm}
                            >
                                Delete
                            </button>
                        </header>

                        {isOpen && (
                            <div style={{ padding: "12px 20px 20px" }}>
                                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                                    <div
                                        style={{
                                            display: "grid",
                                            gridTemplateColumns: "1fr 2fr 78px 78px",
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
                                        <span>Text</span>
                                        <span />
                                        <span />
                                    </div>
                                    {cat.rows.map((r) =>
                                        editingRowId === r.id ? (
                                            <RowFormBlock
                                                key={r.id}
                                                initial={toRowForm(r)}
                                                onSubmit={(payload) => handleUpdateRow(r.id, payload)}
                                                onCancel={() => setEditingRowId(null)}
                                            />
                                        ) : (
                                            <RowDisplay
                                                key={r.id}
                                                row={r}
                                                onEdit={() => { setEditingRowId(r.id); setAddingRowForCatId(null); }}
                                                onDelete={() => handleDeleteRow(r.id, r.label)}
                                            />
                                        )
                                    )}
                                    {addingRowForCatId === cat.id ? (
                                        <RowFormBlock
                                            initial={{ label: "", text: "", sortOrder: cat.rows.length, active: true }}
                                            onSubmit={(payload) => handleCreateRow(cat.id, payload)}
                                            onCancel={() => setAddingRowForCatId(null)}
                                        />
                                    ) : (
                                        <button
                                            onClick={() => { setAddingRowForCatId(cat.id); setEditingRowId(null); }}
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
                                            + Add row to {cat.name}
                                        </button>
                                    )}
                                </div>
                            </div>
                        )}
                    </section>
                );
            })}

            {/* Sidebar editor */}
            <section
                style={{
                    background: "#fff",
                    border: "1px solid #e5e1d8",
                    borderRadius: 12,
                    padding: "20px 24px",
                }}
            >
                <h2
                    style={{
                        fontSize: 12,
                        letterSpacing: "0.2em",
                        textTransform: "uppercase",
                        color: "#B8954A",
                        fontWeight: 700,
                        margin: 0,
                        marginBottom: 14,
                    }}
                >
                    Sidebar — city departments + fees
                </h2>
                <p style={{ fontSize: 13, color: "#5A5550", marginTop: 0, marginBottom: 16 }}>
                    One item per line. Blank lines are ignored.
                </p>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1.4fr", gap: 18 }}>
                    <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                        <span style={{ fontSize: 12, color: "#5A5550", fontWeight: 600 }}>
                            City department pills ({deptText.split("\n").filter((l) => l.trim()).length})
                        </span>
                        <textarea
                            value={deptText}
                            onChange={(e) => setDeptText(e.target.value)}
                            rows={11}
                            style={{ ...inputStyle, fontFamily: "var(--p-font, system-ui)", fontSize: 13, lineHeight: 1.5 }}
                        />
                    </label>
                    <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                        <span style={{ fontSize: 12, color: "#5A5550", fontWeight: 600 }}>
                            Fee bullets ({feeText.split("\n").filter((l) => l.trim()).length})
                        </span>
                        <textarea
                            value={feeText}
                            onChange={(e) => setFeeText(e.target.value)}
                            rows={11}
                            style={{ ...inputStyle, fontFamily: "var(--p-font, system-ui)", fontSize: 13, lineHeight: 1.5 }}
                        />
                    </label>
                </div>
                <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 14 }}>
                    <button onClick={handleSaveSidebar} style={btnPrimary}>Save sidebar</button>
                </div>
            </section>
        </div>
    );
}

// ─── Row display + form ─────────────────────────────────────────────────────

function RowDisplay({
    row,
    onEdit,
    onDelete,
}: {
    row: InclusionRow;
    onEdit: () => void;
    onDelete: () => void;
}) {
    return (
        <div
            style={{
                display: "grid",
                gridTemplateColumns: "1fr 2fr 78px 78px",
                gap: 10,
                padding: "10px 8px",
                background: "#fcfaf5",
                border: "1px solid #f0ede7",
                borderRadius: 6,
                fontSize: 13,
                alignItems: "center",
                color: "#14302F",
            }}
        >
            <span style={{ fontWeight: 600 }}>
                {row.label}
                {!row.active && (
                    <span style={{ fontSize: 9, color: "#b8503e", letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 700, marginLeft: 8 }}>
                        inactive
                    </span>
                )}
            </span>
            <span style={{ color: "#5A5550", lineHeight: 1.4 }}>{row.text}</span>
            <button onClick={onEdit} style={btnSecondarySm}>Edit</button>
            <button onClick={onDelete} style={btnDangerSm}>Delete</button>
        </div>
    );
}

type RowForm = { label: string; text: string; sortOrder: number; active: boolean };

function toRowForm(r: InclusionRow): RowForm {
    return { label: r.label, text: r.text, sortOrder: r.sortOrder, active: r.active };
}

function RowFormBlock({
    initial,
    onSubmit,
    onCancel,
}: {
    initial: RowForm;
    onSubmit: (payload: RowForm) => void | Promise<void>;
    onCancel: () => void;
}) {
    const [v, setV] = useState<RowForm>(initial);
    function update<K extends keyof RowForm>(k: K, val: RowForm[K]) {
        setV((prev) => ({ ...prev, [k]: val }));
    }
    return (
        <form
            onSubmit={(e) => { e.preventDefault(); onSubmit(v); }}
            style={{
                display: "grid",
                gridTemplateColumns: "1fr 2fr 78px 78px",
                gap: 10,
                padding: "10px 8px",
                background: "#fff8eb",
                border: "1px solid #d4c4a0",
                borderRadius: 6,
                alignItems: "center",
                fontSize: 13,
            }}
        >
            <input
                autoFocus
                value={v.label}
                onChange={(e) => update("label", e.target.value)}
                placeholder="Label"
                required
                style={inputStyle}
            />
            <input
                value={v.text}
                onChange={(e) => update("text", e.target.value)}
                placeholder="Detail text"
                required
                style={inputStyle}
            />
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
