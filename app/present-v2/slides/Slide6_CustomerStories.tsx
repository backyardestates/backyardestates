"use client";

import React, { useEffect, useState } from "react";
import { usePresentationStore, SanityStory } from "@/lib/store/presentationStore";
import { IconPlay } from "./_shared/SvgIcons";
import s from "./Slide6.module.css";

function getInitials(name: string) {
    return name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
}

function lastNameFromFull(full?: string) {
    if (!full) return "";
    const parts = full.trim().split(/\s+/);
    return parts[parts.length - 1] ?? "";
}

function cityFromAddress(addr: string) {
    const parts = addr.split(",");
    return parts.length >= 2 ? parts[parts.length - 2].trim() : addr;
}

export function Slide6_CustomerStories() {
    const {
        stories,
        featuredStoryIds,
        selectedStory,
        setSelectedStory,
        setStoryOverridden,
        setActiveStoryIndex,
        customerName,
        propertyAddress,
    } = usePresentationStore();

    // Admin-curated order takes precedence; otherwise fall back to Sanity featured.
    let visibleStories: SanityStory[];
    if (featuredStoryIds.length > 0) {
        const byId = new Map(stories.map((st) => [st._id, st] as const));
        visibleStories = featuredStoryIds
            .map((id) => byId.get(id))
            .filter((st): st is SanityStory => Boolean(st));
    } else {
        visibleStories = stories.filter((st) => st.featured);
    }

    const [overlayWistiaId, setOverlayWistiaId] = useState<string | null>(null);

    useEffect(() => {
        if (!overlayWistiaId) return;
        const handler = (e: KeyboardEvent) => {
            if (e.key === "Escape") setOverlayWistiaId(null);
        };
        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    }, [overlayWistiaId]);

    function promoteStory(story: SanityStory) {
        const idx = visibleStories.findIndex((st) => st._id === story._id);
        setSelectedStory(story);
        setStoryOverridden(true);
        setActiveStoryIndex(idx >= 0 ? idx : 0);
    }

    // Side cards = curated stories minus the currently featured one (max 3 visible)
    const sideStories = visibleStories
        .filter((st) => st._id !== selectedStory?._id)
        .slice(0, 3);
    const overflowCount = Math.max(0, visibleStories.length - 1 - sideStories.length);

    const photoUrl = selectedStory?.portraitUrl ?? null;
    const lastName = lastNameFromFull(customerName);
    const city = propertyAddress ? cityFromAddress(propertyAddress) : "—";

    return (
        <div className={s.slide}>
            {/* LEFT — portrait + build context */}
            <div className={s.photoHalf}>
                <span className={s.photoBadge}>Neighbor</span>

                <div className={s.portraitFrame}>
                    {photoUrl ? (
                        <img src={photoUrl} alt={selectedStory?.names ?? "Portrait"} className={s.photoImg} />
                    ) : (
                        <div className={s.photoPlaceholder} />
                    )}
                </div>

                {(() => {
                    const buildImages = (selectedStory?.images ?? []).slice(2, 5);
                    if (buildImages.length === 0) return null;
                    return (
                        <div className={s.buildStrip}>
                            <div className={s.buildEyebrow}>From Their Build</div>
                            <div className={s.buildThumbs}>
                                {buildImages.map((img, i) => (
                                    <div key={i} className={s.buildThumb}>
                                        <img src={img} alt="" />
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })()}
            </div>

            {/* RIGHT — content */}
            <div className={s.rightPanel}>
                {/* Running header */}
                <div className="running-header rh-dark">
                    <span className="running-header-left">{lastName} · {city}</span>
                    <span className="running-header-center">Customer Stories</span>
                    <span className="running-header-right">
                        <span className="running-header-num">06</span> / 13
                    </span>
                </div>

                {/* Featured story detail */}
                {selectedStory ? (
                    <div className={s.featuredDetail}>
                        <div className={s.storyName}>{selectedStory.names}</div>

                        <div className={s.quoteWrap}>
                            <span className={s.qmark}>&ldquo;</span>
                            <div className={s.quote}>
                                {selectedStory.quote ?? "Story available in full video…"}
                            </div>
                        </div>

                        {selectedStory.wistiaId && (
                            <div
                                role="button"
                                tabIndex={0}
                                className={s.videoCard}
                                onClick={() => setOverlayWistiaId(selectedStory.wistiaId!)}
                                onKeyDown={(e) => e.key === "Enter" && setOverlayWistiaId(selectedStory.wistiaId!)}
                            >
                                <div className={s.videoThumbWrap}>
                                    <img
                                        src={`https://fast.wistia.net/embed/medias/${selectedStory.wistiaId}/swatch`}
                                        alt="Video thumbnail"
                                        className={s.videoThumb}
                                    />
                                    <div className={s.playOverlay}><IconPlay /></div>
                                </div>
                                <div className={s.videoText}>
                                    <span className={s.videoTitle}>Watch their story</span>
                                    <span className={s.videoSub}>2 min · Tap to play</span>
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className={s.placeholder}>
                        <div className={s.placeholderText}>Testimonial coming soon</div>
                    </div>
                )}

                {/* Side cards — other neighbors */}
                {sideStories.length > 0 && (
                    <div className={s.sideRow}>
                        <div className={s.sideHeader}>
                            <span className={s.sideEyebrow}>More neighbors</span>
                            {overflowCount > 0 && (
                                <span className={s.sideOverflow}>+{overflowCount} more</span>
                            )}
                        </div>
                        <div className={s.sideCards} data-count={sideStories.length}>
                            {sideStories.map((story) => (
                                <button
                                    key={story._id}
                                    className={s.sideCard}
                                    onClick={() => promoteStory(story)}
                                >
                                    <div className={s.sidePortrait}>
                                        {story.portraitUrl ? (
                                            <img src={story.portraitUrl} alt={story.names} className={s.portraitImg} />
                                        ) : (
                                            <div className={s.portraitInitials}>{getInitials(story.names)}</div>
                                        )}
                                    </div>
                                    <div className={s.sideName}>{story.names}</div>
                                    {story.purpose && <div className={s.sidePurpose}>{story.purpose}</div>}
                                    {story.quote && (
                                        <div className={s.sideQuote}>
                                            &ldquo;{story.quote}&rdquo;
                                        </div>
                                    )}
                                    {story.wistiaId && (
                                        <div className={s.sidePlay}>
                                            <IconPlay />
                                            <span>2 min</span>
                                        </div>
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                <span className={s.tagline}>We build for you.</span>
            </div>

            {/* Wistia overlay */}
            {overlayWistiaId && (
                <div className={s.videoOverlay} onClick={() => setOverlayWistiaId(null)}>
                    <button
                        className={s.closeBtn}
                        onClick={() => setOverlayWistiaId(null)}
                        aria-label="Close video"
                    >
                        ×
                    </button>
                    <iframe
                        src={`https://fast.wistia.net/embed/iframe/${overlayWistiaId}?autoPlay=true`}
                        className={s.overlayIframe}
                        allow="autoplay; fullscreen"
                        allowFullScreen
                        onClick={(e) => e.stopPropagation()}
                    />
                </div>
            )}
        </div>
    );
}
