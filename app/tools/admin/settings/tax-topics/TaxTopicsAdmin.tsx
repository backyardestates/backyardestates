"use client";

import React, { useState } from "react";
import type { TaxTopic } from "@prisma/client";

type SaveState =
    | { kind: "idle" }
    | { kind: "saving" }
    | { kind: "saved"; at: number }
    | { kind: "error"; message: string };

type TopicForm = {
    name: string;
    slug: string;
    note: string;
    sortOrder: number;
    active: boolean;
};

function toForm(t: TaxTopic): TopicForm {
    return {
        name: t.name,
        slug: t.slug,
        note: t.note,
        sortOrder: t.sortOrder,
        active: t.active,
    };
}

export function TaxTopicsAdmin({ initialTopics }: { initialTopics: TaxTopic[] }) {
    const [items, setItems] = useState<TaxTopic[]>(initialTopics);
    const [adding, setAdding] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [save, setSave] = useState<SaveState>({ kind: "idle" });

    async function refresh() {
        const res = await fetch("/api/admin/settings/tax-topics");
        if (res.ok) {
            const data = await res.json();
            setItems(data.topics ?? []);
        }
    }

    async function handleCreate(payload: TopicForm) {
        setSave({ kind: "saving" });
        try {
            const res = await fetch("/api/admin/settings/tax-topics", {
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

    async function handleUpdate(id: string, patch: Partial<TopicForm>) {
        setSave({ kind: "saving" });
        try {
            const res = await fetch(`/api/admin/settings/tax-topics/${id}`, {
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

    async function handleDelete(id: string, name: string) {
        if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
        setSave({ kind: "saving" });
        try {
            const res = await fetch(`/api/admin/settings/tax-topics/${id}`, { method: "DELETE" });
            if (!res.ok) throw new Error((await res.json())?.error ?? `HTTP ${res.status}`);
            await refresh();
            setSave({ kind: "saved", at: Date.now() });
        } catch (err) {
            setSave({ kind: "error", message: err instanceof Error ? err.message : String(err) });
        }
    }

    const activeCount = items.filter((t) => t.active).length;

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
                    {save.kind === "idle" && `${activeCount} active · ${items.length} total`}
                </span>
                <button onClick={() => { setAdding(true); setEditingId(null); }} style={btnPrimary}>
                    + Add tax topic
                </button>
            </div>

            <div
                style={{
                    display: "grid",
                    gridTemplateColumns: "1.4fr 2.4fr 60px 70px 88px 88px",
                    gap: 10,
                    padding: "8px 14px",
                    fontSize: 10,
                    letterSpacing: "0.16em",
                    textTransform: "uppercase",
                    color: "#8A8278",
                    fontWeight: 700,
                }}
            >
                <span>Name</span>
                <span>Note</span>
                <span style={{ textAlign: "center" }}>Sort</span>
                <span style={{ textAlign: "center" }}>Active</span>
                <span />
                <span />
            </div>

            {adding && (
                <TopicRowForm
                    initial={{ name: "", slug: "", note: "", sortOrder: items.length, active: true }}
                    onSubmit={handleCreate}
                    onCancel={() => setAdding(false)}
                />
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {items.map((t) =>
                    editingId === t.id ? (
                        <TopicRowForm
                            key={t.id}
                            initial={toForm(t)}
                            onSubmit={(payload) => handleUpdate(t.id, payload)}
                            onCancel={() => setEditingId(null)}
                        />
                    ) : (
                        <TopicRow
                            key={t.id}
                            topic={t}
                            onEdit={() => { setEditingId(t.id); setAdding(false); }}
                            onDelete={() => handleDelete(t.id, t.name)}
                        />
                    )
                )}
            </div>
        </div>
    );
}

function TopicRow({
    topic,
    onEdit,
    onDelete,
}: {
    topic: TaxTopic;
    onEdit: () => void;
    onDelete: () => void;
}) {
    return (
        <div
            style={{
                display: "grid",
                gridTemplateColumns: "1.4fr 2.4fr 60px 70px 88px 88px",
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
                {topic.name}
                <span style={{ display: "block", fontSize: 11, color: "#8A8278", letterSpacing: "0.06em", marginTop: 2 }}>
                    {topic.slug}
                </span>
            </span>
            <span style={{ color: "#5A5550", fontStyle: "italic", lineHeight: 1.4 }}>{topic.note}</span>
            <span style={{ textAlign: "center", color: "#8A8278", fontVariantNumeric: "tabular-nums" }}>
                {topic.sortOrder}
            </span>
            <span style={{ textAlign: "center" }}>
                {topic.active ? (
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

function TopicRowForm({
    initial,
    onSubmit,
    onCancel,
}: {
    initial: TopicForm;
    onSubmit: (payload: TopicForm) => void | Promise<void>;
    onCancel: () => void;
}) {
    const [v, setV] = useState<TopicForm>(initial);
    function update<K extends keyof TopicForm>(k: K, val: TopicForm[K]) {
        setV((prev) => ({ ...prev, [k]: val }));
    }
    return (
        <form
            onSubmit={(e) => { e.preventDefault(); onSubmit(v); }}
            style={{
                display: "grid",
                gridTemplateColumns: "1.4fr 2.4fr 60px 70px 88px 88px",
                gap: 10,
                padding: "12px 14px",
                background: "#fff8eb",
                border: "1px solid #d4c4a0",
                borderRadius: 8,
                alignItems: "center",
            }}
        >
            <input
                autoFocus
                value={v.name}
                onChange={(e) => update("name", e.target.value)}
                placeholder="Name (e.g. Mortgage Interest)"
                required
                style={inputStyle}
            />
            <input
                value={v.note}
                onChange={(e) => update("note", e.target.value)}
                placeholder="Brief explanatory note"
                required
                style={inputStyle}
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
