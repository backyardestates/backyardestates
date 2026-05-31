"use client";

import React, { useEffect, useRef, useState } from "react";
import type { ProjectTimeline } from "@/lib/store/presentationStore";
import { DEFAULT_PROJECT_TIMELINE } from "@/lib/store/presentationStore";
import s from "./TimelineEditorPanel.module.css";

type PhaseKey = "plans" | "permits" | "build";
type ColKey = "be" | "city";

interface Props {
    /** Current value. `null` means "use defaults" — the editor still seeds inputs. */
    value: ProjectTimeline | null;
    onChange: (next: ProjectTimeline) => void;
    /** Optional — clears overrides back to defaults (sets value to null upstream). */
    onReset?: () => void;
}

// Phase metadata + a swatch class for the proportional bar. Order = real sequence.
const PHASES: { key: PhaseKey; label: string; hint: string; swatch: string }[] = [
    { key: "plans", label: "Plans & Design", hint: "Contract → permit-ready drawings", swatch: "sw1" },
    { key: "permits", label: "Permits", hint: "City review, corrections, approval", swatch: "sw2" },
    { key: "build", label: "Construction", hint: "Ground-break → certificate of occupancy", swatch: "sw3" },
];

function monthsLabel(days: number): string {
    if (!Number.isFinite(days) || days <= 0) return "0";
    return (Math.round((days / 30) * 2) / 2).toString(); // nearest half-month
}

function clampDays(v: number): number {
    if (Number.isNaN(v)) return 0;
    return Math.max(0, Math.min(999, Math.round(v)));
}

// ── Count-up hook (RAF + ease-out cubic). Mirrors the presenter slides' pattern;
//    re-runs whenever the target changes so edits animate smoothly. ───────────
function useCountUp(target: number, durationMs = 750): number {
    const [val, setVal] = useState(target);
    const fromRef = useRef(target);
    const rafRef = useRef<number | null>(null);
    const reduce =
        typeof window !== "undefined" &&
        window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

    useEffect(() => {
        if (reduce) { setVal(target); return; }
        const from = fromRef.current;
        const start = performance.now();
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
        const tick = (now: number) => {
            const t = Math.min((now - start) / durationMs, 1);
            const eased = 1 - Math.pow(1 - t, 3);
            setVal(from + (target - from) * eased);
            if (t < 1) rafRef.current = requestAnimationFrame(tick);
            else fromRef.current = target;
        };
        rafRef.current = requestAnimationFrame(tick);
        return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
    }, [target, durationMs, reduce]);

    return val;
}

