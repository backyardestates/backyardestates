"use client";

import React, { useState } from "react";
import { usePresentationStore } from "@/lib/store/presentationStore";
import { RunningHeader } from "./_shared/RunningHeader";
import { RunningFooter } from "./_shared/RunningFooter";
import s from "./Slide7.module.css";

function getInitials(name: string) {
    return name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
}

export function Slide7_WhatOthersSay() {
    const { selectedStory, customerMotivation, setSelectedStory, setStoryOverridden } = usePresentationStore();
    const [hoverVideo, setHoverVideo] = useState(false);

    const motivationLabel: Record<string, string> = {
        family: "Family", income: "Income", investment: "Investment",
    };

    function openVideo() {
        if (!selectedStory?.wistiaId) return;
        window.open(
            `https://fast.wistia.net/embed/iframe/${selectedStory.wistiaId}?autoPlay=true`,
            "_blank", "width=900,height=506"
        );
    }

    if (!selectedStory) {
        return (
            <div className={s.slide} style={{ flexDirection: "column" }}>
                <RunningHeader slideNumber={7} topic="What others say" theme="dark" />
                <div className={s.noStory}>
                    <span style={{ fontSize: 40, opacity: 0.10 }}>💬</span>
                    <span className={s.noStoryText}>Testimonial coming soon</span>
                </div>
                <RunningFooter theme="dark" />
            </div>
        );
    }

    const storyImages = selectedStory.images ?? [];
    const photoUrl = storyImages[0] ?? null;

    return (
        <div className={s.slide}>
            {/* LEFT: completed-build photo */}
            <div className={s.photoHalf}>
                {photoUrl ? (
                    <img src={photoUrl} alt={selectedStory.names} className={s.photoImg} />
                ) : (
                    <div className={s.photoPlaceholder}>
                        <span style={{ fontSize: 56, opacity: 0.15 }}>🏡</span>
                    </div>
                )}
                <span className={s.photoBadge}>Completed build</span>
                {selectedStory.names && (
                    <span className={s.photoCaption}>{selectedStory.names}</span>
                )}
                <div className={s.photoFade} />
            </div>

            {/* RIGHT: story panel */}
            <div className={s.storyHalf}>
                <RunningHeader slideNumber={7} topic="What others say" theme="dark" />

                {/* Portrait */}
                <div className={s.portrait}>
                    {selectedStory.portraitUrl ? (
                        <img src={selectedStory.portraitUrl} alt={selectedStory.names} className={s.portraitImg} />
                    ) : (
                        <div className={s.portraitInitials}>{getInitials(selectedStory.names)}</div>
                    )}
                </div>

                <div className={s.name}>{selectedStory.names}</div>
                {selectedStory.purpose && (
                    <div className={s.purpose}>{selectedStory.purpose}</div>
                )}

                <div className={s.qmark}>&ldquo;</div>

                {selectedStory.quote ? (
                    <div className={s.quote}>{selectedStory.quote}</div>
                ) : (
                    <div className={s.quoteEmpty}>Story available in full video…</div>
                )}

                {selectedStory.wistiaId && (
                    <div
                        role="button"
                        tabIndex={0}
                        onClick={openVideo}
                        onKeyDown={(e) => e.key === "Enter" && openVideo()}
                        onMouseEnter={() => setHoverVideo(true)}
                        onMouseLeave={() => setHoverVideo(false)}
                        className={s.videoCard}
                    >
                        <div className={s.videoThumbWrap}>
                            <img
                                src={`https://fast.wistia.net/embed/medias/${selectedStory.wistiaId}/swatch`}
                                alt="Video thumbnail"
                                className={s.videoThumb}
                                onError={(e) => { (e.target as HTMLImageElement).style.background = "var(--p-teal-ink)"; }}
                            />
                            <div className={s.playOverlay}>
                                <div className={s.playBtn}>▶</div>
                            </div>
                        </div>
                        <div className={s.videoText}>
                            <span className={s.videoTitle}>Watch their story</span>
                            <span className={s.videoSub}>Tap to play full video ▶</span>
                        </div>
                    </div>
                )}

                <RunningFooter theme="dark" />
            </div>
        </div>
    );
}
