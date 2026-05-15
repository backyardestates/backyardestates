"use client";

import React, { useState, useMemo, useEffect } from "react";
import type { Floorplan } from "@/lib/rentcast/types";
import {
    type EstimatorState,
    computeTotal,
    createEmptyState,
} from "@/lib/investment/siteWorkItems";
import { money } from "@/lib/investment/format";
import { SiteWorkEstimator } from "./SiteWorkEstimator";
import s from "./SiteWorkPanel.module.css";

const LS_MASTER_KEY = "swp_master";
const LS_CUSTOM_KEY = "swp_custom";

function loadLS<T>(key: string, fallback: T): T {
    if (typeof window === "undefined") return fallback;
    try {
        const raw = localStorage.getItem(key);
        return raw ? (JSON.parse(raw) as T) : fallback;
    } catch {
        return fallback;
    }
}

interface Props {
    selectedAdus: Floorplan[];
    estimatorByAduId: Record<string, EstimatorState>;
    setEstimatorByAduId: React.Dispatch<React.SetStateAction<Record<string, EstimatorState>>>;
}

export function SiteWorkPanel({ selectedAdus, setEstimatorByAduId }: Props) {
    const [masterEstimator, setMasterEstimator] = useState<EstimatorState>(() =>
        loadLS<EstimatorState>(LS_MASTER_KEY, createEmptyState())
    );
    // null = synced to master; EstimatorState = custom override
    const [customByAduId, setCustomByAduId] = useState<Record<string, EstimatorState | null>>(() =>
        loadLS<Record<string, EstimatorState | null>>(LS_CUSTOM_KEY, {})
    );

    // Persist to localStorage whenever state changes
    useEffect(() => {
        try { localStorage.setItem(LS_MASTER_KEY, JSON.stringify(masterEstimator)); } catch { /* quota */ }
    }, [masterEstimator]);

    useEffect(() => {
        try { localStorage.setItem(LS_CUSTOM_KEY, JSON.stringify(customByAduId)); } catch { /* quota */ }
    }, [customByAduId]);
    const [expandedAduId, setExpandedAduId] = useState<string | null>(null);

    // Keep estimatorByAduId in sync with effective states
    useEffect(() => {
        setEstimatorByAduId(() => {
            const next: Record<string, EstimatorState> = {};
            for (const fp of selectedAdus) {
                next[fp._id] = customByAduId[fp._id] ?? masterEstimator;
            }
            return next;
        });
    }, [masterEstimator, customByAduId, selectedAdus, setEstimatorByAduId]);

    function getEffective(aduId: string): EstimatorState {
        return customByAduId[aduId] ?? masterEstimator;
    }

    function isCustom(aduId: string): boolean {
        return customByAduId[aduId] != null;
    }

    function syncedCount(): number {
        return selectedAdus.filter((fp) => !isCustom(fp._id)).length;
    }

    function handleCustomize(aduId: string) {
        if (!isCustom(aduId)) {
            // Deep-copy master as the starting point for this unit's override
            setCustomByAduId((prev) => ({
                ...prev,
                [aduId]: {
                    quantities: { ...masterEstimator.quantities },
                    customItems: masterEstimator.customItems.map((ci) => ({ ...ci })),
                    overrides: { ...(masterEstimator.overrides ?? {}) },
                },
            }));
        }
        setExpandedAduId((prev) => (prev === aduId ? null : aduId));
    }

    function handleUnitChange(aduId: string, next: EstimatorState) {
        setCustomByAduId((prev) => ({ ...prev, [aduId]: next }));
    }

    function handleReset(aduId: string) {
        setCustomByAduId((prev) => {
            const next = { ...prev };
            delete next[aduId];
            return next;
        });
        if (expandedAduId === aduId) setExpandedAduId(null);
    }

    function handleApplyToAll(aduId: string) {
        setMasterEstimator(getEffective(aduId));
        setCustomByAduId({});
        setExpandedAduId(null);
    }

    const expandedFp = useMemo(
        () => (expandedAduId ? selectedAdus.find((fp) => fp._id === expandedAduId) ?? null : null),
        [expandedAduId, selectedAdus]
    );

    if (selectedAdus.length === 0) return null;

    return (
        <div className={s.panel}>
            {/* ── Unit summary cards ─────────────────────────────────────── */}
            <div className={s.unitRow}>
                {selectedAdus.map((fp) => {
                    const custom = isCustom(fp._id);
                    const total = computeTotal(getEffective(fp._id));
                    const isExpanded = expandedAduId === fp._id;

                    return (
                        <div
                            key={fp._id}
                            className={`${s.unitCard} ${custom ? s.unitCardCustom : ""}`}
                        >
                            <div className={s.unitName}>{fp.name}</div>
                            <div className={s.unitTotal}>{total > 0 ? money(total) : "—"}</div>
                            <div
                                className={`${s.statusPill} ${
                                    custom ? s.statusPillCustom : s.statusPillSynced
                                }`}
                            >
                                {custom ? "Custom" : "Synced"}
                            </div>
                            <div className={s.unitActions}>
                                <button
                                    className={`${s.unitBtn} ${isExpanded ? s.unitBtnActive : ""}`}
                                    onClick={() => handleCustomize(fp._id)}
                                >
                                    {custom ? (isExpanded ? "Close" : "Edit") : "Customize"}
                                </button>
                                {custom && (
                                    <button
                                        className={s.resetBtn}
                                        title="Reset to default"
                                        onClick={() => handleReset(fp._id)}
                                    >
                                        ✕
                                    </button>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* ── Per-unit override estimator (expanded) ─────────────────── */}
            {expandedFp && (
                <div className={s.overridePanel}>
                    <div className={s.overrideHeader}>
                        <span className={s.overrideName}>{expandedFp.name}</span>
                        <span className={s.overrideBadge}>Custom</span>
                        <div className={s.overrideActions}>
                            <button
                                className={s.applyAllBtn}
                                onClick={() => handleApplyToAll(expandedFp._id)}
                            >
                                Apply to all
                            </button>
                            <button
                                className={s.resetDefaultBtn}
                                onClick={() => handleReset(expandedFp._id)}
                            >
                                Reset to default
                            </button>
                        </div>
                    </div>
                    <SiteWorkEstimator
                        value={getEffective(expandedFp._id)}
                        onChange={(next) => handleUnitChange(expandedFp._id, next)}
                    />
                </div>
            )}

            {/* ── Master estimator ───────────────────────────────────────── */}
            <div className={s.masterSection}>
                <div className={s.masterHeader}>
                    <div>
                        <div className={s.masterTitle}>All Units · Default</div>
                        <div className={s.masterSub}>
                            {syncedCount()} of {selectedAdus.length} unit
                            {selectedAdus.length !== 1 ? "s" : ""} synced — changes here update
                            all synced units
                        </div>
                    </div>
                </div>
                <SiteWorkEstimator
                    value={masterEstimator}
                    onChange={setMasterEstimator}
                />
            </div>
        </div>
    );
}