export function TimelineEditorPanel({ value, onChange, onReset }: Props) {
    const current = value ?? DEFAULT_PROJECT_TIMELINE;
    const isCustom = value !== null;

    function setCell(col: ColKey, phase: PhaseKey, raw: string) {
        const next: ProjectTimeline = { be: { ...current.be }, city: { ...current.city } };
        next[col][phase] = clampDays(parseInt(raw, 10));
        onChange(next);
    }

    const beTotal = current.be.plans + current.be.permits + current.be.build;
    const cityTotal = current.city.plans + current.city.permits + current.city.build;
    const maxTotal = Math.max(beTotal, cityTotal, 1);
    const saved = Math.max(0, cityTotal - beTotal);
    const fasterPct = cityTotal > 0 ? Math.round((saved / cityTotal) * 100) : 0;

    // Trigger the bar reveal once on mount.
    const [revealed, setRevealed] = useState(false);
    useEffect(() => {
        const id = requestAnimationFrame(() => setRevealed(true));
        return () => cancelAnimationFrame(id);
    }, []);

    // Animated headline figures.
    const savedMonths = useCountUp(saved / 30);
    const beMonthsAnim = useCountUp(beTotal / 30);
    const cityMonthsAnim = useCountUp(cityTotal / 30);

    // Shared px-per-day scale: BOTH bars map days→% against the slower total, so
    // their lengths are directly comparable and BE visibly stops short.
    const bePct = (beTotal / maxTotal) * 100;

    // One proportional comparison bar. `lead` flag styles the faster (BE) row.
    function Bar({ col, lead }: { col: ColKey; lead: boolean }) {
        const row = current[col];
        const total = col === "be" ? beTotal : cityTotal;
        const fillPct = (total / maxTotal) * 100;
        return (
            <div className={s.barTrack}>
                <div
                    className={`${s.barFill} ${lead ? s.barFillLead : ""}`}
                    style={{ width: revealed ? `${fillPct}%` : "0%" }}
                >
                    {PHASES.map((p, i) => {
                        const d = row[p.key];
                        if (d <= 0) return null;
                        const pct = (d / total) * 100;
                        return (
                            <div
                                key={p.key}
                                className={`${s.barSeg} ${s[p.swatch]}`}
                                style={{ width: `${pct}%`, transitionDelay: `${i * 60}ms` }}
                                title={`${p.label} — ${d} days`}
                            >
                                {pct >= 15 && <span className={s.barSegLabel}>{d}</span>}
                            </div>
                        );
                    })}
                </div>
                {/* The "finish line": on the slower (city) row, mark where BE
                    already finished — the speed gap made literal. */}
                {!lead && saved > 0 && (
                    <div
                        className={s.finishLine}
                        style={{ left: revealed ? `${bePct}%` : "0%" }}
                        aria-hidden
                    >
                        <span className={s.finishFlag}>BE done</span>
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className={s.panel}>
            {/* ── Hero: the headline advantage ─────────────────────────────── */}
            <div className={s.hero}>
                <div className={s.heroLeft}>
                    <span className={s.eyebrow}>Project timeline</span>
                    <h3 className={s.heroTitle}>
                        Built in{" "}
                        <span className={s.heroAccent}>
                            {monthsLabel(beTotal)} months
                        </span>
                        {saved > 0 && <> — not {monthsLabel(cityTotal)}.</>}
                    </h3>
                    <span className={s.heroSub}>
                        Days per phase, us vs. the city average. Drives the timeline slide.
                        {isCustom ? " · Customized" : " · Using defaults"}
                    </span>
                </div>
                {saved > 0 && (
                    <div
                        className={s.heroStat}
                        aria-label={`About ${monthsLabel(saved)} months, ${fasterPct} percent, faster than the city average`}
                    >
                        <span className={s.heroStatNum}>~{savedMonths.toFixed(1).replace(/\.0$/, "")}</span>
                        <span className={s.heroStatMeta}>
                            <span className={s.heroStatUnit}>months faster</span>
                            <span className={s.heroStatPct}>{fasterPct}% quicker</span>
                        </span>
                    </div>
                )}
            </div>

            {/* ── Shared-scale comparison (the bigger picture) ─────────────── */}
            <div className={s.compare}>
                <div className={s.compareRow}>
                    <div className={s.compareLabel}>
                        <span className={`${s.compareName} ${s.compareNameLead}`}>
                            <span className={s.leadDot} aria-hidden />
                            Backyard Estates
                        </span>
                        <span className={s.compareTotal}>
                            <span className={s.compareDays}>{beTotal.toLocaleString()}</span> days
                            <span className={s.compareMonths}>≈ {beMonthsAnim.toFixed(1).replace(/\.0$/, "")} mo</span>
                        </span>
                    </div>
                    <Bar col="be" lead />
                </div>
                <div className={s.compareRow}>
                    <div className={s.compareLabel}>
                        <span className={s.compareName}>City average</span>
                        <span className={s.compareTotal}>
                            <span className={s.compareDays}>{cityTotal.toLocaleString()}</span> days
                            <span className={s.compareMonths}>≈ {cityMonthsAnim.toFixed(1).replace(/\.0$/, "")} mo</span>
                        </span>
                    </div>
                    <Bar col="city" lead={false} />
                </div>

                {/* Legend — keeps meaning off color alone. */}
                <div className={s.legend}>
                    {PHASES.map((p) => (
                        <span key={p.key} className={s.legendItem}>
                            <span className={`${s.legendDot} ${s[p.swatch]}`} aria-hidden />
                            {p.label}
                        </span>
                    ))}
                </div>
            </div>

            {/* ── Phase cards — BE + City day inputs ───────────────────────── */}
            <div className={s.grid}>
                {PHASES.map((phase, i) => {
                    const be = current.be[phase.key];
                    const city = current.city[phase.key];
                    const faster = city - be;
                    return (
                        <div key={phase.key} className={s.card} style={{ animationDelay: `${i * 60}ms` }}>
                            <div className={s.cardHead}>
                                <span className={`${s.cardSwatch} ${s[phase.swatch]}`} aria-hidden>
                                    {i + 1}
                                </span>
                                <div className={s.cardTitles}>
                                    <span className={s.phaseLabel}>{phase.label}</span>
                                    <span className={s.phaseHint}>{phase.hint}</span>
                                </div>
                                {faster > 0 && (
                                    <span className={s.cardBadge} title={`${faster} days faster than city`}>
                                        −{faster}d
                                    </span>
                                )}
                            </div>

                            <div className={s.cellRow}>
                                <label className={`${s.cell} ${s.cellLead}`}>
                                    <span className={s.cellLabel}>Backyard Estates</span>
                                    <span className={s.inputWrap}>
                                        <input
                                            type="number"
                                            min={0}
                                            step={1}
                                            className={s.input}
                                            value={be}
                                            onChange={(e) => setCell("be", phase.key, e.target.value)}
                                            aria-label={`Backyard Estates ${phase.label} days`}
                                        />
                                        <span className={s.unit}>days</span>
                                    </span>
                                </label>
                                <label className={s.cell}>
                                    <span className={s.cellLabel}>City average</span>
                                    <span className={s.inputWrap}>
                                        <input
                                            type="number"
                                            min={0}
                                            step={1}
                                            className={s.input}
                                            value={city}
                                            onChange={(e) => setCell("city", phase.key, e.target.value)}
                                            aria-label={`City average ${phase.label} days`}
                                        />
                                        <span className={s.unit}>days</span>
                                    </span>
                                </label>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* ── Footer ───────────────────────────────────────────────────── */}
            <div className={s.footer}>
                <span className={s.footerNote}>Leave a phase at 0 to hide it from the slide.</span>
                {onReset && (
                    <button
                        type="button"
                        className={s.resetBtn}
                        onClick={onReset}
                        disabled={!isCustom}
                    >
                        Reset to defaults
                    </button>
                )}
            </div>
        </div>
    );
}
