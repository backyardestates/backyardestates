"use client";

import React, { useEffect, useRef, useState } from "react";
import s from "./PipedriveLinkPanel.module.css";

interface PersonResult {
    type: "person";
    id: number;
    name: string;
    email: string | null;
    phone: string | null;
    organization: string | null;
    address: string | null;
    ownerName: string | null;
    openDealCount: number;
    wonDealCount: number;
    lastActivityDate: string | null;
}

interface DealResult {
    type: "deal";
    id: number;
    title: string;
    status: string | null;
    stageName: string | null;
    pipelineName: string | null;
    value: number | null;
    currency: string | null;
    personName: string | null;
    personId: number | null;
    organizationName: string | null;
    ownerName: string | null;
    expectedCloseDate: string | null;
    updateTime: string | null;
}

function formatCurrency(value: number, currency: string | null): string {
    try {
        return new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: currency ?? "USD",
            maximumFractionDigits: 0,
        }).format(value);
    } catch {
        return `${currency ?? ""} ${value.toLocaleString()}`.trim();
    }
}

function relativeFromNow(iso: string | null): string | null {
    if (!iso) return null;
    const t = Date.parse(iso);
    if (Number.isNaN(t)) return null;
    const diffMs = Date.now() - t;
    const day = 86_400_000;
    const days = Math.round(diffMs / day);
    if (days === 0) return "today";
    if (days === 1) return "yesterday";
    if (days > 0 && days < 30) return `${days}d ago`;
    if (days >= 30 && days < 365) return `${Math.round(days / 30)}mo ago`;
    if (days >= 365) return `${Math.round(days / 365)}y ago`;
    // Future dates (e.g. expected close)
    const future = -days;
    if (future === 1) return "tomorrow";
    if (future < 30) return `in ${future}d`;
    if (future < 365) return `in ${Math.round(future / 30)}mo`;
    return `in ${Math.round(future / 365)}y`;
}

function stageVariant(stageName: string | null, status: string | null): "open" | "won" | "lost" | "neutral" {
    if (status === "won") return "won";
    if (status === "lost") return "lost";
    if (stageName) return "open";
    return "neutral";
}

type SearchResult = PersonResult | DealResult;

interface Props {
    /** Current Pipedrive person ID linked to this proposal. */
    pipedrivePersonId: string | null;
    /** Current Pipedrive deal ID linked to this proposal. */
    pipedriveDealId: string | null;
    onChange: (next: { personId: string | null; dealId: string | null }) => void;
    /** Seed value for the search input (e.g. customerName from Step 1). */
    seedQuery?: string;
}

