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
import { Slide2_FloorPlans }       from "./slides/Slide2_FloorPlans";
import { Slide3_YourProperty }     from "./slides/Slide3_YourProperty";
import { Slide4_ProjectSummary }   from "./slides/Slide4_ProjectSummary";
import { Slide5_RentalAnalysis }   from "./slides/Slide5_RentalAnalysis";
import { Slide6_ADUROI }           from "./slides/Slide6_ADUROI";
import { Slide7_ADUvsHouse }       from "./slides/Slide7_ADUvsHouse";
import { Slide8_Teamwork }         from "./slides/Slide8_Teamwork";
import { Slide9_WhatsNext }        from "./slides/Slide9_WhatsNext";

const SLIDE_COUNT = 9;
const CANVAS_W = 1920;
const CANVAS_H = 1080;

const SLIDES = [
    Slide1_Cover,
    Slide2_FloorPlans,
    Slide3_YourProperty,
    Slide4_ProjectSummary,
    Slide5_RentalAnalysis,
    Slide6_ADUROI,
    Slide7_ADUvsHouse,
    Slide8_Teamwork,
    Slide9_WhatsNext,
] as const;

const SLIDE_NAMES: Record<number, string> = {
    1: "Cover",
    2: "Floor Plans",
    3: "Your Property",
    4: "Project Summary",
    5: "ADU Rental Analysis",
    6: "ADU ROI",
    7: "ADU vs Purchasing a House",
    8: "Teamwork",
    9: "What's Next",
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
        customerMotivation,
        storyOverridden,
        setSelectedStory,
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

    useEffect(() => {
        function onKey(e: KeyboardEvent) {
            const tag = (e.target as HTMLElement)?.tagName;
            if (tag === "INPUT" || tag === "TEXTAREA") return;

            switch (e.key) {
                case "ArrowRight":
                case " ":
                    e.preventDefault();
                    setSlide(Math.min(SLIDE_COUNT, currentSlide + 1));
                    break;
                case "ArrowLeft":
                    e.preventDefault();
                    setSlide(Math.max(1, currentSlide - 1));
                    break;
                case "Escape":
                    if (window.opener) window.close();
                    break;
                default: {
                    const num = parseInt(e.key, 10);
                    if (!isNaN(num)) {
                        if (num >= 1 && num <= SLIDE_COUNT) {
                            e.preventDefault();
                            setSlide(num);
                        }
                    }
                }
            }
        }
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [currentSlide, setSlide]);

    const hasData = propertyAddress.length > 0 || scenarios.length > 0;

    return (
        <div className={s.shell}>
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

            <div className={s.dots}>
                {Array.from({ length: SLIDE_COUNT }, (_, i) => {
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
