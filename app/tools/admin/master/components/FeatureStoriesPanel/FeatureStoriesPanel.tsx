"use client";

import React, { useMemo } from "react";
import type { SanityStory } from "@/lib/store/presentationStore";
import s from "../FeaturePropertiesPanel/FeaturePropertiesPanel.module.css";

interface Props {
    stories: SanityStory[];
    selectedIds: string[];
    onChange: (ids: string[]) => void;
}

function getInitials(name: string) {
    return name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
}

export function FeatureStoriesPanel({ stories, selectedIds, onChange }: Props) {
    const byId = useMemo(() => {
        const map = new Map<string, SanityStory>();
        for (const st of stories) map.set(st._id, st);
        return map;
    }, [stories]);

    const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);

    const available = stories.filter((st) => !selectedSet.has(st._id));
    const selected = selectedIds
        .map((id) => byId.get(id))
        .filter((st): st is SanityStory => Boolean(st));

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
        onChange(stories.filter((st) => st.featured).map((st) => st._id));
    }

    function clear() {
        onChange([]);
    }

    if (stories.length === 0) {
        return (
            <div className={s.panel}>
                <div className={s.empty}>No customer stories found in Sanity.</div>
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
                            <div className={s.listEmpty}>All stories featured.</div>
                        ) : (
                            available.map((st) => (
                                <div key={st._id} className={s.item}>
                                    {st.portraitUrl ? (
                                        <img src={st.portraitUrl} alt={st.names} className={s.thumb} loading="lazy" />
                                    ) : (
                                        <div className={s.thumbPlaceholder} aria-label={getInitials(st.names)} />
                                    )}
                                    <div className={s.meta}>
                                        <span className={s.name}>{st.names}</span>
                                        <span className={s.sub}>
                                            {st.purpose || "—"}
                                            {st.featured && <span className={s.featuredTag}>Featured</span>}
                                        </span>
                                    </div>
                                    <div className={s.actions}>
                                        <button
                                            type="button"
                                            className={`${s.iconBtn} ${s.iconBtnAdd}`}
                                            onClick={() => add(st._id)}
                                            aria-label={`Add ${st.names}`}
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
                        <span className={s.columnTitle}>Slide 6 order · {selected.length}</span>
                        <span className={s.columnHint}>Use ↑ ↓ to reorder</span>
                    </div>
                    <div className={s.list}>
                        {selected.length === 0 ? (
                            <div className={s.listEmpty}>
                                Nothing selected — Slide 6 will fall back to stories marked
                                <em> featured</em> in Sanity.
                            </div>
                        ) : (
                            selected.map((st, i) => (
                                <div key={st._id} className={`${s.item} ${s.itemSelected}`}>
                                    {st.portraitUrl ? (
                                        <img src={st.portraitUrl} alt={st.names} className={s.thumb} loading="lazy" />
                                    ) : (
                                        <div className={s.thumbPlaceholder} aria-label={getInitials(st.names)} />
                                    )}
                                    <div className={s.meta}>
                                        <span className={s.name}>{st.names}</span>
                                        <span className={s.sub}>
                                            <span className={s.order}>№ {String(i + 1).padStart(2, "0")}</span>
                                            {st.purpose || "—"}
                                        </span>
                                    </div>
                                    <div className={s.actions}>
                                        <button
                                            type="button"
                                            className={s.iconBtn}
                                            onClick={() => move(st._id, -1)}
                                            disabled={i === 0}
                                            aria-label="Move up"
                                            title="Move up"
                                        >
                                            ↑
                                        </button>
                                        <button
                                            type="button"
                                            className={s.iconBtn}
                                            onClick={() => move(st._id, 1)}
                                            disabled={i === selected.length - 1}
                                            aria-label="Move down"
                                            title="Move down"
                                        >
                                            ↓
                                        </button>
                                        <button
                                            type="button"
                                            className={`${s.iconBtn} ${s.iconBtnRemove}`}
                                            onClick={() => remove(st._id)}
                                            aria-label={`Remove ${st.names}`}
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
