"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
    type TemplateTab,
    type TemplateField,
    FIXTURE_ROWS,
    GAS_APPLIANCES,
    WATER_METER_FIELDS,
} from "@/lib/fpa/template";
import s from "../fpa.module.css";

export interface FlagEntry {
    label?: string;
    flagType?: string;
    flagNote?: string;
    estCostImpact?: number | null;
    /** Set when this flag is tied to a specific question (inline flag). */
    fieldKey?: string;
    /** Which data tab the flagged field lives on. */
    tab?: string;
}
export interface DiscoveryContext {
    summary: string | null;
    bulletPoints: string[];
    motivation: string | null;
    readiness: string | null;
    concerns: string[];
}
interface Contact {
    name: string | null;
    email: string | null;
    phone: string | null;
    address: string;
}

type DataTab = "siteVisit" | "cityInfo";
type Values = Record<string, unknown>;
interface MatrixValue {
    unitsPerFixture: Record<string, number>;
    counts: Record<string, { main: number; adu: number }>;
    waterMeter: Record<string, string>;
    gas: Record<string, string>;
}

const FLAG_OPTIONS = [
    { value: "COST_ADDER", label: "Cost adder" },
    { value: "CONCERN", label: "Concern" },
    { value: "QUESTION", label: "Open question" },
];
const FLAG_LABEL: Record<string, string> = {
    COST_ADDER: "Cost adder",
    CONCERN: "Concern",
    QUESTION: "Open question",
};
const TAB_LABEL: Record<string, string> = {
    siteVisit: "Site Visit Info",
    cityInfo: "City Info",
};
const money = (n: number) =>
    n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

function tagClass(type?: string) {
    if (type === "COST_ADDER") return s.tagCost;
    if (type === "QUESTION") return s.tagQuestion;
    return s.tagConcern;
}

// Autosave buffer: how long to wait after the last keystroke before persisting.
const AUTOSAVE_DELAY_MS = 1200;

type DraftState =
    | { state: "idle" }
    | { state: "pending" }
    | { state: "saving" }
    | { state: "saved"; at: string }
    | { state: "error"; message: string };

// Stable stringify (sorted keys) so the fingerprint is order-independent — a
// re-render that reshuffles object keys won't look like a real edit.
function stableStringify(value: unknown): string {
    if (value === null || typeof value !== "object") return JSON.stringify(value) ?? "null";
    if (Array.isArray(value)) return "[" + value.map(stableStringify).join(",") + "]";
    const obj = value as Record<string, unknown>;
    return (
        "{" +
        Object.keys(obj)
            .sort()
            .map((k) => JSON.stringify(k) + ":" + stableStringify(obj[k]))
            .join(",") +
        "}"
    );
}
function fingerprint(siteVisit: Values, cityInfo: Values, flags: FlagEntry[]): string {
    return stableStringify({ siteVisit, cityInfo, flags });
}

function defaultMatrix(): MatrixValue {
    const unitsPerFixture: Record<string, number> = {};
    const counts: Record<string, { main: number; adu: number }> = {};
    for (const r of FIXTURE_ROWS) {
        unitsPerFixture[r.key] = r.unitsPerFixture;
        counts[r.key] = { main: 0, adu: 0 };
    }
    return { unitsPerFixture, counts, waterMeter: {}, gas: {} };
}