export function PipedriveLinkPanel({
    pipedrivePersonId,
    pipedriveDealId,
    onChange,
    seedQuery,
}: Props) {
    const [query, setQuery] = useState(seedQuery ?? "");
    const [results, setResults] = useState<SearchResult[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [hasSearched, setHasSearched] = useState(false);
    const abortRef = useRef<AbortController | null>(null);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // When a deal/person is linked, collapse the search affordance so the
    // panel stays compact. The rep can re-expand via the "Change" button.
    const isLinked = !!(pipedrivePersonId || pipedriveDealId);
    const [searchOpen, setSearchOpen] = useState<boolean>(!isLinked);

    // Cached display labels so the linked banner can show "Sarah Chen" + deal
    // title, not just bare IDs. Populated on link click; rehydrated from
    // /api/pipedrive/lookup on mount when the proposal opens with IDs only.
    const [linkedPersonName, setLinkedPersonName] = useState<string | null>(null);
    const [linkedDealTitle, setLinkedDealTitle] = useState<string | null>(null);

    // If the panel mounts already-linked (snapshot load) and the rep hasn't
    // touched it yet, keep the collapsed state in sync.
    useEffect(() => {
        if (isLinked) setSearchOpen(false);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Rehydrate names whenever the linked IDs change and we don't already have
    // a matching label cached. Aborts on unmount / re-fire.
    useEffect(() => {
        if (!pipedrivePersonId && !pipedriveDealId) {
            setLinkedPersonName(null);
            setLinkedDealTitle(null);
            return;
        }
        const ctrl = new AbortController();
        const params = new URLSearchParams();
        if (pipedrivePersonId) params.set("personId", pipedrivePersonId);
        if (pipedriveDealId) params.set("dealId", pipedriveDealId);
        fetch(`/api/pipedrive/lookup?${params.toString()}`, { signal: ctrl.signal })
            .then((res) => (res.ok ? res.json() : null))
            .then((data: { person: { name: string } | null; deal: { title: string } | null } | null) => {
                if (!data) return;
                if (data.person?.name) setLinkedPersonName(data.person.name);
                else if (!pipedrivePersonId) setLinkedPersonName(null);
                if (data.deal?.title) setLinkedDealTitle(data.deal.title);
                else if (!pipedriveDealId) setLinkedDealTitle(null);
            })
            .catch(() => {
                /* fail silently — banner just falls back to ID-only */
            });
        return () => ctrl.abort();
    }, [pipedrivePersonId, pipedriveDealId]);

    // Debounced search — fires 300ms after the user stops typing.
    useEffect(() => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        const trimmed = query.trim();
        if (trimmed.length < 2) {
            setResults([]);
            setError(null);
            setHasSearched(false);
            return;
        }
        debounceRef.current = setTimeout(() => {
            void runSearch(trimmed);
        }, 300);
        return () => {
            if (debounceRef.current) clearTimeout(debounceRef.current);
        };
    }, [query]);

    async function runSearch(q: string) {
        if (abortRef.current) abortRef.current.abort();
        const ctrl = new AbortController();
        abortRef.current = ctrl;
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(
                `/api/pipedrive/search?q=${encodeURIComponent(q)}`,
                { signal: ctrl.signal },
            );
            if (!res.ok) {
                const body = await res.json().catch(() => ({}));
                throw new Error(body?.error ?? `Search failed (${res.status})`);
            }
            const data = (await res.json()) as { results: SearchResult[] };
            setResults(data.results ?? []);
            setHasSearched(true);
        } catch (err) {
            if ((err as Error).name === "AbortError") return;
            setError((err as Error).message);
            setResults([]);
        } finally {
            setLoading(false);
        }
    }

    function handleLinkPerson(r: PersonResult) {
        onChange({ personId: String(r.id), dealId: pipedriveDealId });
        setLinkedPersonName(r.name);
        setSearchOpen(false);
    }

    function handleLinkDeal(r: DealResult) {
        onChange({
            personId: r.personId ? String(r.personId) : pipedrivePersonId,
            dealId: String(r.id),
        });
        setLinkedDealTitle(r.title);
        if (r.personName) setLinkedPersonName(r.personName);
        setSearchOpen(false);
    }

    function handleUnlink() {
        onChange({ personId: null, dealId: null });
        setLinkedPersonName(null);
        setLinkedDealTitle(null);
        setSearchOpen(true);
        setResults([]);
        setQuery("");
        setHasSearched(false);
    }

    return (
        <div className={s.panel}>
            <div className={s.header}>
                <span className={s.eyebrow}>Pipedrive</span>
                <span className={s.helper}>
                    Search your pipeline by name, phone, email, or address. Linking
                    a person/deal will auto-post a proposal note to that record
                    every time you save.
                </span>
            </div>

            {isLinked && (
                <div className={s.linkedRow}>
                    <div className={s.linkedMeta}>
                        <span className={s.linkedLabel}>Linked to</span>
                        {(linkedPersonName || linkedDealTitle) && (
                            <span className={s.linkedNames}>
                                {linkedPersonName && (
                                    <span className={s.linkedName}>{linkedPersonName}</span>
                                )}
                                {linkedPersonName && linkedDealTitle && (
                                    <span className={s.linkedNameSep} aria-hidden="true">·</span>
                                )}
                                {linkedDealTitle && (
                                    <span className={s.linkedDealTitle}>{linkedDealTitle}</span>
                                )}
                            </span>
                        )}
                        <span className={s.linkedIds}>
                            {pipedrivePersonId && (
                                <span className={s.linkedPill}>Person #{pipedrivePersonId}</span>
                            )}
                            {pipedriveDealId && (
                                <span className={s.linkedPill}>Deal #{pipedriveDealId}</span>
                            )}
                        </span>
                    </div>
                    <div className={s.linkedActions}>
                        <button
                            type="button"
                            className={s.changeBtn}
                            onClick={() => setSearchOpen((v) => !v)}
                            aria-expanded={searchOpen}
                            aria-label={searchOpen ? "Hide search" : "Change link"}
                        >
                            {searchOpen ? "Hide search" : "Change"}
                            <span className={s.changeBtnChevron} aria-hidden="true">
                                {searchOpen ? "▴" : "▾"}
                            </span>
                        </button>
                        <button
                            type="button"
                            className={s.unlinkBtn}
                            onClick={handleUnlink}
                        >
                            Unlink
                        </button>
                    </div>
                </div>
            )}

            {searchOpen && (
            <div className={s.searchRow}>
                <input
                    type="search"
                    className={s.input}
                    placeholder="Search by name, phone, email, address…"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    aria-label="Search Pipedrive"
                />
                {loading && <span className={s.loading}>Searching…</span>}
            </div>
            )}

            {searchOpen && error && <div className={s.error}>{error}</div>}

            {searchOpen && hasSearched && results.length === 0 && !loading && !error && (
                <div className={s.empty}>
                    No matches in Pipedrive for &ldquo;{query}&rdquo;.
                </div>
            )}

            {searchOpen && results.length > 0 && (
                <ul className={s.results}>
                    {results.map((r) => {
                        if (r.type === "person") {
                            const isLinkedPerson = pipedrivePersonId === String(r.id);
                            const contactBits = [r.email, r.phone].filter(Boolean).join(" · ");
                            const placeBits = [r.organization, r.address].filter(Boolean).join(" · ");
                            const lastActivity = relativeFromNow(r.lastActivityDate);
                            return (
                                <li
                                    key={`person-${r.id}`}
                                    className={`${s.result} ${isLinkedPerson ? s.resultLinked : ""}`}
                                >
                                    <div className={s.resultMain}>
                                        <div className={s.resultHead}>
                                            <span className={s.resultType}>Person</span>
                                            <span className={s.resultTitle}>{r.name}</span>
                                        </div>
                                        {contactBits && (
                                            <span className={s.resultMeta}>{contactBits}</span>
                                        )}
                                        {placeBits && (
                                            <span className={s.resultMeta}>{placeBits}</span>
                                        )}
                                        <div className={s.resultBadges}>
                                            {r.ownerName && (
                                                <span className={s.badge}>
                                                    <span className={s.badgeLabel}>Owner</span>
                                                    {r.ownerName}
                                                </span>
                                            )}
                                            {(r.openDealCount > 0 || r.wonDealCount > 0) && (
                                                <span className={s.badge}>
                                                    <span className={s.badgeLabel}>Deals</span>
                                                    {r.openDealCount} open
                                                    {r.wonDealCount > 0 ? ` · ${r.wonDealCount} won` : ""}
                                                </span>
                                            )}
                                            {lastActivity && (
                                                <span className={s.badge}>
                                                    <span className={s.badgeLabel}>Last activity</span>
                                                    {lastActivity}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        className={s.linkBtn}
                                        disabled={isLinkedPerson}
                                        onClick={() => handleLinkPerson(r)}
                                    >
                                        {isLinkedPerson ? "Linked" : "Link person"}
                                    </button>
                                </li>
                            );
                        }
                        const isLinkedDeal = pipedriveDealId === String(r.id);
                        const variant = stageVariant(r.stageName, r.status);
                        const stageLabel =
                            r.status === "won"
                                ? "WON"
                                : r.status === "lost"
                                  ? "LOST"
                                  : (r.stageName ?? "Open");
                        const peopleBits = [r.personName, r.organizationName].filter(Boolean).join(" · ");
                        const closeRel = relativeFromNow(r.expectedCloseDate);
                        const updRel = relativeFromNow(r.updateTime);
                        return (
                            <li
                                key={`deal-${r.id}`}
                                className={`${s.result} ${isLinkedDeal ? s.resultLinked : ""}`}
                            >
                                <div className={s.resultMain}>
                                    <div className={s.resultHead}>
                                        <span className={s.resultType}>Deal</span>
                                        <span className={s.resultTitle}>{r.title}</span>
                                        <span
                                            className={`${s.stagePill} ${s[`stage_${variant}`] ?? ""}`}
                                            title={r.pipelineName ?? undefined}
                                        >
                                            {stageLabel}
                                        </span>
                                    </div>
                                    {peopleBits && (
                                        <span className={s.resultMeta}>{peopleBits}</span>
                                    )}
                                    <div className={s.resultBadges}>
                                        {r.value != null && r.value > 0 && (
                                            <span className={s.badge}>
                                                <span className={s.badgeLabel}>Value</span>
                                                {formatCurrency(r.value, r.currency)}
                                            </span>
                                        )}
                                        {r.pipelineName && (
                                            <span className={s.badge}>
                                                <span className={s.badgeLabel}>Pipeline</span>
                                                {r.pipelineName}
                                            </span>
                                        )}
                                        {r.ownerName && (
                                            <span className={s.badge}>
                                                <span className={s.badgeLabel}>Owner</span>
                                                {r.ownerName}
                                            </span>
                                        )}
                                        {closeRel && (
                                            <span className={s.badge}>
                                                <span className={s.badgeLabel}>Expected close</span>
                                                {closeRel}
                                            </span>
                                        )}
                                        {updRel && !closeRel && (
                                            <span className={s.badge}>
                                                <span className={s.badgeLabel}>Updated</span>
                                                {updRel}
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    className={s.linkBtn}
                                    disabled={isLinkedDeal}
                                    onClick={() => handleLinkDeal(r)}
                                >
                                    {isLinkedDeal ? "Linked" : "Link deal"}
                                </button>
                            </li>
                        );
                    })}
                </ul>
            )}
        </div>
    );
}
