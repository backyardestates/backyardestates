"use client";

import { useMemo, useState } from "react";
import type {
    ProposalPrefillPlan,
    AduTypeValue,
    PrefillCostAdder,
} from "@/lib/ai/proposalPrefill";
import s from "./ProposalPrefillModal.module.css";

export type PrefillStatus = "idle" | "loading" | "ready" | "empty" | "error";

// Always-visible status pill so the prefill can never fail silently. Renders
// whenever the tool was opened with ?proposalId&prefill, regardless of whether
// the modal itself is open.
export function PrefillStatusBanner({
    status,
    count,
    error,
    onReview,
    onRetry,
    onDismiss,
}: {
    status: PrefillStatus;
    count: number;
    error: string | null;
    onReview: () => void;
    onRetry: () => void;
    onDismiss: () => void;
}) {
    if (status === "idle") return null;
    return (
        <div className={`${s.banner} ${s[`banner_${status}`] ?? ""}`} role="status" aria-live="polite">
            {status === "loading" && <span className={s.bannerSpinner} aria-hidden="true" />}
            <span className={s.bannerText}>
                {status === "loading" && "Matching consultation & property analysis to this proposal…"}
                {status === "ready" &&
                    `AI found ${count} item${count === 1 ? "" : "s"} to plug in from the consultation & FPA.`}
                {status === "empty" &&
                    "No matchable data found yet. Make sure the consultation + FPA are saved, then re-analyze."}
                {status === "error" && `Couldn't analyze: ${error ?? "something went wrong"}.`}
            </span>
            {status === "ready" && (
                <button type="button" className={s.bannerBtn} onClick={onReview}>
                    Review &amp; apply
                </button>
            )}
            {(status === "empty" || status === "error") && (
                <button type="button" className={s.bannerBtn} onClick={onRetry}>
                    Re-analyze
                </button>
            )}
            <button type="button" className={s.bannerClose} onClick={onDismiss} aria-label="Dismiss">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
                    <path d="M18 6L6 18M6 6l12 12" />
                </svg>
            </button>
        </div>
    );
}

export interface PrefillDecisions {
    customerProfile: {
        name: string | null;
        pipedrivePersonId: string | null;
        pipedriveDealId: string | null;
    } | null;
    motivation: "family" | "income" | "investment" | null;
    aduType: AduTypeValue | null;
    unitSpec: { beds: number | null; baths: number | null } | null;
    suggestedUnitIds: string[];
    financials: { owed: number | null; currentMortgageMonthly: number | null };
    costAdders: {
        catId: string;
        itemId: string | null;
        label: string;
        amount: number | null;
        targetUnitId: string | "all";
    }[];
    featuredStoryIds: string[];
    featuredPropertyIds: string[];
}

interface UnitLite {
    _id: string;
    name?: string | null;
}
interface NamedLite {
    id: string;
    name: string;
}

const MOTIVATIONS = ["family", "income", "investment"] as const;
const ADU_TYPES: AduTypeValue[] = ["detached", "attached", "garage"];

function confClass(c: string) {
    return c === "high" ? s.cHigh : c === "medium" ? s.cMedium : s.cLow;
}

function Chip({ kind }: { kind: string }) {
    return <span className={`${s.chip} ${confClass(kind)}`}>{kind}</span>;
}

function ApproveToggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
    return (
        <div className={s.approve} role="group" aria-label="Approve or decline">
            <button
                type="button"
                className={`${s.approveBtn} ${on ? s.approveOn : ""}`}
                aria-pressed={on}
                onClick={() => onChange(true)}
            >
                Approve
            </button>
            <button
                type="button"
                className={`${s.approveBtn} ${!on ? s.declineOn : ""}`}
                aria-pressed={!on}
                onClick={() => onChange(false)}
            >
                Decline
            </button>
        </div>
    );
}

