"use client";

import { useState, type CSSProperties } from "react";
import { useRouter } from "next/navigation";
import {
    type TemplateTab,
    type TemplateField,
    FIXTURE_ROWS,
    GAS_APPLIANCES,
    WATER_METER_FIELDS,
} from "@/lib/fpa/template";
import s from "../../engagements/engagements.module.css";

export interface FlagEntry {
    label?: string;
    flagType?: string;
    flagNote?: string;
    estCostImpact?: number | null;
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
    const [tab, setTab] = useState<"siteVisit" | "cityInfo" | "flags">("siteVisit");
    const [siteVisit, setSiteVisit] = useState<Values>(initialSiteVisit);
    const [cityInfo, setCityInfo] = useState<Values>(initialCityInfo);
    const [flags, setFlags] = useState<FlagEntry[]>(initialFlags);
    const [busy, setBusy] = useState(false);
    const [savedAt, setSavedAt] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const tabValues = (t: "siteVisit" | "cityInfo") => (t === "siteVisit" ? siteVisit : cityInfo);
    const setTabValue = (t: "siteVisit" | "cityInfo", key: string, value: unknown) => {
        const setter = t === "siteVisit" ? setSiteVisit : setCityInfo;
        setter((prev) => ({ ...prev, [key]: value }));
    };