export function FpaForm({
    analysisId,
    engagementId,
    template,
    contact,
    discovery,
    initialSiteVisit,
    initialCityInfo,
    initialFlags,
    readOnly,
}: {
    analysisId: string;
    engagementId: string | null;
    template: TemplateTab[];
    contact: Contact;
    discovery: DiscoveryContext;
    initialSiteVisit: Values;
    initialCityInfo: Values;
    initialFlags: FlagEntry[];
    readOnly: boolean;
}) {
    const router = useRouter();
    const [tab, setTab] = useState<DataTab | "flags">("siteVisit");
    const [siteVisit, setSiteVisit] = useState<Values>(initialSiteVisit);
    const [cityInfo, setCityInfo] = useState<Values>(initialCityInfo);
    const [flags, setFlags] = useState<FlagEntry[]>(initialFlags);
    const [busy, setBusy] = useState(false);
    const [draft, setDraft] = useState<DraftState>({ state: "idle" });
    const [error, setError] = useState<string | null>(null);

    const tabValues = (t: DataTab) => (t === "siteVisit" ? siteVisit : cityInfo);
    const setTabValue = (t: DataTab, key: string, value: unknown) => {
        const setter = t === "siteVisit" ? setSiteVisit : setCityInfo;
        setter((prev) => ({ ...prev, [key]: value }));
    };

    // ── Flag helpers ──────────────────────────────────────────────────────
    // Inline flags are keyed by the field they're attached to; general flags
    // (no fieldKey) live on the Flags tab and are edited by array index.
    const flagFor = (fieldKey: string) => flags.find((f) => f.fieldKey === fieldKey);
    const fieldFlags = flags.filter((f) => f.fieldKey);
    const generalFlags = flags
        .map((f, i) => ({ f, i }))
        .filter((x) => !x.f.fieldKey);
    const costTotal = flags
        .filter((f) => f.flagType === "COST_ADDER")
        .reduce((sum, f) => sum + (Number(f.estCostImpact) || 0), 0);

    const flagCountByTab = (t: DataTab) => flags.filter((f) => f.tab === t).length;

    function addFieldFlag(fieldKey: string, label: string, t: DataTab) {
        setFlags((p) => [
            ...p,
            { fieldKey, label, tab: t, flagType: "COST_ADDER", estCostImpact: null, flagNote: "" },
        ]);
    }
    function removeFieldFlag(fieldKey: string) {
        setFlags((p) => p.filter((f) => f.fieldKey !== fieldKey));
    }
    function patchFieldFlag(fieldKey: string, patch: Partial<FlagEntry>) {
        setFlags((p) => p.map((f) => (f.fieldKey === fieldKey ? { ...f, ...patch } : f)));
    }
    function patchByIndex(i: number, patch: Partial<FlagEntry>) {
        setFlags((p) => p.map((x, j) => (j === i ? { ...x, ...patch } : x)));
    }
    function removeByIndex(i: number) {
        setFlags((p) => p.filter((_, j) => j !== i));
    }

    function renderField(t: DataTab, f: TemplateField) {
        const v = tabValues(t)[f.key];
        if (f.kind === "textarea") {
            return (
                <textarea
                    className={s.textarea}
                    style={{ minHeight: 68 }}
                    value={(v as string) ?? ""}
                    disabled={readOnly}
                    onChange={(e) => setTabValue(t, f.key, e.target.value)}
                />
            );
        }
        if (f.kind === "yn") {
            return (
                <select
                    className={s.select}
                    value={(v as string) ?? ""}
                    disabled={readOnly}
                    onChange={(e) => setTabValue(t, f.key, e.target.value)}
                >
                    <option value="">—</option>
                    <option value="yes">Yes</option>
                    <option value="no">No</option>
                    <option value="unsure">Unsure</option>
                </select>
            );
        }
        return (
            <input
                className={s.input}
                type={f.kind === "number" ? "number" : "text"}
                value={(v as string | number | undefined) ?? ""}
                disabled={readOnly}
                onChange={(e) => setTabValue(t, f.key, e.target.value)}
            />
        );
    }

    // The inline "flag for sales" panel shown beneath a flagged question.
    function renderFlagPanel(fieldKey: string) {
        const flag = flagFor(fieldKey);
        if (!flag) return null;
        return (
            <div className={s.flagPanel}>
                <div className={s.flagPanelRow}>
                    <div className={s.flagField}>
                        <label className={s.label}>Flag type</label>
                        <select
                            className={s.select}
                            disabled={readOnly}
                            value={flag.flagType ?? "COST_ADDER"}
                            onChange={(e) => patchFieldFlag(fieldKey, { flagType: e.target.value })}
                        >
                            {FLAG_OPTIONS.map((o) => (
                                <option key={o.value} value={o.value}>
                                    {o.label}
                                </option>
                            ))}
                        </select>
                    </div>
                    {flag.flagType === "COST_ADDER" && (
                        <div className={s.flagCost}>
                            <label className={s.label}>Est. cost ($)</label>
                            <input
                                className={s.input}
                                type="number"
                                disabled={readOnly}
                                value={flag.estCostImpact ?? ""}
                                onChange={(e) =>
                                    patchFieldFlag(fieldKey, {
                                        estCostImpact:
                                            e.target.value === "" ? null : Number(e.target.value),
                                    })
                                }
                            />
                        </div>
                    )}
                </div>
                <div className={s.flagField} style={{ marginTop: 10 }}>
                    <label className={s.label}>Note for sales</label>
                    <textarea
                        className={s.textarea}
                        style={{ minHeight: 56 }}
                        placeholder="What should the sales team know about this item?"
                        disabled={readOnly}
                        value={flag.flagNote ?? ""}
                        onChange={(e) => patchFieldFlag(fieldKey, { flagNote: e.target.value })}
                    />
                </div>
            </div>
        );
    }

    // A single flaggable question: label + flag toggle, response input, then the
    // inline flag panel when flagged.
    function renderQuestion(t: DataTab, f: TemplateField) {
        const flag = flagFor(f.key);
        const wide = f.kind === "textarea" || !!flag;
        return (
            <div
                key={f.key}
                className={`${s.field} ${wide ? s.fieldWide : ""} ${flag ? s.fieldFlagged : ""}`}
            >
                <div className={s.fieldHead}>
                    <label className={s.label}>{f.label}</label>
                    {!readOnly && (
                        <button
                            type="button"
                            className={`${s.flagBtn} ${flag ? s.flagBtnActive : ""}`}
                            title={flag ? "Remove flag" : "Flag this item for the sales team"}
                            onClick={() =>
                                flag ? removeFieldFlag(f.key) : addFieldFlag(f.key, f.label, t)
                            }
                        >
                            <svg width="11" height="11" viewBox="0 0 24 24" fill={flag ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
                                <line x1="4" y1="22" x2="4" y2="15" />
                            </svg>
                            {flag ? "Flagged" : "Flag"}
                        </button>
                    )}
                </div>
                {f.hint && <span className={s.hint}>{f.hint}</span>}
                {renderField(t, f)}
                {renderFlagPanel(f.key)}
            </div>
        );
    }

    // ── Fixture matrix ────────────────────────────────────────────────────
    const matrix: MatrixValue = (siteVisit.fixtures as MatrixValue | undefined) ?? defaultMatrix();
    function setMatrix(next: MatrixValue) {
        setSiteVisit((prev) => ({ ...prev, fixtures: next }));
    }
    const totals = (() => {
        let main = 0;
        let adu = 0;
        for (const r of FIXTURE_ROWS) {
            const upf = matrix.unitsPerFixture[r.key] ?? r.unitsPerFixture;
            const c = matrix.counts[r.key] ?? { main: 0, adu: 0 };
            main += (Number(c.main) || 0) * upf;
            adu += (Number(c.adu) || 0) * upf;
        }
        return { main, adu, property: main + adu };
    })();

    function renderMatrix() {
        return (
            <div>
                <div className={s.tableWrap}>
                    <table className={s.table}>
                        <thead>
                            <tr>
                                <th>Fixture</th>
                                <th># main</th>
                                <th>units/fix</th>
                                <th>main units</th>
                                <th># ADU</th>
                                <th>ADU units</th>
                            </tr>
                        </thead>
                        <tbody>
                            {FIXTURE_ROWS.map((r) => {
                                const upf = matrix.unitsPerFixture[r.key] ?? r.unitsPerFixture;
                                const c = matrix.counts[r.key] ?? { main: 0, adu: 0 };
                                return (
                                    <tr key={r.key}>
                                        <td>{r.label}</td>
                                        <td>
                                            <input
                                                className={`${s.input} ${s.cellNum}`}
                                                type="number"
                                                disabled={readOnly}
                                                value={c.main ?? 0}
                                                onChange={(e) =>
                                                    setMatrix({
                                                        ...matrix,
                                                        counts: { ...matrix.counts, [r.key]: { ...c, main: Number(e.target.value) } },
                                                    })
                                                }
                                            />
                                        </td>
                                        <td>
                                            <input
                                                className={`${s.input} ${s.cellNum}`}
                                                type="number"
                                                disabled={readOnly}
                                                value={upf}
                                                onChange={(e) =>
                                                    setMatrix({
                                                        ...matrix,
                                                        unitsPerFixture: { ...matrix.unitsPerFixture, [r.key]: Number(e.target.value) },
                                                    })
                                                }
                                            />
                                        </td>
                                        <td className={s.cellComputed}>{((Number(c.main) || 0) * upf).toFixed(1)}</td>
                                        <td>
                                            <input
                                                className={`${s.input} ${s.cellNum}`}
                                                type="number"
                                                disabled={readOnly}
                                                value={c.adu ?? 0}
                                                onChange={(e) =>
                                                    setMatrix({
                                                        ...matrix,
                                                        counts: { ...matrix.counts, [r.key]: { ...c, adu: Number(e.target.value) } },
                                                    })
                                                }
                                            />
                                        </td>
                                        <td className={s.cellComputed}>{((Number(c.adu) || 0) * upf).toFixed(1)}</td>
                                    </tr>
                                );
                            })}
                            <tr className={s.totalRow}>
                                <td>Totals</td>
                                <td />
                                <td />
                                <td className={s.cellComputed}>{totals.main.toFixed(1)}</td>
                                <td />
                                <td className={s.cellComputed}>{totals.adu.toFixed(1)}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <p className={s.matrixTotal}>
                    Total property fixture units: <strong>{totals.property.toFixed(1)}</strong>
                </p>

                <h3 className={s.subhead}>Water meter design</h3>
                <div className={s.fieldGrid}>
                    {WATER_METER_FIELDS.map((f) => (
                        <div key={f.key} className={`${s.field} ${f.kind === "textarea" ? s.fieldWide : ""}`}>
                            <label className={s.label}>{f.label}</label>
                            {f.kind === "textarea" ? (
                                <textarea
                                    className={s.textarea}
                                    style={{ minHeight: 56 }}
                                    disabled={readOnly}
                                    value={matrix.waterMeter[f.key] ?? ""}
                                    onChange={(e) => setMatrix({ ...matrix, waterMeter: { ...matrix.waterMeter, [f.key]: e.target.value } })}
                                />
                            ) : (
                                <input
                                    className={s.input}
                                    disabled={readOnly}
                                    value={matrix.waterMeter[f.key] ?? ""}
                                    onChange={(e) => setMatrix({ ...matrix, waterMeter: { ...matrix.waterMeter, [f.key]: e.target.value } })}
                                />
                            )}
                        </div>
                    ))}
                </div>

                <h3 className={s.subhead}>Main house gas appliances</h3>
                <div className={s.checkGrid}>
                    {GAS_APPLIANCES.map((g) => {
                        const on = matrix.gas[g.key] === "yes";
                        return (
                            <label key={g.key} className={`${s.checkChip} ${on ? s.checkChipOn : ""}`}>
                                <input
                                    type="checkbox"
                                    disabled={readOnly}
                                    checked={on}
                                    onChange={(e) => setMatrix({ ...matrix, gas: { ...matrix.gas, [g.key]: e.target.checked ? "yes" : "no" } })}
                                />
                                <span>{g.label}</span>
                            </label>
                        );
                    })}
                </div>
            </div>
        );
    }

    // ── Autosave to the DB (debounced) ────────────────────────────────────
    // Persist the current draft. Returns true on success. `silent` keeps the
    // submit flow from clobbering the autosave status indicator with its own.
    async function persist(silent = false): Promise<boolean> {
        const snapshot = { siteVisit, cityInfo, flags };
        const fp = fingerprint(siteVisit, cityInfo, flags);
        if (!silent) setDraft({ state: "saving" });
        try {
            const res = await fetch(`/api/architect/analyses/${analysisId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(snapshot),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Save failed");
            lastSavedFpRef.current = fp;
            if (!silent) setDraft({ state: "saved", at: new Date().toLocaleTimeString() });
            return true;
        } catch (err) {
            const message = err instanceof Error ? err.message : "Save failed";
            if (!silent) setDraft({ state: "error", message });
            return false;
        }
    }

    // Fingerprint of the last persisted state. Seeded from the initial props so
    // we don't fire a redundant save on mount before the architect edits.
    const lastSavedFpRef = useRef<string>(
        fingerprint(initialSiteVisit, initialCityInfo, initialFlags),
    );
    const persistRef = useRef(persist);
    persistRef.current = persist;

    // Live snapshot of the editable state, read by the unload / unmount flush
    // (which can't depend on render-time closures).
    const latestRef = useRef({ siteVisit, cityInfo, flags });
    latestRef.current = { siteVisit, cityInfo, flags };
    const readOnlyRef = useRef(readOnly);
    readOnlyRef.current = readOnly;

    // Best-effort save that survives a tab close or client-side navigation.
    // `keepalive` lets the PATCH finish even after the page starts unloading.
    // Returns true when there were unsaved edits (so callers can warn the user).
    function flushIfDirty(): boolean {
        if (readOnlyRef.current) return false;
        const { siteVisit: sv, cityInfo: ci, flags: fl } = latestRef.current;
        if (fingerprint(sv, ci, fl) === lastSavedFpRef.current) return false;
        try {
            void fetch(`/api/architect/analyses/${analysisId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ siteVisit: sv, cityInfo: ci, flags: fl }),
                keepalive: true,
            });
        } catch {
            /* best-effort only */
        }
        return true;
    }
    const flushRef = useRef(flushIfDirty);
    flushRef.current = flushIfDirty;

    // Debounced autosave: AUTOSAVE_DELAY_MS after the last edit, persist if the
    // content actually changed. readOnly (submitted) analyses never autosave.
    useEffect(() => {
        if (readOnly) return;
        const fp = fingerprint(siteVisit, cityInfo, flags);
        if (fp === lastSavedFpRef.current) return;
        setDraft({ state: "pending" });
        const t = setTimeout(() => {
            void persistRef.current();
        }, AUTOSAVE_DELAY_MS);
        return () => clearTimeout(t);
    }, [siteVisit, cityInfo, flags, readOnly]);

    // Warn before closing/reloading the tab with unsaved edits, and fire a
    // best-effort save. The native prompt only appears when actually dirty.
    useEffect(() => {
        function onBeforeUnload(e: BeforeUnloadEvent) {
            if (flushRef.current()) {
                e.preventDefault();
                e.returnValue = "";
            }
        }
        window.addEventListener("beforeunload", onBeforeUnload);
        return () => window.removeEventListener("beforeunload", onBeforeUnload);
    }, []);

    // Flush any unsaved edits when leaving the page client-side (unmount).
    useEffect(() => {
        return () => {
            flushRef.current();
        };
    }, []);

    async function onSubmit() {
        if (!window.confirm("Submit this analysis? The sales team will be notified and it will lock for editing.")) return;
        setBusy(true);
        setError(null);
        try {
            // Flush any unsaved edits first so the submitted record is complete.
            if (!(await persist(true))) {
                setError("Couldn't save your latest changes — check your connection and retry.");
                setBusy(false);
                return;
            }
            const res = await fetch(`/api/architect/analyses/${analysisId}/submit`, { method: "POST" });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Submit failed");
            router.push(engagementId ? `/tools/engagements/${engagementId}` : "/tools/fpa");
        } catch (err) {
            setError(err instanceof Error ? err.message : String(err));
            setBusy(false);
        }
    }

    const activeTabDef = template.find((t) => t.key === tab);

    // Autosave status, surfaced in the sticky action bar.
    const draftLabel =
        draft.state === "saving"
            ? "Saving…"
            : draft.state === "pending"
              ? "Unsaved changes…"
              : draft.state === "saved"
                ? `Saved ${draft.at}`
                : draft.state === "error"
                  ? `Save failed: ${draft.message}`
                  : "Autosave on";
    const draftTone =
        draft.state === "error" ? "error" : draft.state === "saved" ? "saved" : "muted";

    return (
        <div>
            {/* ── Sticky tab nav ─────────────────────────────────────── */}
            <nav className={s.tabBar}>
                {template.map((t) => (
                    <button
                        key={t.key}
                        className={`${s.tab} ${tab === t.key ? s.tabActive : ""}`}
                        onClick={() => setTab(t.key)}
                    >
                        <span>{t.title}</span>
                        {flagCountByTab(t.key) > 0 && (
                            <span className={s.tabFlagBadge}>{flagCountByTab(t.key)}</span>
                        )}
                    </button>
                ))}
                <button
                    className={`${s.tab} ${tab === "flags" ? s.tabActive : ""}`}
                    onClick={() => setTab("flags")}
                >
                    <span>Flags</span>
                    {flags.length > 0 && <span className={s.tabFlagBadge}>{flags.length}</span>}
                </button>
            </nav>

            {/* Context panels on the Site Visit tab */}
            {tab === "siteVisit" && (
                <>
                    <section className={`${s.panel} ${s.infoPanel}`}>
                        <div className={s.panelHead}>
                            <h2 className={s.panelTitle}>Customer</h2>
                        </div>
                        <div className={s.kv}><span className={s.kvLabel}>Name</span><span className={s.kvVal}>{contact.name || "—"}</span></div>
                        <div className={s.kv}><span className={s.kvLabel}>Address</span><span className={s.kvVal}>{contact.address}</span></div>
                        <div className={s.kv}><span className={s.kvLabel}>Phone</span><span className={s.kvVal}>{contact.phone || "—"}</span></div>
                        <div className={s.kv}><span className={s.kvLabel}>Email</span><span className={s.kvVal}>{contact.email || "—"}</span></div>
                    </section>
                    <section className={`${s.panel} ${s.infoPanel}`}>
                        <div className={s.panelHead}>
                            <h2 className={s.panelTitle}>Discovery (from consultation)</h2>
                        </div>
                        {discovery.summary ? (
                            <>
                                <p className={s.discoverySummary}>{discovery.summary}</p>
                                <div className={s.pillRow}>
                                    {discovery.motivation && <span className={s.metaPill}>motivation: <strong>{discovery.motivation}</strong></span>}
                                    {discovery.readiness && <span className={s.metaPill}>readiness: <strong>{discovery.readiness}</strong></span>}
                                </div>
                                {discovery.bulletPoints.length > 0 && (
                                    <ul className={s.aiList}>
                                        {discovery.bulletPoints.map((b, i) => <li key={i}>{b}</li>)}
                                    </ul>
                                )}
                                {discovery.concerns.length > 0 && (
                                    <p className={s.rowMuted}>Concerns: {discovery.concerns.join("; ")}</p>
                                )}
                            </>
                        ) : (
                            <p className={s.empty}>No consultation on file for this engagement.</p>
                        )}
                    </section>
                </>
            )}

            {/* How-to hint on the data tabs */}
            {(tab === "siteVisit" || tab === "cityInfo") && !readOnly && (
                <p className={s.helpText}>
                    Answer each question, and hit <strong>Flag</strong> on anything the sales team
                    needs to know — a cost adder, a concern, or an open question. Add a note to
                    explain it. Flagged items roll up under the <strong>Flags</strong> tab. Your
                    work saves automatically as you go.
                </p>
            )}

            {/* Template sections for the active data tab */}
            {(tab === "siteVisit" || tab === "cityInfo") && activeTabDef && (
                <>
                    {activeTabDef.sections.map((sec) => {
                        const flaggedInSection = (sec.fields ?? []).filter((f) => flagFor(f.key)).length;
                        return (
                            <section key={sec.key} className={s.panel}>
                                <div className={s.panelHead}>
                                    <h2 className={s.panelTitle}>{sec.title}</h2>
                                    {flaggedInSection > 0 && (
                                        <span className={s.flagCount}>
                                            <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                                                <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
                                            </svg>
                                            {flaggedInSection}
                                        </span>
                                    )}
                                </div>
                                {sec.variant === "reference" ? (
                                    <div className={s.flagList}>
                                        {sec.reference?.map((r, i) => (
                                            <div key={i} className={s.kv}>
                                                <span className={s.kvLabel}>{r.label}</span>
                                                {r.value && <span className={s.kvVal}>{r.value}</span>}
                                            </div>
                                        ))}
                                    </div>
                                ) : sec.variant === "fixtureMatrix" ? (
                                    renderMatrix()
                                ) : (
                                    <div className={s.fieldGrid}>
                                        {sec.fields?.map((f) => renderQuestion(tab as DataTab, f))}
                                    </div>
                                )}
                            </section>
                        );
                    })}
                </>
            )}

            {/* Flags tab — read-only roll-up of inline flags + editable general flags */}
            {tab === "flags" && (
                <>
                    <section className={s.panel}>
                        <div className={s.panelHead}>
                            <h2 className={`${s.panelTitle} ${s.panelAccent}`}>
                                Flagged questions ({fieldFlags.length})
                            </h2>
                            {costTotal > 0 && (
                                <span className={s.rowMuted}>
                                    Cost-adders: <strong>{money(costTotal)}</strong>
                                </span>
                            )}
                        </div>
                        <p className={s.rowMuted} style={{ marginBottom: 14 }}>
                            Everything you flagged across Site Visit &amp; City Info, rolled up for the
                            sales team. Edit a flag on its own question.
                        </p>
                        {fieldFlags.length === 0 ? (
                            <p className={s.empty}>
                                Nothing flagged yet. Use the Flag button next to any question.
                            </p>
                        ) : (
                            <div className={s.flagList}>
                                {fieldFlags.map((fl, i) => (
                                    <div key={i} className={s.flagItem}>
                                        <span className={`${s.tag} ${tagClass(fl.flagType)}`}>
                                            {FLAG_LABEL[fl.flagType ?? ""] ?? "Flag"}
                                        </span>
                                        <span className={s.flagWhat}>{fl.label || "(item)"}</span>
                                        {fl.tab && <span className={s.flagSrc}>· {TAB_LABEL[fl.tab] ?? fl.tab}</span>}
                                        {fl.flagType === "COST_ADDER" && fl.estCostImpact != null && (
                                            <span className={s.flagMoney}>{money(Number(fl.estCostImpact))}</span>
                                        )}
                                        {fl.flagNote && <span className={s.flagItemBody}>{fl.flagNote}</span>}
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>

                    <section className={s.panel}>
                        <div className={s.panelHead}>
                            <h2 className={s.panelTitle}>General flags</h2>
                        </div>
                        <p className={s.rowMuted} style={{ marginBottom: 14 }}>
                            For anything that isn&apos;t tied to a single question.
                        </p>
                        {generalFlags.map(({ f: fl, i }) => (
                            <div key={i} className={s.generalCard}>
                                <div className={s.fieldGrid}>
                                    <div className={s.field}>
                                        <label className={s.label}>What</label>
                                        <input
                                            className={s.input}
                                            disabled={readOnly}
                                            value={fl.label ?? ""}
                                            onChange={(e) => patchByIndex(i, { label: e.target.value })}
                                        />
                                    </div>
                                    <div className={s.field}>
                                        <label className={s.label}>Type</label>
                                        <select
                                            className={s.select}
                                            disabled={readOnly}
                                            value={fl.flagType ?? "COST_ADDER"}
                                            onChange={(e) => patchByIndex(i, { flagType: e.target.value })}
                                        >
                                            {FLAG_OPTIONS.map((o) => (
                                                <option key={o.value} value={o.value}>{o.label}</option>
                                            ))}
                                        </select>
                                    </div>
                                    {fl.flagType === "COST_ADDER" && (
                                        <div className={s.field}>
                                            <label className={s.label}>Estimated cost impact ($)</label>
                                            <input
                                                className={s.input}
                                                type="number"
                                                disabled={readOnly}
                                                value={fl.estCostImpact ?? ""}
                                                onChange={(e) =>
                                                    patchByIndex(i, {
                                                        estCostImpact: e.target.value === "" ? null : Number(e.target.value),
                                                    })
                                                }
                                            />
                                        </div>
                                    )}
                                    <div className={`${s.field} ${s.fieldWide}`}>
                                        <label className={s.label}>Note</label>
                                        <textarea
                                            className={s.textarea}
                                            style={{ minHeight: 56 }}
                                            disabled={readOnly}
                                            value={fl.flagNote ?? ""}
                                            onChange={(e) => patchByIndex(i, { flagNote: e.target.value })}
                                        />
                                    </div>
                                </div>
                                {!readOnly && (
                                    <button className={`${s.btnGhost} ${s.btnDanger}`} style={{ marginTop: 12 }} onClick={() => removeByIndex(i)}>
                                        Remove
                                    </button>
                                )}
                            </div>
                        ))}
                        {!readOnly && (
                            <button
                                className={`${s.btnGhost} ${s.addBtn}`}
                                onClick={() => setFlags((p) => [...p, { flagType: "COST_ADDER", estCostImpact: null }])}
                            >
                                + Add general flag
                            </button>
                        )}
                    </section>
                </>
            )}

            {/* ── Sticky action bar ──────────────────────────────────── */}
            {readOnly ? (
                <div className={`${s.actionBar} ${s.readOnlyBar}`}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                    This analysis has been submitted and is locked for editing.
                </div>
            ) : (
                <div className={s.actionBar}>
                    <div className={s.actionStat}>
                        <strong>{money(costTotal)}</strong>
                        <span>cost adders · {flags.length} flags</span>
                    </div>
                    <div className={s.actionSpacer} />
                    {draftTone === "error" ? (
                        <span className={s.errorNote}>
                            {draftLabel}
                            <button type="button" className={s.btnGhost} style={{ marginLeft: 8, padding: "4px 10px" }} onClick={() => void persist()}>
                                Retry
                            </button>
                        </span>
                    ) : draftTone === "saved" ? (
                        <span className={s.savedNote}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                <path d="M20 6L9 17l-5-5" />
                            </svg>
                            {draftLabel}
                        </span>
                    ) : (
                        <span className={s.rowMuted}>{draftLabel}</span>
                    )}
                    {error && <span className={s.errorNote}>{error}</span>}
                    <button className={s.primaryAction} onClick={onSubmit} disabled={busy}>
                        {busy ? "Submitting…" : "Submit analysis"}
                    </button>
                </div>
            )}
        </div>
    );
}
