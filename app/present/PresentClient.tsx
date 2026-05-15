"use client";

import React, { useEffect, useRef } from "react";
import {
    usePresentationStore,
    SLIDE_COUNT,
    type SanityFloorplan,
    type SanityStory,
    type SanityProperty,
} from "@/lib/store/presentationStore";
import { startPresenterSync } from "@/lib/sync/presentationSync";
import { selectStory } from "@/lib/investment/storySelector";

import s from "./present.module.css";

import { Slide1_Cover } from "./slides/Slide1_Cover";
import { Slide2_YourProperty } from "./slides/Slide2_YourProperty";
import { Slide3_YourOptions } from "./slides/Slide3_YourOptions";
import { Slide4_SeeItInPerson } from "./slides/Slide4_SeeItInPerson";
import { Slide5_WhatsIncluded } from "./slides/Slide5_WhatsIncluded";
import { Slide6_YourInvestment } from "./slides/Slide6_YourInvestment";
import { Slide7_WhatOthersSay } from "./slides/Slide7_WhatOthersSay";
import { Slide8_TheReturn } from "./slides/Slide8_TheReturn";
import { Slide9_HowItWorks } from "./slides/Slide9_HowItWorks";
import { Slide10_WhatsNext } from "./slides/Slide10_WhatsNext";

const SLIDES = [
    Slide1_Cover,
    Slide2_YourProperty,
    Slide3_YourOptions,
    Slide4_SeeItInPerson,
    Slide5_WhatsIncluded,
    Slide6_YourInvestment,
    Slide7_WhatOthersSay,
    Slide8_TheReturn,
    Slide9_HowItWorks,
    Slide10_WhatsNext,
] as const;

interface Props {
    floorplans: SanityFloorplan[];
    stories: SanityStory[];
    completedProperties: SanityProperty[];
}

export function PresentClient({ floorplans, stories, completedProperties }: Props) {
    const {
        currentSlide,
        nextSlide,
        prevSlide,
        setSlide,
        propertyAddress,
        scenarios,
        setSanityData,
        toggleGalleryPaused,
        customerMotivation,
        storyOverridden,
        setSelectedStory,
        stories: storeStories,
    } = usePresentationStore();

    const syncStarted = useRef(false);

    // Start presenter sync once
    useEffect(() => {
        if (syncStarted.current) return;
        syncStarted.current = true;
        return startPresenterSync();
    }, []);

    // Hydrate Sanity data into store
    useEffect(() => {
        setSanityData({ floorplans, stories, completedProperties });
    }, [floorplans, stories, completedProperties, setSanityData]);

    // Auto-select story when motivation or story list changes (unless overridden)
    useEffect(() => {
        if (storyOverridden) return;
        const story = selectStory(customerMotivation, storeStories);
        setSelectedStory(story);
    }, [customerMotivation, storeStories, storyOverridden, setSelectedStory]);

    // Global keyboard navigation
    useEffect(() => {
        function onKey(e: KeyboardEvent) {
            const tag = (e.target as HTMLElement)?.tagName;
            if (tag === "INPUT" || tag === "TEXTAREA") return;

            switch (e.key) {
                case "ArrowRight":
                case " ":
                    e.preventDefault();
                    nextSlide();
                    break;
                case "ArrowLeft":
                    e.preventDefault();
                    prevSlide();
                    break;
                case "p":
                case "P":
                    toggleGalleryPaused();
                    break;
                case "Escape":
                    if (window.opener) window.close();
                    break;
                default: {
                    const num = parseInt(e.key, 10);
                    if (!isNaN(num)) {
                        const target = num === 0 ? 10 : num;
                        if (target >= 1 && target <= SLIDE_COUNT) {
                            e.preventDefault();
                            setSlide(target);
                        }
                    }
                }
            }
        }
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [nextSlide, prevSlide, setSlide, toggleGalleryPaused]);

    const hasData = propertyAddress.length > 0 || scenarios.length > 0;

    return (
        <div className={s.shell}>
            {/* Waiting overlay */}
            {!hasData && (
                <div className={s.waiting}>
                    <img
                        src="/images/logo-mobile.png"
                        alt="Backyard Estates"
                        className={s.waitingLogo}
                    />
                    <div className={s.waitingText}>Waiting for admin to start presentation&hellip;</div>
                    <div className={s.waitingDots}>
                        <div className={s.waitingDot} />
                        <div className={s.waitingDot} />
                        <div className={s.waitingDot} />
                    </div>
                </div>
            )}

            {/* Slide stack — opacity fade */}
            {SLIDES.map((SlideComponent, idx) => {
                const slideNum = idx + 1;
                return (
                    <div
                        key={idx}
                        className={`${s.slideWrapper} ${currentSlide === slideNum ? s.slideWrapperActive : ""}`}
                    >
                        <SlideComponent />
                    </div>
                );
            })}

            {/* Navigation dots */}
            <div className={s.dots}>
                {Array.from({ length: SLIDE_COUNT }, (_, i) => (
                    <button
                        key={i}
                        className={`${s.dot} ${currentSlide === i + 1 ? s.dotActive : ""}`}
                        onClick={() => setSlide(i + 1)}
                        aria-label={`Slide ${i + 1}`}
                    />
                ))}
            </div>
        </div>
    );
}
