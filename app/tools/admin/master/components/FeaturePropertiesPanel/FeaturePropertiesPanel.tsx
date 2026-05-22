"use client";

import React, { useMemo } from "react";
import type { SanityProperty } from "@/lib/store/presentationStore";
import s from "./FeaturePropertiesPanel.module.css";

interface Props {
    properties: SanityProperty[];
    selectedIds: string[];
    onChange: (ids: string[]) => void;
}

export function FeaturePropertiesPanel({ properties, selectedIds, onChange }: Props) {
    const byId = useMemo(() => {
        const map = new Map<string, SanityProperty>();
        for (const p of properties) map.set(p._id, p);
        return map;
    }, [properties]);

    const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);

    const available = properties.filter((p) => !selectedSet.has(p._id));
    const selected = selectedIds
        .map((id) => byId.get(id))
        .filter((p): p is SanityProperty => Boolean(p));

    function add(id: string) {
        onChange([...selectedIds, id]);
    }

    function remove(id: string) {
        onChange(selectedIds.filter((x) => x !== id));
    }

    function move(id: string, dir: -1 | 1) {
        const idx = selectedIds.indexOf(id);
        const next = idx + dir;
        if (idx < 0 || next < 0 || next >= selectedIds.length) return;
        const copy = [...selectedIds];
        [copy[idx], copy[next]] = [copy[next], copy[idx]];
        onChange(copy);
    }

    function useFeatured() {
        onChange(properties.filter((p) => p.featured).map((p) => p._id));
    }

    function clear() {
        onChange([]);
    }

    if (properties.length === 0) {
        return (
            <div className={s.panel}>
                <div className={s.empty}>No completed properties found in Sanity.</div>
            </div>
        );
    }

    return (
        <div>
            <div className={s.panel}>
                <div className={s.column}>
                    <div className={s.columnHeader}>
                        <span className={s.columnTitle}>Available · {available.length}</span>
                        <span className={s.columnHint}>Click + to feature</span>
                    </div>
                    <div className={s.list}>
                        {available.length === 0 ? (
                            <div className={s.listEmpty}>All properties featured.</div>
                        ) : (
                            available.map((p) => (
                                <div key={p._id} className={s.item}>
                                    {p.thumbnailUrl ? (
                                        <img src={p.thumbnailUrl} alt={p.name} className={s.thumb} loading="lazy" />
                                    ) : (
                                        <div className={s.thumbPlaceholder} />
                                    )}
                                    <div className={s.meta}>
                                        <span className={s.name}>{p.name}</span>
                                        <span className={s.sub}>
                                            {p.location || "—"}
                                            {p.featured && <span className={s.featuredTag}>Featured</span>}
                                        </span>
                                    </div>
                                    <div className={s.actions}>
                                        <button
                                            type="button"
                                            className={`${s.iconBtn} ${s.iconBtnAdd}`}
                                            onClick={() => add(p._id)}
                                            aria-label={`Add ${p.name}`}
                                            title="Add"
                                        >
                                            +
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                <div className={s.column}>
                    <div className={s.columnHeader}>
                        <span className={s.columnTitle}>Slide 5 order · {selected.length}</span>
                        <span className={s.columnHint}>Use ↑ ↓ to reorder</span>
                    </div>
                    <div className={s.list}>
                        {selected.length === 0 ? (
                            <div className={s.listEmpty}>
                                Nothing selected — Slide 5 will fall back to properties marked
                                <em> featured</em> in Sanity.
                            </div>
                        ) : (
                            selected.map((p, i) => (
                                <div key={p._id} className={`${s.item} ${s.itemSelected}`}>
                                    {p.thumbnailUrl ? (
                                        <img src={p.thumbnailUrl} alt={p.name} className={s.thumb} loading="lazy" />
                                    ) : (
                                        <div className={s.thumbPlaceholder} />
                                    )}
                                    <div className={s.meta}>
                                        <span className={s.name}>{p.name}</span>
                                        <span className={s.sub}>
                                            <span className={s.order}>№ {String(i + 1).padStart(2, "0")}</span>
                                            {p.location || "—"}
                                        </span>
                                    </div>
                                    <div className={s.actions}>
                                        <button
                                            type="button"
                                            className={s.iconBtn}
                                            onClick={() => move(p._id, -1)}
                                            disabled={i === 0}
                                            aria-label="Move up"
                                            title="Move up"
                                        >
                                            ↑
                                        </button>
                                        <button
                                            type="button"
                                            className={s.iconBtn}
                                            onClick={() => move(p._id, 1)}
                                            disabled={i === selected.length - 1}
                                            aria-label="Move down"
                                            title="Move down"
                                        >
                                            ↓
                                        </button>
                                        <button
                                            type="button"
                                            className={`${s.iconBtn} ${s.iconBtnRemove}`}
                                            onClick={() => remove(p._id)}
                                            aria-label={`Remove ${p.name}`}
                                            title="Remove"
                                        >
                                            ×
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            <div className={s.toolbar}>
                <button type="button" className={s.textBtn} onClick={useFeatured}>
                    Use Sanity featured
                </button>
                <button type="button" className={s.textBtn} onClick={clear} disabled={selected.length === 0}>
                    Clear selection
                </button>
            </div>
        </div>
    );
}
