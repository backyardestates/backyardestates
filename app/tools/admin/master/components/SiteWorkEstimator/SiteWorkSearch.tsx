"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import type { Floorplan } from "@/lib/rentcast/types";
import type { SiteWorkCategory, SiteWorkPreset } from "@/lib/investment/siteWorkItems";
import s from "./SiteWorkSearch.module.css";

// ─── Presence entry ───────────────────────────────────────────────────────────
// Reports which units currently have the item (effective state) plus a sample
// of their cost — used to surface "already added" hints in the dropdown and
// to prefill the cost input so re-adding becomes "update cost in place".

export type PresenceEntry = {
    kind: "preset" | "custom";
    /** Preset item id (only for kind === "preset"). */
    presetItemId?: string;
    /** Custom item label as originally entered (only for kind === "custom"). */
    customLabel?: string;
    label: string;
    catId: string;
    unitIds: string[];
    sampleCost: number | null;
};

// ─── Fuzzy match scoring ──────────────────────────────────────────────────────
// Simple token-overlap with starts-with bonus. Good enough for short labels
// like "New electrical meter" without pulling in a fuzzy-search dep.

type ScoredHit =
    | {
          type: "preset";
          item: SiteWorkPreset;
          catId: string;
          catLabel: string;
          score: number;
      }
    | {
          type: "custom-existing";
          entry: PresenceEntry;
          catLabel: string;
          score: number;
      };

function normalize(str: string): string {
    return str.toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
}

function scoreLabel(query: string, label: string): number {
    const q = normalize(query);
    const l = normalize(label);
    if (!q) return 0;
    if (l === q) return 100;
    if (l.startsWith(q)) return 60;
    if (l.includes(q)) return 40;
    const qTokens = q.split(" ").filter(Boolean);
    const lTokens = l.split(" ").filter(Boolean);
    let hits = 0;
    for (const qt of qTokens) {
        if (lTokens.some((lt) => lt.startsWith(qt) || qt.startsWith(lt))) hits++;
    }
    return hits > 0 ? hits * 10 : 0;
}

function searchCatalog(
    query: string,
    categories: SiteWorkCategory[],
    customEntries: PresenceEntry[],
): ScoredHit[] {
    if (!query.trim()) return [];
    const hits: ScoredHit[] = [];
    const catLabelById = new Map(categories.map((c) => [c.id, c.label]));
    for (const cat of categories) {
        for (const item of cat.items) {
            const sc = scoreLabel(query, item.label);
            if (sc > 0) hits.push({ type: "preset", item, catId: cat.id, catLabel: cat.label, score: sc });
        }
    }
    for (const entry of customEntries) {
        const sc = scoreLabel(query, entry.label);
        if (sc > 0)
            hits.push({
                type: "custom-existing",
                entry,
                catLabel: catLabelById.get(entry.catId) ?? "",
                score: sc,
            });
    }
    hits.sort((a, b) => b.score - a.score);
    return hits.slice(0, 8);
}

// ─── Component ────────────────────────────────────────────────────────────────

type Mode =
    | { kind: "results" }
    | {
          kind: "form";
          source: "preset" | "custom";
          itemId?: string;
          itemLabel: string;
          itemUnit?: string;
          catId: string;
          catLabel: string;
          /** Units that already effectively have this item — drives the
           *  chip checkmarks and the "will replace existing cost" hint. */
          alreadyOnUnitIds: string[];
      };

interface Props {
    categories: SiteWorkCategory[];
    selectedAdus: Floorplan[];
    /** Per-item presence across all selected units. Built by SiteWorkPanel. */
    presenceIndex: PresenceEntry[];
    onApplyPreset: (input: {
        itemId: string;
        catId: string;
        customerTotal: number;
        targetUnitIds: "all" | string[];
    }) => void;
    onApplyCustom: (input: {
        catId: string;
        label: string;
        customerTotal: number;
        targetUnitIds: "all" | string[];
    }) => void;
}