export function ProposalPrefillModal({
    plan,
    loading,
    customerName,
    selectedAdus,
    stories,
    properties,
    onClose,
    onApply,
    onReanalyze,
}: {
    plan: ProposalPrefillPlan | null;
    loading: boolean;
    customerName: string | null;
    selectedAdus: UnitLite[];
    stories: NamedLite[];
    properties: NamedLite[];
    onClose: () => void;
    onApply: (decisions: PrefillDecisions) => void;
    onReanalyze?: () => void;
}) {
    // ── Local editable state (seeded from the plan) ──────────────────────────
    const [cpOn, setCpOn] = useState(() => !!plan?.customerProfile?.name || !!plan?.customerProfile?.pipedriveDealId);
    const [cpName, setCpName] = useState<string>(plan?.customerProfile?.name ?? "");

    const [mOn, setMOn] = useState(() => !!plan && plan.motivation.confidence !== "low" && !!plan.motivation.value);
    const [mVal, setMVal] = useState<PrefillDecisions["motivation"]>(plan?.motivation.value ?? null);

    const [tOn, setTOn] = useState(() => !!plan && !!plan.aduType.value);
    const [tVal, setTVal] = useState<AduTypeValue | null>(plan?.aduType.value ?? null);

    const [specOn, setSpecOn] = useState(
        () => !!plan && (plan.unitSpec.beds.value != null || plan.unitSpec.baths.value != null),
    );
    const [beds, setBeds] = useState<string>(plan?.unitSpec.beds.value?.toString() ?? "");
    const [baths, setBaths] = useState<string>(plan?.unitSpec.baths.value?.toString() ?? "");

    const [finOn, setFinOn] = useState(
        () => !!plan && (plan.financials.owed.value != null || plan.financials.currentMortgageMonthly.value != null),
    );
    const [owed, setOwed] = useState<string>(plan?.financials.owed.value?.toString() ?? "");
    const [curPmt, setCurPmt] = useState<string>(plan?.financials.currentMortgageMonthly.value?.toString() ?? "");

    type AdderRow = PrefillCostAdder & { _on: boolean; _amount: string; _unit: string };
    const [adders, setAdders] = useState<AdderRow[]>(() =>
        (plan?.costAdders ?? []).map((a) => ({
            ...a,
            _on: true,
            _amount: a.amount != null ? String(a.amount) : "",
            _unit: a.targetUnitIds[0] ?? "all",
        })),
    );

    const [storyIds, setStoryIds] = useState<Set<string>>(
        () => new Set(plan?.featuredStoryIds.value ?? []),
    );
    const [propIds, setPropIds] = useState<Set<string>>(
        () => new Set(plan?.featuredPropertyIds.value ?? []),
    );

    const storyName = useMemo(() => new Map(stories.map((x) => [x.id, x.name])), [stories]);
    const propName = useMemo(() => new Map(properties.map((x) => [x.id, x.name])), [properties]);

    const approvedCount = useMemo(() => {
        let n = 0;
        if (cpOn) n++;
        if (mOn && mVal) n++;
        if (tOn && tVal) n++;
        if (specOn) n++;
        if (finOn) n++;
        n += adders.filter((a) => a._on).length;
        n += storyIds.size + propIds.size;
        return n;
    }, [cpOn, mOn, mVal, tOn, tVal, specOn, finOn, adders, storyIds, propIds]);

    function selectAll(on: boolean) {
        setCpOn(on);
        if (on) {
            if (mVal) setMOn(true);
            if (tVal) setTOn(true);
            setSpecOn(true);
            setFinOn(true);
        } else {
            setMOn(false);
            setTOn(false);
            setSpecOn(false);
            setFinOn(false);
        }
        setAdders((prev) => prev.map((a) => ({ ...a, _on: on })));
        if (plan) {
            setStoryIds(on ? new Set(plan.featuredStoryIds.value) : new Set());
            setPropIds(on ? new Set(plan.featuredPropertyIds.value) : new Set());
        }
    }

    if (loading || !plan) {
        return (
            <div className={s.overlay} role="dialog" aria-modal="true" aria-label="Preparing prefill">
                <div className={s.card}>
                    <div className={s.loading}>
                        <div className={s.spinner} aria-hidden="true" />
                        Reading the consultation &amp; property analysis, and matching it to your proposal…
                    </div>
                </div>
            </div>
        );
    }

    const toggleSet = (setFn: typeof setStoryIds, id: string) =>
        setFn((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });

    function handleApply() {
        onApply({
            customerProfile:
                cpOn && plan
                    ? {
                          name: cpName.trim() || plan.customerProfile.name,
                          pipedrivePersonId: plan.customerProfile.pipedrivePersonId,
                          pipedriveDealId: plan.customerProfile.pipedriveDealId,
                      }
                    : null,
            motivation: mOn ? mVal : null,
            aduType: tOn ? tVal : null,
            unitSpec: specOn
                ? { beds: beds === "" ? null : Number(beds), baths: baths === "" ? null : Number(baths) }
                : null,
            suggestedUnitIds: plan!.suggestedUnitIds.value ?? [],
            financials: {
                owed: finOn && owed !== "" ? Number(owed) : null,
                currentMortgageMonthly: finOn && curPmt !== "" ? Number(curPmt) : null,
            },
            costAdders: adders
                .filter((a) => a._on)
                .map((a) => ({
                    catId: a.catId,
                    itemId: a.itemId,
                    label: a.label,
                    amount: a._amount === "" ? null : Number(a._amount),
                    targetUnitId: a._unit,
                })),
            featuredStoryIds: [...storyIds],
            featuredPropertyIds: [...propIds],
        });
    }

    const suggestedUnits = plan.suggestedUnitIds.value ?? [];

    return (
        <div className={s.overlay} role="dialog" aria-modal="true" aria-labelledby="prefill-title">
            <div className={s.card}>
                <header className={s.header}>
                    <button type="button" className={s.closeBtn} onClick={onClose} aria-label="Close">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
                            <path d="M18 6L6 18M6 6l12 12" />
                        </svg>
                    </button>
                    <p className={s.eyebrow}>AI Prefill</p>
                    <h2 className={s.title} id="prefill-title">
                        Review what we&apos;ll <em>plug in</em>
                    </h2>
                    <p className={s.sub}>
                        Matched from {customerName ? `${customerName}'s ` : "the "}consultation &amp; property
                        analysis. Each row shows what it maps to — approve all, or pick item by item. Nothing
                        is applied until you confirm.
                    </p>
                    <div className={s.headerActions}>
                        <button type="button" className={s.headerBtn} onClick={() => selectAll(true)}>
                            Approve all
                        </button>
                        <button type="button" className={s.headerBtn} onClick={() => selectAll(false)}>
                            Clear all
                        </button>
                        {onReanalyze && (
                            <button type="button" className={s.headerBtn} onClick={onReanalyze}>
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                    <path d="M23 4v6h-6M1 20v-6h6" />
                                    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
                                </svg>
                                Re-analyze
                            </button>
                        )}
                    </div>
                </header>

                <div className={s.body}>
                    {/* Customer profile */}
                    <section className={s.section}>
                        <div className={s.sectionHead}>
                            <h3 className={s.sectionTitle}>
                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                                    <circle cx="12" cy="7" r="4" />
                                </svg>
                                Customer profile
                            </h3>
                            <ApproveToggle on={cpOn} onChange={setCpOn} />
                        </div>
                        <div className={s.fieldRow}>
                            <label className={s.field}>
                                <span className={s.fieldLabel}>Customer name → proposal</span>
                                <input className={s.input} value={cpName} onChange={(e) => setCpName(e.target.value)} />
                            </label>
                        </div>
                        <div className={s.adderMeta} style={{ marginTop: 8 }}>
                            {plan.customerProfile.pipedriveDealId && (
                                <span className={`${s.chip} ${s.cAnswer}`}>
                                    Pipedrive deal #{plan.customerProfile.pipedriveDealId} → linked
                                </span>
                            )}
                            {plan.customerProfile.pipedrivePersonId && (
                                <span className={`${s.chip} ${s.cAnswer}`}>
                                    Person #{plan.customerProfile.pipedrivePersonId}
                                </span>
                            )}
                            {plan.customerProfile.email && <span className={s.fromSource}>{plan.customerProfile.email}</span>}
                            {plan.customerProfile.phone && <span className={s.fromSource}>{plan.customerProfile.phone}</span>}
                        </div>
                        {!plan.customerProfile.pipedriveDealId && !plan.customerProfile.pipedrivePersonId && (
                            <p className={s.rationale}>No Pipedrive deal linked on this engagement.</p>
                        )}
                    </section>

                    {/* Motivation */}
                    <section className={s.section}>
                        <div className={s.sectionHead}>
                            <h3 className={s.sectionTitle}>Customer motivation</h3>
                            <div className={s.chips}>
                                <Chip kind={plan.motivation.confidence} />
                                <ApproveToggle on={mOn} onChange={setMOn} />
                            </div>
                        </div>
                        <div className={s.segRow}>
                            {MOTIVATIONS.map((m) => (
                                <button
                                    key={m}
                                    type="button"
                                    className={`${s.seg} ${mVal === m ? s.segOn : ""}`}
                                    onClick={() => {
                                        setMVal(m);
                                        setMOn(true);
                                    }}
                                >
                                    {m}
                                </button>
                            ))}
                        </div>
                        {plan.motivation.rationale && <p className={s.rationale}>{plan.motivation.rationale}</p>}
                        {plan.motivation.sourceQuote && <p className={s.quote}>“{plan.motivation.sourceQuote}”</p>}
                    </section>

                    {/* ADU type */}
                    <section className={s.section}>
                        <div className={s.sectionHead}>
                            <h3 className={s.sectionTitle}>ADU type</h3>
                            <div className={s.chips}>
                                <Chip kind={plan.aduType.confidence} />
                                <ApproveToggle on={tOn} onChange={setTOn} />
                            </div>
                        </div>
                        <div className={s.segRow}>
                            {ADU_TYPES.map((t) => (
                                <button
                                    key={t}
                                    type="button"
                                    className={`${s.seg} ${tVal === t ? s.segOn : ""}`}
                                    onClick={() => {
                                        setTVal(t);
                                        setTOn(true);
                                    }}
                                >
                                    {t}
                                </button>
                            ))}
                        </div>
                        {plan.aduType.rationale && <p className={s.rationale}>{plan.aduType.rationale}</p>}
                    </section>

                    {/* Unit spec */}
                    <section className={s.section}>
                        <div className={s.sectionHead}>
                            <h3 className={s.sectionTitle}>Unit spec</h3>
                            <ApproveToggle on={specOn} onChange={setSpecOn} />
                        </div>
                        <div className={s.fieldRow}>
                            <label className={s.field}>
                                <span className={s.fieldLabel}>Bedrooms</span>
                                <input className={s.input} type="number" min={0} value={beds} onChange={(e) => setBeds(e.target.value)} />
                            </label>
                            <label className={s.field}>
                                <span className={s.fieldLabel}>Bathrooms</span>
                                <input className={s.input} type="number" min={0} step={0.5} value={baths} onChange={(e) => setBaths(e.target.value)} />
                            </label>
                            {plan.unitSpec.sqft.value != null && (
                                <label className={s.field}>
                                    <span className={s.fieldLabel}>Target sq ft (reference)</span>
                                    <input className={s.input} value={plan.unitSpec.sqft.value} disabled />
                                </label>
                            )}
                        </div>
                        {suggestedUnits.length > 0 && (
                            <p className={s.rationale}>
                                Suggested units to compare:{" "}
                                {suggestedUnits.map((id) => selectedAdus.find((u) => u._id === id)?.name || id).join(", ")} —
                                added on apply.
                            </p>
                        )}
                    </section>

                    {/* Financials */}
                    <section className={s.section}>
                        <div className={s.sectionHead}>
                            <h3 className={s.sectionTitle}>Financials (for ROI comparison)</h3>
                            <ApproveToggle on={finOn} onChange={setFinOn} />
                        </div>
                        <div className={s.fieldRow}>
                            <label className={s.field}>
                                <span className={s.fieldLabel}>Balance owed</span>
                                <input className={s.input} type="number" min={0} placeholder="—" value={owed} onChange={(e) => setOwed(e.target.value)} />
                            </label>
                            <label className={s.field}>
                                <span className={s.fieldLabel}>Current mortgage / mo</span>
                                <input className={s.input} type="number" min={0} placeholder="—" value={curPmt} onChange={(e) => setCurPmt(e.target.value)} />
                            </label>
                        </div>
                        {plan.financials.owed.sourceQuote && <p className={s.quote}>“{plan.financials.owed.sourceQuote}”</p>}
                        {plan.financials.currentMortgageMonthly.sourceQuote && (
                            <p className={s.quote}>“{plan.financials.currentMortgageMonthly.sourceQuote}”</p>
                        )}
                    </section>

                    {/* Cost adders */}
                    <section className={s.section}>
                        <div className={s.sectionHead}>
                            <h3 className={s.sectionTitle}>
                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                    <path d="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                                </svg>
                                Site-work cost adders ({adders.length})
                            </h3>
                        </div>
                        {adders.length === 0 ? (
                            <p className={s.empty}>
                                Nothing matched yet. If the architect noted site work (sewer scope, panel
                                upgrade, trees, etc.), make sure the FPA is saved, then hit Re-analyze.
                            </p>
                        ) : (
                            adders.map((a, i) => (
                                <div key={i} className={`${s.adder} ${a._on ? "" : s.adderDeclined}`}>
                                    <input
                                        type="checkbox"
                                        className={s.checkbox}
                                        checked={a._on}
                                        aria-label={`Include ${a.label}`}
                                        onChange={(e) =>
                                            setAdders((prev) => prev.map((x, j) => (j === i ? { ...x, _on: e.target.checked } : x)))
                                        }
                                    />
                                    <div className={s.adderMain}>
                                        <div className={s.adderLabel}>
                                            {a.label}
                                            <span className={s.mapsTo}>→ {a.catLabel}</span>
                                        </div>
                                        <div className={s.adderMeta}>
                                            <span className={`${s.chip} ${a.source === "flag" ? s.cFlag : s.cAnswer}`}>
                                                {a.source === "flag" ? "Architect flag" : "Matched from FPA"}
                                            </span>
                                            <span className={`${s.chip} ${confClass(a.confidence)}`}>{a.confidence}</span>
                                            {a.sourceLabel && <span className={s.fromSource}>{a.sourceLabel}</span>}
                                        </div>
                                    </div>
                                    <div className={s.adderControls}>
                                        <span className={s.dollar}>
                                            <input
                                                className={`${s.input} ${s.amountInput}`}
                                                type="number"
                                                min={0}
                                                placeholder="0"
                                                value={a._amount}
                                                onChange={(e) =>
                                                    setAdders((prev) => prev.map((x, j) => (j === i ? { ...x, _amount: e.target.value } : x)))
                                                }
                                            />
                                        </span>
                                        <select
                                            className={`${s.select} ${s.unitSelect}`}
                                            value={a._unit}
                                            aria-label="Apply to unit"
                                            onChange={(e) =>
                                                setAdders((prev) => prev.map((x, j) => (j === i ? { ...x, _unit: e.target.value } : x)))
                                            }
                                        >
                                            <option value="all">All units</option>
                                            {selectedAdus.map((u) => (
                                                <option key={u._id} value={u._id}>
                                                    {u.name || "Unit"}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    {a.rationale && <div className={s.adderRationale}>{a.rationale}</div>}
                                </div>
                            ))
                        )}
                    </section>

                    {/* Featured content */}
                    {(plan.featuredStoryIds.value.length > 0 || plan.featuredPropertyIds.value.length > 0) && (
                        <section className={s.section}>
                            <div className={s.sectionHead}>
                                <h3 className={s.sectionTitle}>Featured content</h3>
                            </div>
                            {plan.featuredPropertyIds.value.length > 0 && (
                                <>
                                    <p className={s.note}>Completed builds to feature (matched by size):</p>
                                    <div className={s.checkList}>
                                        {plan.featuredPropertyIds.value.map((id) => (
                                            <label key={id} className={s.checkItem}>
                                                <input type="checkbox" className={s.checkbox} checked={propIds.has(id)} onChange={() => toggleSet(setPropIds, id)} />
                                                <span>{propName.get(id) || id}</span>
                                            </label>
                                        ))}
                                    </div>
                                </>
                            )}
                            {plan.featuredStoryIds.value.length > 0 && (
                                <>
                                    <p className={s.note} style={{ marginTop: 12 }}>Customer stories that fit their motivation/concerns:</p>
                                    <div className={s.checkList}>
                                        {plan.featuredStoryIds.value.map((id) => (
                                            <label key={id} className={s.checkItem}>
                                                <input type="checkbox" className={s.checkbox} checked={storyIds.has(id)} onChange={() => toggleSet(setStoryIds, id)} />
                                                <span>{storyName.get(id) || id}</span>
                                            </label>
                                        ))}
                                    </div>
                                </>
                            )}
                        </section>
                    )}

                    {/* Open items + talking points (display-only) */}
                    {(plan.openItems.length > 0 || plan.talkingPoints.length > 0) && (
                        <section className={s.section}>
                            <div className={s.sectionHead}>
                                <h3 className={s.sectionTitle}>For your follow-through</h3>
                            </div>
                            {plan.openItems.length > 0 && (
                                <>
                                    <p className={s.note}>Resolve before sending (raised by the architect):</p>
                                    {plan.openItems.map((o, i) => (
                                        <div key={i} className={s.openItem}>
                                            <span className={s.openKind}>{o.kind}</span>
                                            <span className={s.openBody}>
                                                {o.label}
                                                {o.note && <span className={s.openNote}>{o.note}</span>}
                                            </span>
                                        </div>
                                    ))}
                                </>
                            )}
                            {plan.talkingPoints.length > 0 && (
                                <>
                                    <p className={s.note} style={{ marginTop: 12 }}>Talking points:</p>
                                    {plan.talkingPoints.map((t, i) => (
                                        <div key={i} className={s.talkPoint}>{t.point}</div>
                                    ))}
                                </>
                            )}
                        </section>
                    )}
                </div>

                <footer className={s.footer}>
                    <span className={s.footerCount}>
                        <strong>{approvedCount}</strong> item{approvedCount === 1 ? "" : "s"} selected
                    </span>
                    <div className={s.spacer} />
                    <button type="button" className={s.btnGhost} onClick={onClose}>
                        Skip
                    </button>
                    <button type="button" className={s.btnPrimary} onClick={handleApply} disabled={approvedCount === 0}>
                        Apply {approvedCount} item{approvedCount === 1 ? "" : "s"}
                    </button>
                </footer>
            </div>
        </div>
    );
}
