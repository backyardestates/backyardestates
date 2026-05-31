"use client";

import React, { useMemo, useState } from "react";
import type { SanityStory } from "@/lib/store/presentationStore";
import s from "./FeatureStoriesPanel.module.css";

interface Props {
    stories: SanityStory[];
    selectedIds: string[];
    onChange: (ids: string[]) => void;
}

type SortKey = "match" | "name-asc" | "name-desc" | "featured-first";
type VideoFilter = "all" | "video" | "no-video";

interface MatchResult {
    score: number;
    reason: string;
    matchedTags: string[];
}

// Preset themes a rep typically pitches an ADU on. The rep can also type a
// free-text theme. Both feed the AI matcher, which reads every testimonial and
// ranks the ones that best embody the chosen themes — by meaning, not keywords.
const PRESET_TAGS = [
    "Multigenerational living",
    "Rental income",
    "Aging parents",
    "Adult children",
    "Home office / studio",
    "Smooth, fast process",
    "Design & quality",
    "Tricky or tight lot",
    "Permitting made easy",
    "Great value / ROI",
    "First-time investor",
    "Family close by",
];

export function FeatureStoriesPanel({ stories, selectedIds, onChange }: Props) {
    const [query, setQuery] = useState("");
    const [sort, setSort] = useState<SortKey>("name-asc");
    const [video, setVideo] = useState<VideoFilter>("all");
    const [selectedOnly, setSelectedOnly] = useState(false);

    // ── AI smart-match state ──────────────────────────────────────────────────
    const [tags, setTags] = useState<Set<string>>(new Set());
    const [freeText, setFreeText] = useState("");
    const [matches, setMatches] = useState<Record<string, MatchResult> | null>(null);
    const [matchLoading, setMatchLoading] = useState(false);
    const [matchError, setMatchError] = useState<string | null>(null);
    const [matchedOnly, setMatchedOnly] = useState(true);

    const hasVideoOpt = useMemo(() => stories.some((st) => st.wistiaId), [stories]);
    const hasFeatured = useMemo(() => stories.some((st) => st.featured), [stories]);

    const activeTags = useMemo(() => {
        const t = [...tags];
        if (freeText.trim()) t.push(freeText.trim());
        return t;
    }, [tags, freeText]);

    const anyFilter =
        query.trim() !== "" || video !== "all" || selectedOnly || matches !== null;

    // ── AI match ──────────────────────────────────────────────────────────────
    async function runMatch() {
        if (activeTags.length === 0) return;
        setMatchLoading(true);
        setMatchError(null);
        try {
            const res = await fetch("/api/stories/match", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    tags: activeTags,
                    stories: stories.map((st) => ({
                        id: st._id,
                        name: st.names,
                        quote: st.quote,
                        purpose: st.purpose,
                    })),
                }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Match failed");
            const byId: Record<string, MatchResult> = {};
            for (const m of data.matches as (MatchResult & { id: string })[]) {
                byId[m.id] = { score: m.score, reason: m.reason, matchedTags: m.matchedTags };
            }
            setMatches(byId);
            setMatchedOnly(true);
            setSort("match");
        } catch (err) {
            setMatchError(err instanceof Error ? err.message : String(err));
        } finally {
            setMatchLoading(false);
        }
    }

    function clearMatch() {
        setMatches(null);
        setMatchError(null);
        if (sort === "match") setSort("name-asc");
    }

    function toggleTag(name: string) {
        setTags((prev) => {
            const next = new Set(prev);
            if (next.has(name)) next.delete(name);
            else next.add(name);
            return next;
        });
    }

    // ── Apply filters + sort ──────────────────────────────────────────────────
    const visible = useMemo(() => {
        const q = query.trim().toLowerCase();
        const out = stories.filter((st) => {
            if (selectedOnly && !selectedIds.includes(st._id)) return false;
            if (matches && matchedOnly && !matches[st._id]) return false;
            if (q && !(st.names?.toLowerCase().includes(q) || st.quote?.toLowerCase().includes(q))) return false;
            if (video === "video" && !st.wistiaId) return false;
            if (video === "no-video" && st.wistiaId) return false;
            return true;
        });

        out.sort((a, b) => {
            if (sort === "match" && matches) {
                const sa = matches[a._id]?.score ?? -1;
                const sb = matches[b._id]?.score ?? -1;
                if (sb !== sa) return sb - sa;
                return (a.names ?? "").localeCompare(b.names ?? "");
            }
            switch (sort) {
                case "name-desc":
                    return (b.names ?? "").localeCompare(a.names ?? "");
                case "featured-first":
                    return Number(Boolean(b.featured)) - Number(Boolean(a.featured)) ||
                        (a.names ?? "").localeCompare(b.names ?? "");
                case "name-asc":
                default:
                    return (a.names ?? "").localeCompare(b.names ?? "");
            }
        });
        return out;
    }, [stories, selectedIds, query, video, selectedOnly, sort, matches, matchedOnly]);

    function toggle(id: string) {
        if (selectedIds.includes(id)) onChange(selectedIds.filter((x) => x !== id));
        else onChange([...selectedIds, id]);
    }

    function clearFilters() {
        setQuery("");
        setVideo("all");
        setSelectedOnly(false);
    }

    const matchCount = matches ? Object.keys(matches).length : 0;

    if (stories.length === 0) {
        return (
            <div className={s.panel}>
                <div className={s.empty}>
                    <span className={s.emptyTitle}>No customer stories found in Sanity.</span>
                </div>
            </div>
        );
    }

    const sortOptions: { key: SortKey; label: string }[] = [
        ...(matches ? [{ key: "match" as SortKey, label: "Best match" }] : []),
        { key: "name-asc", label: "Name · A–Z" },
        { key: "name-desc", label: "Name · Z–A" },
        { key: "featured-first", label: "Featured first" },
    ];

    return (
        <div className={s.panel}>
            {/* ── AI smart-match ───────────────────────────────────────────── */}
            <div className={s.smart}>
                <div className={s.smartHead}>
                    <span className={s.smartTitle}>
                        <svg className={s.sparkle} width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                            <path d="M12 2l1.9 5.1L19 9l-5.1 1.9L12 16l-1.9-5.1L5 9l5.1-1.9L12 2zM19 14l.9 2.6L22 17.5l-2.1.9L19 21l-.9-2.6L16 17.5l2.1-.9L19 14z" />
                        </svg>
                        Smart match
                    </span>
                    <span className={s.smartHint}>
                        Pick themes — AI reads every testimonial and ranks the best fits.
                    </span>
                </div>

                <div className={s.tagRow} role="group" aria-label="Match themes">
                    {PRESET_TAGS.map((name) => {
                        const on = tags.has(name);
                        return (
                            <button
                                key={name}
                                type="button"
                                className={`${s.tag} ${on ? s.tagOn : ""}`}
                                onClick={() => toggleTag(name)}
                                aria-pressed={on}
                            >
                                {name}
                            </button>
                        );
                    })}
                </div>

                <div className={s.smartControls}>
                    <input
                        type="text"
                        className={s.freeText}
                        placeholder="…or describe a theme, e.g. “worried about elderly parents nearby”"
                        value={freeText}
                        onChange={(e) => setFreeText(e.target.value)}
                        onKeyDown={(e) => { if (e.key === "Enter") void runMatch(); }}
                        aria-label="Describe a theme to match"
                    />
                    <button
                        type="button"
                        className={s.matchBtn}
                        onClick={() => void runMatch()}
                        disabled={activeTags.length === 0 || matchLoading}
                    >
                        {matchLoading ? (
                            <>
                                <span className={s.spinner} aria-hidden /> Analyzing…
                            </>
                        ) : (
                            "Find best matches"
                        )}
                    </button>
                    {matches && (
                        <button type="button" className={s.linkBtn} onClick={clearMatch}>
                            Clear matches
                        </button>
                    )}
                </div>

                {matchError && <div className={s.matchError} role="alert">{matchError}</div>}
                {matches && !matchError && (
                    <div className={s.matchSummary}>
                        <span className={s.matchSummaryStrong}>{matchCount}</span>&nbsp;testimonial
                        {matchCount === 1 ? "" : "s"} match your themes
                        <label className={s.matchedToggle}>
                            <input
                                type="checkbox"
                                checked={matchedOnly}
                                onChange={(e) => setMatchedOnly(e.target.checked)}
                            />
                            Show matches only
                        </label>
                    </div>
                )}
            </div>

            {/* ── Toolbar: search · selected toggle · video · sort ─────────── */}
            <div className={s.bar}>
                <div className={s.searchWrap}>
                    <svg
                        className={s.searchIcon}
                        width="16" height="16" viewBox="0 0 24 24" fill="none"
                        stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                        aria-hidden
                    >
                        <circle cx="11" cy="11" r="7" />
                        <path d="M21 21l-4.3-4.3" />
                    </svg>
                    <input
                        type="search"
                        className={s.search}
                        placeholder="Search stories by name or quote…"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        aria-label="Search stories by name or quote"
                    />
                    {query && (
                        <button
                            type="button"
                            className={s.searchClear}
                            onClick={() => setQuery("")}
                            aria-label="Clear search"
                        >
                            ✕
                        </button>
                    )}
                </div>

                {selectedIds.length > 0 && (
                    <button
                        type="button"
                        className={`${s.selToggle} ${selectedOnly ? s.selToggleOn : ""}`}
                        onClick={() => setSelectedOnly((v) => !v)}
                        aria-pressed={selectedOnly}
                        title="Show only the stories you've selected"
                    >
                        <span className={s.selDot} aria-hidden>✓</span>
                        {selectedIds.length} selected
                    </button>
                )}

                {hasVideoOpt && (
                    <div className={s.seg} role="radiogroup" aria-label="Filter by video">
                        <button
                            type="button" role="radio" aria-checked={video === "all"}
                            className={`${s.segBtn} ${video === "all" ? s.segBtnOn : ""}`}
                            onClick={() => setVideo("all")}
                        >
                            All
                        </button>
                        <button
                            type="button" role="radio" aria-checked={video === "video"}
                            className={`${s.segBtn} ${video === "video" ? s.segBtnOn : ""}`}
                            onClick={() => setVideo(video === "video" ? "all" : "video")}
                        >
                            Video
                        </button>
                        <button
                            type="button" role="radio" aria-checked={video === "no-video"}
                            className={`${s.segBtn} ${video === "no-video" ? s.segBtnOn : ""}`}
                            onClick={() => setVideo(video === "no-video" ? "all" : "no-video")}
                        >
                            No video
                        </button>
                    </div>
                )}

                <label className={s.sortWrap}>
                    <span className={s.sortLabel}>Sort</span>
                    <select
                        className={s.select}
                        value={sort}
                        onChange={(e) => setSort(e.target.value as SortKey)}
                        aria-label="Sort stories"
                    >
                        {sortOptions.map((o) => (
                            <option key={o.key} value={o.key}>{o.label}</option>
                        ))}
                    </select>
                </label>
            </div>

            {/* ── Result summary ───────────────────────────────────────────── */}
            <div className={s.summary}>
                <span className={s.resultCount}>
                    {visible.length} stor{visible.length === 1 ? "y" : "ies"}
                    {selectedIds.length > 0 && !selectedOnly && (
                        <span className={s.resultSub}> · {selectedIds.length} selected</span>
                    )}
                </span>
                <div className={s.summaryActions}>
                    {hasFeatured && (
                        <button
                            type="button"
                            className={s.linkBtn}
                            onClick={() => onChange(stories.filter((st) => st.featured).map((st) => st._id))}
                            title="Select the stories marked “featured” in Sanity"
                        >
                            Use Sanity featured
                        </button>
                    )}
                    {selectedIds.length > 0 && (
                        <button type="button" className={s.linkBtn} onClick={() => onChange([])}>
                            Clear selection
                        </button>
                    )}
                    {anyFilter && (
                        <button type="button" className={s.linkBtn} onClick={clearFilters}>
                            Clear filters
                        </button>
                    )}
                </div>
            </div>

            {/* ── Grid ─────────────────────────────────────────────────────── */}
            {visible.length === 0 ? (
                <div className={s.empty}>
                    <span className={s.emptyTitle}>No stories match your filters</span>
                    <button type="button" className={s.linkBtn} onClick={clearFilters}>
                        Clear filters
                    </button>
                </div>
            ) : (
                <div className={s.grid}>
                    {visible.map((st) => {
                        const isSelected = selectedIds.includes(st._id);
                        const order = isSelected ? selectedIds.indexOf(st._id) + 1 : 0;
                        const m = matches?.[st._id];
                        const aria = [st.names, st.purpose, st.wistiaId ? "has video" : null].filter(Boolean).join(", ");
                        return (
                            <button
                                key={st._id}
                                type="button"
                                className={`${s.card} ${isSelected ? s.cardSelected : ""}`}
                                onClick={() => toggle(st._id)}
                                aria-pressed={isSelected}
                                aria-label={`${isSelected ? "Selected" : "Select"} ${aria}`}
                            >
                                <div className={s.thumbWrap}>
                                    {st.portraitUrl ? (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img src={st.portraitUrl} alt="" className={s.thumb} loading="lazy" />
                                    ) : (
                                        <div className={s.thumbPlaceholder} aria-hidden>No portrait</div>
                                    )}
                                    {m ? (
                                        <span className={s.matchBadge} title={`${m.score}% match`}>{m.score}% match</span>
                                    ) : (
                                        st.purpose && <span className={s.purposeBadge}>{st.purpose}</span>
                                    )}
                                    {st.wistiaId && (
                                        <span className={s.videoBadge} aria-hidden title="Has video">
                                            <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor">
                                                <path d="M8 5v14l11-7z" />
                                            </svg>
                                        </span>
                                    )}
                                    <span className={`${s.check} ${isSelected ? s.checkOn : ""}`} aria-hidden>
                                        {order > 0 ? (
                                            <span className={s.checkNum}>{order}</span>
                                        ) : (
                                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M20 6L9 17l-5-5" />
                                            </svg>
                                        )}
                                    </span>
                                </div>
                                <div className={s.cardBody}>
                                    <span className={s.name}>{st.names}</span>
                                    {m?.reason ? (
                                        <span className={s.matchReason}>{m.reason}</span>
                                    ) : (
                                        st.quote && <span className={s.quote}>&ldquo;{st.quote}&rdquo;</span>
                                    )}
                                </div>
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
