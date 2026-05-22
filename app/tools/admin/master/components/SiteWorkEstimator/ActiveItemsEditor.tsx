"use client";

import React, { useEffect, useRef, useState } from "react";
import type { Floorplan } from "@/lib/rentcast/types";
import type { ActiveLineItem } from "@/lib/investment/siteWorkItems";
import { money } from "@/lib/investment/format";
import s from "./ActiveItemsEditor.module.css";

function pct(n: number) {
    return `${Math.round(n * 100)}%`;
}

/** Cross-unit context. When provided (more than one selected ADU), each row
 *  exposes an Apply-to chip picker so edits and removals can fan out across
 *  units. When absent, the editor degrades to single-state behavior — handlers
 *  still fire so the parent can write to the single value via onChange. */
export interface ActiveEditorCrossUnit {
    selectedAdus: Floorplan[];
    /** When this editor renders inside a per-unit override panel, this is that
     *  unit's id. Default chip selection becomes "this unit" instead of all. */
    currentUnitId?: string;
    /** unit ids that effectively have each preset right now */
    presetPresenceByItemId: Map<string, string[]>;
    /** unit ids that effectively have each custom item, keyed by `${catId}:${lowerLabel}` */
    customPresenceByKey: Map<string, string[]>;
    onEditPreset: (input: {
        itemId: string;
        catId: string;
        customerTotal: number;
        targetUnitIds: "all" | string[];
    }) => void;
    onEditCustom: (input: {
        catId: string;
        label: string;
        customerTotal: number;
        targetUnitIds: "all" | string[];
    }) => void;
    onRemovePreset: (input: {
        itemId: string;
        catId: string;
        targetUnitIds: "all" | string[];
    }) => void;
    onRemoveCustom: (input: {
        catId: string;
        label: string;
        targetUnitIds: "all" | string[];
    }) => void;
}

interface Props {
    snapshot: ActiveLineItem[];
    grandTotal: number;
    crossUnit?: ActiveEditorCrossUnit;
}

type ExpandedState = {
    rowKey: string;
    mode: "edit" | "remove";
    cost: string;
    applyAll: boolean;
    selectedUnits: Set<string>;
} | null;

function rowKeyFor(item: ActiveLineItem): string {
    return item.isCustom
        ? `custom:${item.catId}:${item.label.trim().toLowerCase()}`
        : `preset:${item.itemId}`;
}