    function renderField(t: "siteVisit" | "cityInfo", f: TemplateField) {
        const v = tabValues(t)[f.key];
        const common = { disabled: readOnly, className: s.input };
        if (f.kind === "textarea") {
            return (
                <textarea
                    className={s.textarea}
                    style={{ minHeight: 64 }}
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
                {...common}
                type={f.kind === "number" ? "number" : "text"}
                value={(v as string | number | undefined) ?? ""}
                onChange={(e) =>
                    setTabValue(t, f.key, f.kind === "number" ? e.target.value : e.target.value)
                }
            />
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
        const td: CSSProperties = { padding: "4px 6px", borderBottom: "1px solid #f1f5f9", fontSize: 13 };
        const num: CSSProperties = { width: 64 };
        return (
            <div style={{ overflowX: "auto" }}>
                <table style={{ borderCollapse: "collapse", width: "100%", minWidth: 560 }}>
                    <thead>
                        <tr>
                            <th style={{ ...td, textAlign: "left" }}>Fixture</th>
                            <th style={td}># main</th>
                            <th style={td}>units/fix</th>
                            <th style={td}>main units</th>
                            <th style={td}># ADU</th>
                            <th style={td}>ADU units</th>
                        </tr>
                    </thead>
                    <tbody>
                        {FIXTURE_ROWS.map((r) => {
                            const upf = matrix.unitsPerFixture[r.key] ?? r.unitsPerFixture;
                            const c = matrix.counts[r.key] ?? { main: 0, adu: 0 };
                            return (
                                <tr key={r.key}>
                                    <td style={{ ...td, textAlign: "left" }}>{r.label}</td>
                                    <td style={td}>
                                        <input
                                            className={s.input}
                                            style={num}
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
                                    <td style={td}>
                                        <input
                                            className={s.input}
                                            style={num}
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
                                    <td style={td}>{((Number(c.main) || 0) * upf).toFixed(1)}</td>
                                    <td style={td}>
                                        <input
                                            className={s.input}
                                            style={num}
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
                                    <td style={td}>{((Number(c.adu) || 0) * upf).toFixed(1)}</td>
                                </tr>
                            );
                        })}
                        <tr>
                            <td style={{ ...td, fontWeight: 700, textAlign: "left" }}>Totals</td>
                            <td style={td} />
                            <td style={td} />
                            <td style={{ ...td, fontWeight: 700 }}>{totals.main.toFixed(1)}</td>
                            <td style={td} />
                            <td style={{ ...td, fontWeight: 700 }}>{totals.adu.toFixed(1)}</td>
                        </tr>
                    </tbody>
                </table>

                <p className={s.rowMuted} style={{ marginTop: 8 }}>
                    Total property fixture units: <strong>{totals.property.toFixed(1)}</strong>
                </p>

                <h3 className={s.label} style={{ marginTop: 12 }}>Water meter design</h3>
                {WATER_METER_FIELDS.map((f) => (
                    <div key={f.key} className={s.field}>
                        <label className={s.label}>{f.label}</label>
                        {f.kind === "textarea" ? (
                            <textarea
                                className={s.textarea}
                                style={{ minHeight: 48 }}
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

                <h3 className={s.label} style={{ marginTop: 12 }}>Main house gas appliances</h3>
                <div className={s.pillRow}>
                    {GAS_APPLIANCES.map((g) => (
                        <label key={g.key} className={s.consentRow} style={{ margin: 0 }}>
                            <input
                                type="checkbox"
                                disabled={readOnly}
                                checked={matrix.gas[g.key] === "yes"}
                                onChange={(e) => setMatrix({ ...matrix, gas: { ...matrix.gas, [g.key]: e.target.checked ? "yes" : "no" } })}
                            />
                            <span>{g.label}</span>
                        </label>
                    ))}
                </div>
            </div>
        );
    }

    // ── Save / submit ─────────────────────────────────────────────────────
    async function save(): Promise<boolean> {
        setError(null);
        const res = await fetch(`/api/architect/analyses/${analysisId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ siteVisit, cityInfo, flags }),
        });
        const data = await res.json();
        if (!res.ok) {
            setError(data.error || "Save failed");
            return false;
        }
        setSavedAt(new Date().toLocaleTimeString());
        return true;
    }

    async function onSave() {
        setBusy(true);
        await save();
        setBusy(false);
    }

    async function onSubmit() {
        if (!window.confirm("Submit this analysis? The sales team will be notified and it will lock for editing.")) return;
        setBusy(true);
        try {
            if (!(await save())) {
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

    return (
        <div>
            <div className={s.tabs}>
                {template.map((t) => (
                    <button
                        key={t.key}
                        className={`${s.tab} ${tab === t.key ? s.tabActive : ""}`}
                        onClick={() => setTab(t.key)}
                    >
                        {t.title}
                    </button>
                ))}
                <button
                    className={`${s.tab} ${tab === "flags" ? s.tabActive : ""}`}
                    onClick={() => setTab("flags")}
                >
                    Flags ({flags.length})
                </button>
            </div>

            {/* Context panels on the Site Visit tab */}
            {tab === "siteVisit" && (
                <>
                    <section className={s.panel}>
                        <h2 className={s.panelTitle}>Customer</h2>
                        <div className={s.kv}><span className={s.kvLabel}>Name</span><span>{contact.name || "—"}</span></div>
                        <div className={s.kv}><span className={s.kvLabel}>Address</span><span>{contact.address}</span></div>
                        <div className={s.kv}><span className={s.kvLabel}>Phone</span><span>{contact.phone || "—"}</span></div>
                        <div className={s.kv}><span className={s.kvLabel}>Email</span><span>{contact.email || "—"}</span></div>
                    </section>
                    <section className={s.panel}>
                        <h2 className={s.panelTitle}>Discovery (from consultation)</h2>
                        {discovery.summary ? (
                            <>
                                <p style={{ fontSize: 14, margin: "0 0 8px" }}>{discovery.summary}</p>
                                <div className={s.pillRow}>
                                    {discovery.motivation && <span className={s.metaPill}>motivation: {discovery.motivation}</span>}
                                    {discovery.readiness && <span className={s.metaPill}>readiness: {discovery.readiness}</span>}
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

            {/* Template sections for the active data tab */}
            {(tab === "siteVisit" || tab === "cityInfo") && activeTabDef && (
                <>
                    {activeTabDef.sections.map((sec) => (
                        <section key={sec.key} className={s.panel}>
                            <h2 className={s.panelTitle}>{sec.title}</h2>
                            {sec.variant === "reference" ? (
                                <ul className={s.timeline}>
                                    {sec.reference?.map((r, i) => (
                                        <li key={i} className={s.timelineItem}>
                                            <span className={s.timelineType}>{r.label}</span>
                                            {r.value && <span className={s.rowMuted} style={{ marginLeft: 8 }}>{r.value}</span>}
                                        </li>
                                    ))}
                                </ul>
                            ) : sec.variant === "fixtureMatrix" ? (
                                renderMatrix()
                            ) : (
                                sec.fields?.map((f) => (
                                    <div key={f.key} className={s.field}>
                                        <label className={s.label}>{f.label}</label>
                                        {f.hint && <span className={s.rowMuted} style={{ display: "block", fontSize: 11, marginBottom: 2 }}>{f.hint}</span>}
                                        {renderField(tab, f)}
                                    </div>
                                ))
                            )}
                        </section>
                    ))}
                </>
            )}

            {/* Flags tab */}
            {tab === "flags" && (
                <section className={s.panel}>
                    <h2 className={s.panelTitle}>Flags for the estimate</h2>
                    <p className={s.rowMuted} style={{ marginBottom: 12 }}>
                        Anything that adds cost, raises a concern, or needs an answer before a proposal.
                        Cost-adders pre-fill the site-work estimate.
                    </p>
                    {flags.map((fl, i) => (
                        <div key={i} className={s.mktCard}>
                            <div className={s.field}>
                                <label className={s.label}>What</label>
                                <input
                                    className={s.input}
                                    disabled={readOnly}
                                    value={fl.label ?? ""}
                                    onChange={(e) => setFlags((p) => p.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)))}
                                />
                            </div>
                            <div className={s.field}>
                                <label className={s.label}>Type</label>
                                <select
                                    className={s.select}
                                    disabled={readOnly}
                                    value={fl.flagType ?? "COST_ADDER"}
                                    onChange={(e) => setFlags((p) => p.map((x, j) => (j === i ? { ...x, flagType: e.target.value } : x)))}
                                >
                                    {FLAG_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
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
                                        onChange={(e) => setFlags((p) => p.map((x, j) => (j === i ? { ...x, estCostImpact: e.target.value === "" ? null : Number(e.target.value) } : x)))}
                                    />
                                </div>
                            )}
                            <div className={s.field}>
                                <label className={s.label}>Note</label>
                                <input
                                    className={s.input}
                                    disabled={readOnly}
                                    value={fl.flagNote ?? ""}
                                    onChange={(e) => setFlags((p) => p.map((x, j) => (j === i ? { ...x, flagNote: e.target.value } : x)))}
                                />
                            </div>
                            {!readOnly && (
                                <button className={s.btnGhost} onClick={() => setFlags((p) => p.filter((_, j) => j !== i))}>
                                    Remove
                                </button>
                            )}
                        </div>
                    ))}
                    {!readOnly && (
                        <button
                            className={s.btnGhost}
                            onClick={() => setFlags((p) => [...p, { flagType: "COST_ADDER", estCostImpact: null }])}
                        >
                            + Add flag
                        </button>
                    )}
                </section>
            )}

            {/* Action bar */}
            {!readOnly && (
                <section className={s.panel}>
                    <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                        <button className={s.btnGhost} onClick={onSave} disabled={busy}>
                            {busy ? "Saving…" : "Save progress"}
                        </button>
                        <button className={s.primaryAction} onClick={onSubmit} disabled={busy}>
                            Submit analysis
                        </button>
                        {savedAt && <span className={s.rowMuted}>Saved {savedAt}</span>}
                    </div>
                    {error && <p className={s.error}>{error}</p>}
                </section>
            )}
        </div>
    );
}
