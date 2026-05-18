"use client";

import React, { useEffect, useRef } from "react";
import {
    usePresentationStore,
    type SanityFloorplan,
    type SanityStory,
    type SanityProperty,
} from "@/lib/store/presentationStore";
import { startPresenterSync } from "@/lib/sync/presentationSync";
import { selectStory } from "@/lib/investment/storySelector";

import s from "./present.module.css";

import { Slide1_Cover }            from "./slides/Slide1_Cover";
import { Slide2_YourProperty }      from "./slides/Slide2_YourProperty";
import { Slide3_YourOptions }       from "./slides/Slide3_YourOptions";
import { Slide4_WhatsIncluded }     from "./slides/Slide4_WhatsIncluded";
import { Slide5_CompletedBuilds }   from "./slides/Slide5_CompletedBuilds";
import { Slide6_CustomerStories }   from "./slides/Slide6_CustomerStories";
import { Slide7_HowItWorks }        from "./slides/Slide7_HowItWorks";
import { Slide8_ROIComparison }     from "./slides/Slide8_ROIComparison";
import { Slide9_ADUvsHouse }        from "./slides/Slide9_ADUvsHouse";
import { Slide10_RentalAnalysis }   from "./slides/Slide10_RentalAnalysis";
import { Slide11_WhatsNext }        from "./slides/Slide11_WhatsNext";
import { Slide12_TaxBenefits }      from "./slides/Slide12_TaxBenefits";
import { Slide13_WhyBE }            from "./slides/Slide13_WhyBE";

// Slides 1-12 are in the standard flow; slide 13 is jump-only
const FLOW_COUNT = 12;
const CANVAS_W = 1920;
const CANVAS_H = 1080;

const SLIDES = [
    Slide1_Cover,
    Slide2_YourProperty,
    Slide3_YourOptions,
    Slide4_WhatsIncluded,
    Slide5_CompletedBuilds,
    Slide6_CustomerStories,
    Slide7_HowItWorks,
    Slide8_ROIComparison,
    Slide9_ADUvsHouse,
    Slide10_RentalAnalysis,
    Slide11_WhatsNext,
    Slide12_TaxBenefits,
    Slide13_WhyBE,
] as const;

const SLIDE_NAMES: Record<number, string> = {
    1:  "Cover",
    2:  "Your Property",
    3:  "Your Options",
    4:  "What's Included",
    5:  "Completed Builds",
    6:  "Customer Stories",
    7:  "How It Works",
    8:  "ROI Comparison",
    9:  "ADU vs House",
    10: "Rental Analysis",
    11: "What's Next",
    12: "Tax Benefits",
    13: "Why Backyard Estates",
};

interface Props {
    floorplans: SanityFloorplan[];
    stories: SanityStory[];
    completedProperties: SanityProperty[];
}

