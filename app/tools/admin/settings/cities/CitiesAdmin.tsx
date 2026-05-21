"use client";

import React, { useState } from "react";
import type { City } from "@prisma/client";

type SaveState =
    | { kind: "idle" }
    | { kind: "saving" }
    | { kind: "saved"; at: number }
    | { kind: "error"; message: string };

const blank = (sort: number) => ({
    name: "",
    slug: "",
    bePlansDays: 25,
    bePermitsDays: 130,
    beBuildDays: 40,
    cityPlansDays: null as number | null,
    cityPermitsDays: null as number | null,
    cityBuildDays: null as number | null,
    cityPlansLabel: "" as string | null,
    cityPermitsLabel: "" as string | null,
    cityBuildLabel: "" as string | null,
    notes: "" as string | null,
    active: true,
    sortOrder: sort,
});

function pretty(days?: number | null) {
    if (days == null) return "—";
    if (days >= 60) return `${(days / 30).toFixed(1)} mo`;
    return `${days}d`;
}

export function CitiesAdmin({ initialCities }: { initialCities: City[] }) {
    const [cities, setCities] = useState<City[]>(initialCities);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [adding, setAdding] = useState(false);
    const [save, setSave] = useState<SaveState>({ kind: "idle" });

    async function refresh() {
        const res = await fetch("/api/admin/settings/cities");
        if (res.ok) {
            const data = await res.json();
            setCities(data.cities ?? []);
        }
    }

    async function handleCreate(payload: ReturnType<typeof blank>) {
        setSave({ kind: "saving" });
        try {
            const res = await fetch("/api/admin/settings/cities", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data?.error ?? `HTTP ${res.status}`);
            await refresh();
            setAdding(false);
            setSave({ kind: "saved", at: Date.now() });
        } catch (err) {
            setSave({ kind: "error", message: err instanceof Error ? err.message : String(err) });
        }
    }

    async function handleUpdate(id: string, patch: Partial<City>) {
        setSave({ kind: "saving" });
        try {
            const res = await fetch(`/api/admin/settings/cities/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(patch),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data?.error ?? `HTTP ${res.status}`);
            await refresh();
            setEditingId(null);
            setSave({ kind: "saved", at: Date.now() });
        } catch (err) {
            setSave({ kind: "error", message: err instanceof Error ? err.message : String(err) });
        }
    }

    async function handleDelete(id: string, name: string) {
        if (!confirm(`Delete city "${name}"? This cannot be undone.`)) return;
        setSave({ kind: "saving" });
        try {
            const res = await fetch(`/api/admin/settings/cities/${id}`, { method: "DELETE" });
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data?.error ?? `HTTP ${res.status}`);
            }
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
                    {save.kind === "idle" && `${cities.length} ${cities.length === 1 ? "city" : "cities"} in catalog`}
                </span>
                <button
                    onClick={() => { setAdding(true); setEditingId(null); }}
                    style={{
                        padding: "10px 18px",
                        background: "#14302F",
                        color: "#F7F5F0",
                        border: 0,
                        borderRadius: 8,
                        fontSize: 13,
                        fontWeight: 600,
                        letterSpacing: "0.04em",
                        cursor: "pointer",
                    }}
                >
                    + Add city
                </button>
            </div>

            {/* Add new row */}
            {adding && (
                <CityForm
                    initial={blank(cities.length)}
                    onSubmit={handleCreate}
                    onCancel={() => setAdding(false)}
                    submitLabel="Create city"
                />
            )}

            {/* Existing rows */}
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {cities.map((c) => (
                    <div
                        key={c.id}
                        style={{
                            background: "#fff",
                            border: "1px solid #e5e1d8",
                            borderRadius: 12,
                            padding: "16px 22px",
                        }}
                    >
                        {editingId === c.id ? (
                            <CityForm
                                initial={c as unknown as ReturnType<typeof blank>}
                                onSubmit={(p) => handleUpdate(c.id, p as Partial<City>)}
                                onCancel={() => setEditingId(null)}
                                submitLabel="Save changes"
                            />
                        ) : (
                            <CityRow
                                city={c}
                                onEdit={() => { setEditingId(c.id); setAdding(false); }}
                                onDelete={() => handleDelete(c.id, c.name)}
                            />
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}

// ── Row display ──────────────────────────────────────────────────────────────

function CityRow({
    city,
    onEdit,
    onDelete,
}: {
    city: City;
    onEdit: () => void;
    onDelete: () => void;
}) {
    const beTotal = city.bePlansDays + city.bePermitsDays + city.beBuildDays;
    return (
        <div style={{ display: "grid", gridTemplateColumns: "1fr auto auto", gap: 18, alignItems: "center" }}>
            <div>
                <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
                    <span style={{ fontSize: 18, fontWeight: 600, color: "#14302F" }}>{city.name}</span>
                    <span style={{ fontSize: 11, color: "#8A8278", letterSpacing: "0.1em", textTransform: "uppercase" }}>
                        {city.slug}
                    </span>
                    {!city.active && (
                        <span style={{ fontSize: 10, color: "#b8503e", letterSpacing: "0.1em", textTransform: "uppercase", fontWeight: 700 }}>
                            inactive
                        </span>
                    )}
                </div>
                <div style={{ display: "flex", gap: 24, marginTop: 8, fontSize: 13, color: "#5A5550" }}>
                    <Stat label="BE plans"   value={pretty(city.bePlansDays)} />
                    <Stat label="BE permits" value={pretty(city.bePermitsDays)} />
                    <Stat label="BE build"   value={pretty(city.beBuildDays)} />
                    <Stat label="BE total"   value={pretty(beTotal)} accent />
                </div>
                <div style={{ display: "flex", gap: 24, marginTop: 4, fontSize: 13, color: "#8A8278" }}>
                    <Stat label="City plans"   value={city.cityPlansLabel ?? pretty(city.cityPlansDays)} />
                    <Stat label="City permits" value={city.cityPermitsLabel ?? pretty(city.cityPermitsDays)} />
                    <Stat label="City build"   value={city.cityBuildLabel ?? pretty(city.cityBuildDays)} />
                </div>
            </div>
            <button
                onClick={onEdit}
                style={{
                    padding: "8px 14px",
                    background: "#fff",
                    color: "#14302F",
                    border: "1px solid #d4c4a0",
                    borderRadius: 6,
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: "pointer",
                }}
            >
                Edit
            </button>
            <button
                onClick={onDelete}
                style={{
                    padding: "8px 14px",
                    background: "#fff",
                    color: "#b8503e",
                    border: "1px solid #f0c4b8",
                    borderRadius: 6,
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: "pointer",
                }}
            >
                Delete
            </button>
        </div>
    );
}

function Stat({ label, value, accent }: { label: string; value: React.ReactNode; accent?: boolean }) {
    return (
        <span>
            <span style={{ fontSize: 10, letterSpacing: "0.15em", textTransform: "uppercase", color: "#8A8278", marginRight: 6, fontWeight: 600 }}>
                {label}
            </span>
            <span style={{ fontVariantNumeric: "tabular-nums", fontWeight: accent ? 700 : 500, color: accent ? "#B8954A" : "inherit" }}>
                {value}
            </span>
        </span>
    );
}

// ── Form ────────────────────────────────────────────────────────────────────

type FormShape = ReturnType<typeof blank>;

function CityForm({
    initial,
    onSubmit,
    onCancel,
    submitLabel,
}: {
    initial: FormShape;
    onSubmit: (payload: FormShape) => void | Promise<void>;
    onCancel: () => void;
    submitLabel: string;
}) {
    const [v, setV] = useState<FormShape>(initial);

    function update<K extends keyof FormShape>(key: K, value: FormShape[K]) {
        setV((prev) => ({ ...prev, [key]: value }));
    }

    function num(value: string): number | null {
        if (value === "" || value == null) return null;
        const n = Number(value);
        return Number.isFinite(n) ? n : null;
    }

    return (
        <form
            onSubmit={(e) => { e.preventDefault(); onSubmit(v); }}
            style={{ display: "flex", flexDirection: "column", gap: 14 }}
        >
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                <Field label="Name">
                    <input value={v.name} onChange={(e) => update("name", e.target.value)} required style={inputStyle} />
                </Field>
                <Field label="Slug (optional)">
                    <input value={v.slug} onChange={(e) => update("slug", e.target.value)} placeholder="auto-from-name" style={inputStyle} />
                </Field>
            </div>

            <FieldGroup title="Backyard Estates timeline (days)">
                <Field label="Plans">
                    <input type="number" min={0} value={v.bePlansDays} onChange={(e) => update("bePlansDays", Number(e.target.value))} style={inputStyle} />
                </Field>
                <Field label="Permits">
                    <input type="number" min={0} value={v.bePermitsDays} onChange={(e) => update("bePermitsDays", Number(e.target.value))} style={inputStyle} />
                </Field>
                <Field label="Build">
                    <input type="number" min={0} value={v.beBuildDays} onChange={(e) => update("beBuildDays", Number(e.target.value))} style={inputStyle} />
                </Field>
            </FieldGroup>

            <FieldGroup title="City average — numeric (optional)">
                <Field label="Plans (days)">
                    <input type="number" min={0} value={v.cityPlansDays ?? ""} onChange={(e) => update("cityPlansDays", num(e.target.value))} style={inputStyle} />
                </Field>
                <Field label="Permits (days)">
                    <input type="number" min={0} value={v.cityPermitsDays ?? ""} onChange={(e) => update("cityPermitsDays", num(e.target.value))} style={inputStyle} />
                </Field>
                <Field label="Build (days)">
                    <input type="number" min={0} value={v.cityBuildDays ?? ""} onChange={(e) => update("cityBuildDays", num(e.target.value))} style={inputStyle} />
                </Field>
            </FieldGroup>

            <FieldGroup title="City average — label (fallback display)">
                <Field label="Plans label">
                    <input value={v.cityPlansLabel ?? ""} onChange={(e) => update("cityPlansLabel", e.target.value)} placeholder="e.g. Not tracked" style={inputStyle} />
                </Field>
                <Field label="Permits label">
                    <input value={v.cityPermitsLabel ?? ""} onChange={(e) => update("cityPermitsLabel", e.target.value)} placeholder="e.g. 1,202 days" style={inputStyle} />
                </Field>
                <Field label="Build label">
                    <input value={v.cityBuildLabel ?? ""} onChange={(e) => update("cityBuildLabel", e.target.value)} placeholder="e.g. 6-12 months" style={inputStyle} />
                </Field>
            </FieldGroup>

            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: 14, alignItems: "flex-end" }}>
                <Field label="Notes">
                    <input value={v.notes ?? ""} onChange={(e) => update("notes", e.target.value)} style={inputStyle} />
                </Field>
                <Field label="Sort order">
                    <input type="number" value={v.sortOrder} onChange={(e) => update("sortOrder", Number(e.target.value))} style={inputStyle} />
                </Field>
                <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#5A5550", padding: "8px 0" }}>
                    <input type="checkbox" checked={v.active} onChange={(e) => update("active", e.target.checked)} />
                    Active
                </label>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 6 }}>
                <button type="button" onClick={onCancel} style={btnSecondary}>Cancel</button>
                <button type="submit" style={btnPrimary}>{submitLabel}</button>
            </div>
        </form>
    );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <span style={{ fontSize: 12, color: "#5A5550", fontWeight: 600 }}>{label}</span>
            {children}
        </label>
    );
}

function FieldGroup({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div>
            <div style={{ fontSize: 11, letterSpacing: "0.18em", textTransform: "uppercase", color: "#B8954A", fontWeight: 700, marginBottom: 8 }}>
                {title}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}>
                {children}
            </div>
        </div>
    );
}

const inputStyle: React.CSSProperties = {
    padding: "8px 12px",
    border: "1px solid #d4c4a0",
    borderRadius: 6,
    fontSize: 14,
    color: "#14302F",
    background: "#fff",
};

const btnPrimary: React.CSSProperties = {
    padding: "10px 22px",
    background: "#14302F",
    color: "#F7F5F0",
    border: 0,
    borderRadius: 8,
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
};

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