export function ActiveItemsEditor({ snapshot, grandTotal, crossUnit }: Props) {
    const [expanded, setExpanded] = useState<ExpandedState>(null);
    const costRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (expanded?.mode === "edit") {
            requestAnimationFrame(() => costRef.current?.focus());
        }
    }, [expanded]);

    if (snapshot.length === 0) {
        return (
            <div className={s.empty}>
                No items yet — set any qty above zero in the All tab, or use the search at the top to add one.
            </div>
        );
    }

    const hasCrossUnit = !!crossUnit && crossUnit.selectedAdus.length > 1;

    function presenceFor(item: ActiveLineItem): string[] {
        if (!crossUnit) return [];
        if (item.isCustom) {
            return (
                crossUnit.customPresenceByKey.get(
                    `${item.catId}:${item.label.trim().toLowerCase()}`,
                ) ?? []
            );
        }
        return crossUnit.presetPresenceByItemId.get(item.itemId) ?? [];
    }

    function openEdit(item: ActiveLineItem) {
        setExpanded({
            rowKey: rowKeyFor(item),
            mode: "edit",
            cost: String(Math.round(item.customerTotal)),
            applyAll: !crossUnit?.currentUnitId,
            selectedUnits: crossUnit?.currentUnitId ? new Set([crossUnit.currentUnitId]) : new Set(),
        });
    }

    function openRemove(item: ActiveLineItem) {
        setExpanded({
            rowKey: rowKeyFor(item),
            mode: "remove",
            cost: "",
            applyAll: !crossUnit?.currentUnitId,
            selectedUnits: crossUnit?.currentUnitId ? new Set([crossUnit.currentUnitId]) : new Set(),
        });
    }

    function close() {
        setExpanded(null);
    }

    function toggleUnit(uid: string) {
        if (!expanded) return;
        const next = new Set(expanded.selectedUnits);
        if (next.has(uid)) next.delete(uid);
        else next.add(uid);
        setExpanded({ ...expanded, selectedUnits: next, applyAll: false });
    }

    function handleSave(item: ActiveLineItem) {
        if (!expanded || !crossUnit) return;
        const n = parseFloat(expanded.cost);
        if (!Number.isFinite(n) || n <= 0) return;
        const targets: "all" | string[] = expanded.applyAll
            ? "all"
            : Array.from(expanded.selectedUnits);
        if (!expanded.applyAll && (targets as string[]).length === 0) return;

        if (item.isCustom) {
            crossUnit.onEditCustom({
                catId: item.catId,
                label: item.label,
                customerTotal: n,
                targetUnitIds: targets,
            });
        } else {
            crossUnit.onEditPreset({
                itemId: item.itemId,
                catId: item.catId,
                customerTotal: n,
                targetUnitIds: targets,
            });
        }
        close();
    }

    function handleRemove(item: ActiveLineItem) {
        if (!expanded || !crossUnit) return;
        const targets: "all" | string[] = expanded.applyAll
            ? "all"
            : Array.from(expanded.selectedUnits);
        if (!expanded.applyAll && (targets as string[]).length === 0) return;
        if (item.isCustom) {
            crossUnit.onRemoveCustom({
                catId: item.catId,
                label: item.label,
                targetUnitIds: targets,
            });
        } else {
            crossUnit.onRemovePreset({
                itemId: item.itemId,
                catId: item.catId,
                targetUnitIds: targets,
            });
        }
        close();
    }

    function renderApplyTo(mode: "edit" | "remove", item: ActiveLineItem) {
        if (!hasCrossUnit || !crossUnit || !expanded) return null;
        const presence = presenceFor(item);
        return (
            <div className={s.field}>
                <label className={s.fieldLabel}>
                    {mode === "edit" ? "Apply changes to" : "Remove from"}
                </label>
                <div className={s.chipRow}>
                    <button
                        type="button"
                        className={`${s.chip} ${expanded.applyAll ? s.chipActive : ""}`}
                        onClick={() =>
                            setExpanded({ ...expanded, applyAll: true, selectedUnits: new Set() })
                        }
                    >
                        All units
                    </button>
                    {crossUnit.selectedAdus.map((fp) => {
                        const picked = !expanded.applyAll && expanded.selectedUnits.has(fp._id);
                        const present = presence.includes(fp._id);
                        return (
                            <button
                                key={fp._id}
                                type="button"
                                className={`${s.chip} ${picked ? s.chipActive : ""} ${present ? s.chipPresent : ""}`}
                                onClick={() => toggleUnit(fp._id)}
                                title={
                                    present
                                        ? "Currently has this item"
                                        : "Does not currently have this item"
                                }
                            >
                                {present && (
                                    <span className={s.chipCheck} aria-hidden="true">✓</span>
                                )}
                                {fp.name}
                            </button>
                        );
                    })}
                </div>
                {!expanded.applyAll && expanded.selectedUnits.size === 0 && (
                    <span className={s.fieldHint}>
                        Pick at least one unit, or choose &ldquo;All units&rdquo;.
                    </span>
                )}
            </div>
        );
    }

    return (
        <div className={s.wrap}>
            <div className={s.head}>
                <span>Item</span>
                <span>Qty</span>
                <span>Unit</span>
                <span>BE Cost</span>
                <span>Markup</span>
                <span>Unit Price</span>
                <span>Customer Total</span>
                <span />
            </div>

            {snapshot.map((item) => {
                const key = rowKeyFor(item);
                const isExpanded = expanded?.rowKey === key;
                const isEditing = isExpanded && expanded?.mode === "edit";
                const isRemoving = isExpanded && expanded?.mode === "remove";

                return (
                    <React.Fragment key={key}>
                        <div
                            className={`${s.row} ${item.isOverridden ? s.rowOverridden : ""} ${isExpanded ? s.rowExpanded : ""}`}
                        >
                            <div className={s.itemCell}>
                                <div className={s.itemLabel}>
                                    {item.label}
                                    {item.isCustom && (
                                        <span className={s.customBadge}>custom</span>
                                    )}
                                </div>
                                <div className={s.itemCat}>{item.catLabel}</div>
                            </div>
                            <span className={s.num}>{item.qty}</span>
                            <span className={s.dim}>{item.unit}</span>
                            <span className={s.num}>
                                {item.unit === "quote" ? "—" : money(item.beCost)}
                            </span>
                            <span className={s.num}>{pct(item.markup)}</span>
                            <span className={s.num}>
                                {item.unitPrice > 0 ? money(item.unitPrice) : "—"}
                            </span>
                            <span className={`${s.num} ${s.total}`}>{money(item.customerTotal)}</span>
                            <div className={s.actions}>
                                <button
                                    type="button"
                                    className={s.editBtn}
                                    onClick={() => (isEditing ? close() : openEdit(item))}
                                    aria-expanded={isEditing}
                                >
                                    {isEditing ? "Close" : "Edit"}
                                </button>
                                <button
                                    type="button"
                                    className={s.removeBtn}
                                    onClick={() => (isRemoving ? close() : openRemove(item))}
                                    aria-expanded={isRemoving}
                                >
                                    Remove
                                </button>
                            </div>
                        </div>

                        {isExpanded && expanded && (
                            <div className={s.inlineEditor}>
                                {expanded.mode === "edit" ? (
                                    <>
                                        <div className={s.field}>
                                            <label className={s.fieldLabel}>New customer cost</label>
                                            <div className={s.costInputWrap}>
                                                <span className={s.costPrefix}>$</span>
                                                <input
                                                    ref={costRef}
                                                    type="number"
                                                    min={0}
                                                    step={50}
                                                    className={s.costInput}
                                                    value={expanded.cost}
                                                    onChange={(e) =>
                                                        setExpanded({ ...expanded, cost: e.target.value })
                                                    }
                                                />
                                            </div>
                                        </div>
                                        {renderApplyTo("edit", item)}
                                        <div className={s.editorActions}>
                                            <button
                                                type="button"
                                                className={s.cancelBtn}
                                                onClick={close}
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                type="button"
                                                className={s.saveBtn}
                                                disabled={
                                                    !expanded.cost ||
                                                    parseFloat(expanded.cost) <= 0 ||
                                                    (!expanded.applyAll &&
                                                        expanded.selectedUnits.size === 0) ||
                                                    !crossUnit
                                                }
                                                onClick={() => handleSave(item)}
                                            >
                                                Save changes
                                            </button>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div className={s.removeNotice}>
                                            <span className={s.removeNoticeIcon}>!</span>
                                            Remove <strong>{item.label}</strong>
                                            {hasCrossUnit ? <> from the selected units</> : <> from this estimate</>}.
                                        </div>
                                        {renderApplyTo("remove", item)}
                                        <div className={s.editorActions}>
                                            <button
                                                type="button"
                                                className={s.cancelBtn}
                                                onClick={close}
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                type="button"
                                                className={s.removeConfirmBtn}
                                                disabled={
                                                    (!expanded.applyAll &&
                                                        expanded.selectedUnits.size === 0) ||
                                                    !crossUnit
                                                }
                                                onClick={() => handleRemove(item)}
                                            >
                                                Remove
                                            </button>
                                        </div>
                                    </>
                                )}
                            </div>
                        )}
                    </React.Fragment>
                );
            })}

            <div className={s.grandTotal}>
                <span>Grand total</span>
                <span>{money(grandTotal)}</span>
            </div>
        </div>
    );
}
