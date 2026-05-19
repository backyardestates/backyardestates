"use client";

import React from "react";
import {
    DEFAULT_PROJECT_TIMELINE,
    type ProjectTimeline,
} from "@/lib/store/presentationStore";
import s from "./TimelineEditorPanel.module.css";

type PhaseKey = "plans" | "permits" | "build";
type ColKey = "be" | "city";

const PHASES: { key: PhaseKey; label: string; helper: string }[] = [
    { key: "plans",   label: "Plans & Design", helper: "From contract sign to permit-ready drawings." },
    { key: "permits", label: "Permits",        helper: "City review, corrections, and approval." },
    { key: "build",   label: "Construction",   helper: "Ground-break through certificate of occupancy." },
];

interface Props {
    /** Current value. `null` means \"use defaults\" — the editor still seeds inputs. */
    value: ProjectTimeline | null;
    onChange: (next: ProjectTimeline) => void;
    /** Optional — clears overrides back to defaults (sets value to null upstream). */
    onReset?: () => void;
}

function daysToMonths(days: number): string {
    if (!Number.isFinite(days) || days <= 0) return "0";
    const months = days / 30;
    const rounded = Math.round(months * 2) / 2; // nearest half
    return rounded.toString();
}

export function TimelineEditorPanel({ value, onChange, onReset }: Props) {
    const current = value ?? DEFAULT_PROJECT_TIMELINE;

    function setCell(col: ColKey, phase: PhaseKey, raw: string) {
        const n = parseInt(raw, 10);
        const safe = Number.isFinite(n) && n >= 0 ? n : 0;
        const next: ProjectTimeline = {
            be:   { ...current.be },
            city: { ...current.city },
        };
        next[col][phase] = safe;
        onChange(next);
    }

    const beTotalDays = current.be.plans + current.be.permits + current.be.build;
    const cityTotalDays = current.city.plans + current.city.permits + current.city.build;
    const beMonths = daysToMonths(beTotalDays);
    const cityMonths = daysToMonths(cityTotalDays);

    return (
        <div className={s.panel}>
            <div className={s.tableHead}>
                <div className={s.headPhase}>Phase</div>
                <div className={s.headCol}>
                    <span className={s.headColTitle}>Backyard Estates</span>
                    <span className={s.headColSub}>our days</span>
                </div>
                <div className={s.headCol}>
                    <span className={s.headColTitle}>City Average</span>
                    <span className={s.headColSub}>their days</span>
                </div>
            </div>

            {PHASES.map((phase) => (
                <div key={phase.key} className={s.row}>
                    <div className={s.phaseCell}>
                        <span className={s.phaseLabel}>{phase.label}</span>
                        <span className={s.phaseHelper}>{phase.helper}</span>
                    </div>
                    <div className={s.inputCell}>
                        <input
                            type="number"
                            min={0}
                            step={1}
                            value={current.be[phase.key]}
                            onChange={(e) => setCell("be", phase.key, e.target.value)}
                            className={s.input}
                            aria-label={`Backyard Estates ${phase.label} days`}
                        />
                        <span className={s.unit}>days</span>
                    </div>
                    <div className={s.inputCell}>
                        <input
                            type="number"
                            min={0}
                            step={1}
                            value={current.city[phase.key]}
                            onChange={(e) => setCell("city", phase.key, e.target.value)}
                            className={s.input}
                            aria-label={`City average ${phase.label} days`}
                        />
                        <span className={s.unit}>days</span>
                    </div>
                </div>
            ))}

            <div className={s.totalsRow}>
                <div className={s.totalsLabel}>Total project length</div>
                <div className={s.totalCell}>
                    <span className={s.totalNum}>~{beMonths}</span>
                    <span className={s.totalUnit}>months</span>
                    <span className={s.totalDays}>({beTotalDays.toLocaleString()} days)</span>
                </div>
                <div className={s.totalCell}>
                    <span className={s.totalNum}>~{cityMonths}</span>
                    <span className={s.totalUnit}>months</span>
                    <span className={s.totalDays}>({cityTotalDays.toLocaleString()} days)</span>
                </div>
            </div>

            {onReset && (
                <div className={s.actions}>
                    <button type="button" className={s.resetBtn} onClick={onReset}>
                        Reset to defaults
                    </button>
                </div>
            )}
        </div>
    );
}