export function SiteWorkSearch({
    categories,
    selectedAdus,
    presenceIndex,
    onApplyPreset,
    onApplyCustom,
}: Props) {
    const [query, setQuery] = useState("");
    const [open, setOpen] = useState(false);
    const [mode, setMode] = useState<Mode>({ kind: "results" });

    // Form state
    const [cost, setCost] = useState<string>("");
    const [applyAll, setApplyAll] = useState<boolean>(true);
    const [selectedUnitIds, setSelectedUnitIds] = useState<Set<string>>(new Set());
    const [customCatId, setCustomCatId] = useState<string>(categories[0]?.id ?? "");

    const containerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const costRef = useRef<HTMLInputElement>(null);

    // Quick lookup of presence per (catId, key)
    const presetPresence = useMemo(() => {
        const m = new Map<string, PresenceEntry>();
        for (const e of presenceIndex) if (e.kind === "preset" && e.presetItemId) m.set(e.presetItemId, e);
        return m;
    }, [presenceIndex]);
    const customPresence = useMemo(() => {
        const m = new Map<string, PresenceEntry>();
        for (const e of presenceIndex) {
            if (e.kind === "custom" && e.customLabel)
                m.set(`${e.catId}:${e.customLabel.toLowerCase()}`, e);
        }
        return m;
    }, [presenceIndex]);

    const customEntriesForSearch = useMemo(
        () => presenceIndex.filter((e) => e.kind === "custom"),
        [presenceIndex],
    );

    const hits = useMemo(
        () => searchCatalog(query, categories, customEntriesForSearch),
        [query, categories, customEntriesForSearch],
    );

    // Close on outside click
    useEffect(() => {
        function onDown(e: MouseEvent) {
            if (!containerRef.current) return;
            if (!containerRef.current.contains(e.target as Node)) {
                setOpen(false);
                setMode({ kind: "results" });
            }
        }
        if (open) document.addEventListener("mousedown", onDown);
        return () => document.removeEventListener("mousedown", onDown);
    }, [open]);

    // When a form opens, focus the cost input
    useEffect(() => {
        if (mode.kind === "form") {
            requestAnimationFrame(() => costRef.current?.focus());
        }
    }, [mode]);

    function openFormForHit(hit: ScoredHit) {
        if (hit.type === "preset") {
            const presence = presetPresence.get(hit.item.id);
            const defaultCost =
                presence?.sampleCost ?? hit.item.beCost * hit.item.markup;
            setMode({
                kind: "form",
                source: "preset",
                itemId: hit.item.id,
                itemLabel: hit.item.label,
                itemUnit: hit.item.unit,
                catId: hit.catId,
                catLabel: hit.catLabel,
                alreadyOnUnitIds: presence?.unitIds ?? [],
            });
            setCost(defaultCost > 0 ? String(Math.round(defaultCost)) : "");
        } else {
            // Existing custom item — treat as edit-in-place.
            setMode({
                kind: "form",
                source: "custom",
                itemLabel: hit.entry.label,
                catId: hit.entry.catId,
                catLabel: hit.catLabel,
                alreadyOnUnitIds: hit.entry.unitIds,
            });
            setCost(hit.entry.sampleCost != null ? String(Math.round(hit.entry.sampleCost)) : "");
        }
        setApplyAll(true);
        setSelectedUnitIds(new Set());
    }

    function openCustomForm() {
        const cat = categories.find((c) => c.id === customCatId) ?? categories[0];
        const trimmed = query.trim();
        const norm = trimmed.toLowerCase();
        // If the rep types an exact label that already exists, treat as edit-in-place.
        const existing = cat ? customPresence.get(`${cat.id}:${norm}`) : undefined;
        setMode({
            kind: "form",
            source: "custom",
            itemLabel: trimmed,
            catId: cat?.id ?? "",
            catLabel: cat?.label ?? "",
            alreadyOnUnitIds: existing?.unitIds ?? [],
        });
        setCost(existing?.sampleCost != null ? String(Math.round(existing.sampleCost)) : "");
        setApplyAll(true);
        setSelectedUnitIds(new Set());
    }

    function resetToResults() {
        setMode({ kind: "results" });
        setCost("");
        setSelectedUnitIds(new Set());
    }

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (mode.kind !== "form") return;
        const n = parseFloat(cost);
        if (!Number.isFinite(n) || n <= 0) {
            costRef.current?.focus();
            return;
        }
        const target: "all" | string[] = applyAll
            ? "all"
            : Array.from(selectedUnitIds);
        if (!applyAll && target.length === 0) return;

        if (mode.source === "preset" && mode.itemId) {
            onApplyPreset({
                itemId: mode.itemId,
                catId: mode.catId,
                customerTotal: n,
                targetUnitIds: target,
            });
        } else {
            const label = mode.itemLabel.trim();
            if (!label) return;
            onApplyCustom({
                catId: mode.catId,
                label,
                customerTotal: n,
                targetUnitIds: target,
            });
        }

        // Reset, keep dropdown open for chaining adds
        setQuery("");
        resetToResults();
        inputRef.current?.focus();
    }

    function toggleUnit(id: string) {
        setSelectedUnitIds((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    }

    const showDropdown = open && (query.trim().length > 0 || mode.kind === "form");

    return (
        <div className={s.wrap} ref={containerRef}>
            <div className={s.inputRow}>
                <span className={s.searchIcon} aria-hidden="true">⌕</span>
                <input
                    ref={inputRef}
                    type="search"
                    className={s.input}
                    placeholder="Search line items — e.g. trench, meter, soils…"
                    value={query}
                    onChange={(e) => {
                        setQuery(e.target.value);
                        setOpen(true);
                        if (mode.kind === "form") resetToResults();
                    }}
                    onFocus={() => setOpen(true)}
                    aria-label="Search site-work line items"
                />
                {query && (
                    <button
                        type="button"
                        className={s.clearBtn}
                        onClick={() => {
                            setQuery("");
                            resetToResults();
                            inputRef.current?.focus();
                        }}
                        aria-label="Clear search"
                    >
                        ×
                    </button>
                )}
            </div>

            {showDropdown && (
                <div className={s.dropdown}>
                    {mode.kind === "results" && (
                        <>
                            {hits.length > 0 ? (
                                <ul className={s.results}>
                                    {hits.map((h) => {
                                        if (h.type === "preset") {
                                            const presence = presetPresence.get(h.item.id);
                                            const onCount = presence?.unitIds.length ?? 0;
                                            const displayCost =
                                                presence?.sampleCost ?? h.item.beCost * h.item.markup;
                                            return (
                                                <li key={`preset-${h.catId}-${h.item.id}`}>
                                                    <button
                                                        type="button"
                                                        className={`${s.resultBtn} ${onCount > 0 ? s.resultBtnAdded : ""}`}
                                                        onClick={() => openFormForHit(h)}
                                                    >
                                                        <span className={s.resultMain}>
                                                            <span className={s.resultLabel}>{h.item.label}</span>
                                                            <span className={s.resultMeta}>
                                                                {h.catLabel} · {h.item.unit.toUpperCase()}
                                                                {onCount > 0 && (
                                                                    <span className={s.addedBadge}>
                                                                        <span className={s.addedBadgeCheck}>✓</span>
                                                                        On {onCount} of {selectedAdus.length}
                                                                    </span>
                                                                )}
                                                            </span>
                                                        </span>
                                                        {displayCost > 0 && (
                                                            <span className={s.resultCost}>
                                                                ${Math.round(displayCost).toLocaleString()}
                                                                <span className={s.resultCostUnit}>/{h.item.unit}</span>
                                                            </span>
                                                        )}
                                                    </button>
                                                </li>
                                            );
                                        }
                                        // custom-existing
                                        const onCount = h.entry.unitIds.length;
                                        return (
                                            <li key={`custom-${h.entry.catId}-${h.entry.customLabel}`}>
                                                <button
                                                    type="button"
                                                    className={`${s.resultBtn} ${s.resultBtnAdded}`}
                                                    onClick={() => openFormForHit(h)}
                                                >
                                                    <span className={s.resultMain}>
                                                        <span className={s.resultLabel}>{h.entry.label}</span>
                                                        <span className={s.resultMeta}>
                                                            {h.catLabel} · Custom
                                                            <span className={s.addedBadge}>
                                                                <span className={s.addedBadgeCheck}>✓</span>
                                                                On {onCount} of {selectedAdus.length}
                                                            </span>
                                                        </span>
                                                    </span>
                                                    {h.entry.sampleCost != null && (
                                                        <span className={s.resultCost}>
                                                            ${Math.round(h.entry.sampleCost).toLocaleString()}
                                                        </span>
                                                    )}
                                                </button>
                                            </li>
                                        );
                                    })}
                                </ul>
                            ) : (
                                <div className={s.noResults}>
                                    No catalog match for <em>&ldquo;{query}&rdquo;</em>.
                                </div>
                            )}

                            <div className={s.addCustomRow}>
                                <button
                                    type="button"
                                    className={s.addCustomBtn}
                                    onClick={openCustomForm}
                                    disabled={!query.trim()}
                                >
                                    <span className={s.addCustomIcon}>+</span>
                                    Add{query.trim() ? <> &ldquo;{query.trim()}&rdquo;</> : null} as custom item
                                </button>
                            </div>
                        </>
                    )}

                    {mode.kind === "form" && (
                        <form className={s.form} onSubmit={handleSubmit}>
                            <div className={s.formHead}>
                                <div className={s.formHeadMain}>
                                    {mode.source === "custom" ? (
                                        <input
                                            type="text"
                                            className={s.formLabelInput}
                                            value={mode.itemLabel}
                                            placeholder="Item description"
                                            onChange={(e) =>
                                                setMode({ ...mode, itemLabel: e.target.value })
                                            }
                                            required
                                        />
                                    ) : (
                                        <span className={s.formItemName}>{mode.itemLabel}</span>
                                    )}
                                    <span className={s.formCatMeta}>
                                        {mode.source === "custom" ? (
                                            <select
                                                className={s.formCatSelect}
                                                value={mode.catId}
                                                onChange={(e) => {
                                                    const cat = categories.find((c) => c.id === e.target.value);
                                                    setMode({
                                                        ...mode,
                                                        catId: e.target.value,
                                                        catLabel: cat?.label ?? "",
                                                    });
                                                }}
                                            >
                                                {categories.map((c) => (
                                                    <option key={c.id} value={c.id}>
                                                        {c.label}
                                                    </option>
                                                ))}
                                            </select>
                                        ) : (
                                            <>{mode.catLabel}</>
                                        )}
                                    </span>
                                </div>
                                <button
                                    type="button"
                                    className={s.formBackBtn}
                                    onClick={resetToResults}
                                    aria-label="Back to results"
                                >
                                    ← Back
                                </button>
                            </div>

                            <div className={s.formField}>
                                <label className={s.formFieldLabel}>Customer cost</label>
                                <div className={s.costInputWrap}>
                                    <span className={s.costPrefix}>$</span>
                                    <input
                                        ref={costRef}
                                        type="number"
                                        min={0}
                                        step={50}
                                        className={s.costInput}
                                        value={cost}
                                        onChange={(e) => setCost(e.target.value)}
                                        placeholder="0"
                                        required
                                    />
                                </div>
                            </div>

                            {mode.alreadyOnUnitIds.length > 0 && (
                                <div className={s.dupNotice}>
                                    <span className={s.dupNoticeIcon}>✓</span>
                                    Already on{" "}
                                    {mode.alreadyOnUnitIds.length === selectedAdus.length ? (
                                        <>every unit</>
                                    ) : (
                                        <>
                                            {mode.alreadyOnUnitIds.length} of {selectedAdus.length} units
                                        </>
                                    )}
                                    . Submitting will replace the existing cost on those units.
                                </div>
                            )}

                            <div className={s.formField}>
                                <label className={s.formFieldLabel}>Apply to</label>
                                <div className={s.applyRow}>
                                    <button
                                        type="button"
                                        className={`${s.applyChip} ${applyAll ? s.applyChipActive : ""}`}
                                        onClick={() => {
                                            setApplyAll(true);
                                            setSelectedUnitIds(new Set());
                                        }}
                                    >
                                        All units
                                    </button>
                                    {selectedAdus.map((fp) => {
                                        const picked = !applyAll && selectedUnitIds.has(fp._id);
                                        const already = mode.alreadyOnUnitIds.includes(fp._id);
                                        return (
                                            <button
                                                key={fp._id}
                                                type="button"
                                                className={`${s.applyChip} ${picked ? s.applyChipActive : ""} ${already ? s.applyChipAlready : ""}`}
                                                onClick={() => {
                                                    setApplyAll(false);
                                                    toggleUnit(fp._id);
                                                }}
                                                title={already ? "Already on this unit — submitting will replace its cost" : undefined}
                                            >
                                                {already && (
                                                    <span className={s.applyChipCheck} aria-hidden="true">✓</span>
                                                )}
                                                {fp.name}
                                            </button>
                                        );
                                    })}
                                </div>
                                {!applyAll && selectedUnitIds.size === 0 && (
                                    <span className={s.formHint}>Pick at least one unit, or choose &ldquo;All units&rdquo;.</span>
                                )}
                            </div>

                            <div className={s.formActions}>
                                <button type="button" className={s.cancelBtn} onClick={resetToResults}>
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className={s.submitBtn}
                                    disabled={
                                        !cost ||
                                        parseFloat(cost) <= 0 ||
                                        (!applyAll && selectedUnitIds.size === 0) ||
                                        (mode.source === "custom" && !mode.itemLabel.trim())
                                    }
                                >
                                    {(() => {
                                        const targets = applyAll
                                            ? selectedAdus.map((fp) => fp._id)
                                            : Array.from(selectedUnitIds);
                                        const overlap = targets.filter((id) =>
                                            mode.alreadyOnUnitIds.includes(id),
                                        ).length;
                                        if (overlap > 0 && overlap === targets.length) return "Update cost";
                                        if (overlap > 0) return "Apply (update + add)";
                                        return "Add to estimate";
                                    })()}
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            )}
        </div>
    );
}