export function PresentClient({ floorplans, stories, completedProperties }: Props) {
    const {
        currentSlide,
        setSlide,
        propertyAddress,
        scenarios,
        setSanityData,
        toggleGalleryPaused,
        customerMotivation,
        storyOverridden,
        setSelectedStory,
        setActiveStoryIndex,
        activeStoryIndex,
        stories: storeStories,
    } = usePresentationStore();

    const syncStarted = useRef(false);
    const scalerRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        if (syncStarted.current) return;
        syncStarted.current = true;
        return startPresenterSync();
    }, []);

    useEffect(() => {
        setSanityData({ floorplans, stories, completedProperties });
    }, [floorplans, stories, completedProperties, setSanityData]);

    useEffect(() => {
        if (storyOverridden) return;
        const story = selectStory(customerMotivation, storeStories);
        setSelectedStory(story);
    }, [customerMotivation, storeStories, storyOverridden, setSelectedStory]);

    // Auto-scale the 1920×1080 canvas to fit any viewport while preserving aspect ratio
    useEffect(() => {
        function resize() {
            const el = scalerRef.current;
            if (!el) return;
            const sx = window.innerWidth / CANVAS_W;
            const sy = window.innerHeight / CANVAS_H;
            const scale = Math.min(sx, sy);
            el.style.transform = `translate(-50%, -50%) scale(${scale})`;
        }
        resize();
        window.addEventListener("resize", resize);
        return () => window.removeEventListener("resize", resize);
    }, []);

    // Keyboard navigation
    useEffect(() => {
        function onKey(e: KeyboardEvent) {
            const tag = (e.target as HTMLElement)?.tagName;
            if (tag === "INPUT" || tag === "TEXTAREA") return;

            switch (e.key) {
                case "ArrowRight":
                case " ":
                    e.preventDefault();
                    // Standard flow: 1-12, slide 13 only via Shift+3
                    setSlide(Math.min(FLOW_COUNT, currentSlide + 1));
                    break;
                case "ArrowLeft":
                    e.preventDefault();
                    setSlide(Math.max(1, currentSlide - 1));
                    break;
                case "p":
                case "P":
                    toggleGalleryPaused();
                    break;
                case "s":
                case "S":
                    // Advance story on slide 6
                    if (storeStories.length > 0) {
                        const next = (activeStoryIndex + 1) % storeStories.length;
                        setActiveStoryIndex(next);
                        setSelectedStory(storeStories[next]);
                    }
                    break;
                case "Escape":
                    if (window.opener) window.close();
                    break;
                default: {
                    // Shift+1→11, Shift+2→12, Shift+3→13
                    if (e.shiftKey) {
                        if (e.key === "!") { e.preventDefault(); setSlide(11); }
                        if (e.key === "@") { e.preventDefault(); setSlide(12); }
                        if (e.key === "#") { e.preventDefault(); setSlide(13); }
                        break;
                    }
                    const num = parseInt(e.key, 10);
                    if (!isNaN(num)) {
                        const target = num === 0 ? 10 : num;
                        if (target >= 1 && target <= 13) {
                            e.preventDefault();
                            setSlide(target);
                        }
                    }
                }
            }
        }
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [currentSlide, setSlide, toggleGalleryPaused, storeStories, activeStoryIndex, setActiveStoryIndex, setSelectedStory]);

    const hasData = propertyAddress.length > 0 || scenarios.length > 0;

    return (
        <div className={s.shell}>
            {/* Waiting overlay — viewport-fixed */}
            {!hasData && (
                <div className={s.waiting}>
                    <img
                        src="/assets/be-logo-white.png"
                        alt="Backyard Estates"
                        className={s.waitingLogo}
                        onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                    />
                    <div className={s.waitingText}>Waiting for admin to start presentation&hellip;</div>
                    <div className={s.waitingDots}>
                        <div className={s.waitingDot} />
                        <div className={s.waitingDot} />
                        <div className={s.waitingDot} />
                    </div>
                </div>
            )}

            {/* Scaled 1920×1080 canvas */}
            <div ref={scalerRef} className={s.scaler}>
                <div className={s.canvas}>
                    {SLIDES.map((SlideComponent, idx) => {
                        const slideNum = idx + 1;
                        return (
                            <div
                                key={slideNum}
                                className={`${s.slideWrapper} ${currentSlide === slideNum ? s.slideWrapperActive : ""}`}
                                aria-hidden={currentSlide !== slideNum}
                            >
                                <SlideComponent />
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Navigation dots — shows slides 1-12 only (13 is jump-only) */}
            <div className={s.dots}>
                {Array.from({ length: FLOW_COUNT }, (_, i) => {
                    const n = i + 1;
                    return (
                        <button
                            key={n}
                            className={`${s.dot} ${currentSlide === n ? s.dotActive : ""}`}
                            onClick={() => setSlide(n)}
                            aria-label={SLIDE_NAMES[n] ?? `Slide ${n}`}
                        />
                    );
                })}
            </div>
        </div>
    );
}
