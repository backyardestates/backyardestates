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
        selectedStory,
        setSelectedStory,
        setStoryOverridden,
        setActiveStoryIndex,
        customerName,
        propertyAddress,
    } = usePresentationStore();

    const [overlayWistiaId, setOverlayWistiaId] = useState<string | null>(null);

    useEffect(() => {
        if (!overlayWistiaId) return;
        const handler = (e: KeyboardEvent) => {
            if (e.key === "Escape") setOverlayWistiaId(null);
        };
        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    }, [overlayWistiaId]);

    function selectStory(story: SanityStory, idx: number) {
        setSelectedStory(story);
        setStoryOverridden(true);
        setActiveStoryIndex(idx);
    }

    const photoUrl = selectedStory?.images?.[0] ?? null;
    const lastName = lastNameFromFull(customerName);
    const city = propertyAddress ? cityFromAddress(propertyAddress) : "—";

    return (
        <div className={s.slide}>
            {/* LEFT — story photo */}
            <div className={s.photoHalf}>
                {photoUrl ? (
                    <img src={photoUrl} alt={selectedStory?.names ?? "Story photo"} className={s.photoImg} />
                ) : (
                    <div className={s.photoPlaceholder} />
                )}
                <span className={s.photoBadge}>Completed Build</span>
                {selectedStory?.names && (
                    <div className={s.photoCaptionWrap}>
                        <div className={s.photoCaption}>{selectedStory.names}</div>
                        {selectedStory.purpose && (
                            <span className={s.photoCaptionSub}>{selectedStory.purpose}</span>
                        )}
                    </div>
                )}
            </div>

            {/* RIGHT — content */}
            <div className={s.rightPanel}>
                {/* Running header */}
                <div className="running-header rh-dark">
                    <span className="running-header-left">{lastName} · {city}</span>
                    <span className="running-header-center">Customer Stories</span>
                    <span className="running-header-right">
                        <span className="running-header-num">06</span> / 10
                    </span>
                </div>

                {/* Story selector */}
                <div className={s.storySelector}>
                    <span className={s.storySelectorLabel}>Stories from neighbors</span>
                    <div className={s.storyPills}>
                        {stories.slice(0, 5).map((story, idx) => (
                            <button
                                key={story._id}
                                className={`${s.storyPill} ${selectedStory?._id === story._id ? s.storyPillActive : ""}`}
                                onClick={() => selectStory(story, idx)}
                            >
                                {story.names.split(" ")[0]}
                            </button>
                        ))}
                        {stories.length > 5 && (
                            <span className={s.storiesCount}>+{stories.length - 5} more</span>
                        )}
                    </div>
                </div>

                {/* Content */}
                <div className={s.content}>
                    {selectedStory ? (
                        <>
                            <div className={s.identityRow}>
                                <div className={s.portrait}>
                                    {selectedStory.portraitUrl ? (
                                        <img src={selectedStory.portraitUrl} alt={selectedStory.names} className={s.portraitImg} />
                                    ) : (
                                        <div className={s.portraitInitials}>{getInitials(selectedStory.names)}</div>
                                    )}
                                </div>
                                <div className={s.identityText}>
                                    <div className={s.storyName}>{selectedStory.names}</div>
                                    {selectedStory.purpose && (
                                        <div className={s.storyPurpose}>{selectedStory.purpose}</div>
                                    )}
                                </div>
                            </div>

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
                        </>
                    ) : (
                        <div className={s.placeholder}>
                            <div className={s.placeholderText}>Testimonial coming soon</div>
                        </div>
                    )}
                </div>

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
