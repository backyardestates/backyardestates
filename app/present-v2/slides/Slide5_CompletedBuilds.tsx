"use client";

import React, { useEffect, useRef, useState } from "react";
import { usePresentationStore, SanityProperty } from "@/lib/store/presentationStore";
import { cldOptimize } from "@/lib/cloudinary";
import s from "./Slide5.module.css";

type BuildImage = {
    url: string;
    name: string;
    location: string;
};

function buildImageList(completedProperties: SanityProperty[]): BuildImage[] {
    const images: BuildImage[] = [];
    for (const prop of completedProperties) {
        for (const url of prop.images ?? []) {
            images.push({ url, name: prop.name, location: prop.location ?? "" });
        }
        if (!prop.images?.length && prop.thumbnailUrl) {
            images.push({ url: prop.thumbnailUrl, name: prop.name, location: prop.location ?? "" });
        }
    }
    return images;
}

const PAGE_SIZE = 4;

function pad2(n: number) {
    return n.toString().padStart(2, "0");
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

export function Slide5_CompletedBuilds() {
    const {
        completedProperties,
        featuredPropertyIds,
        galleryPaused,
        setGalleryPaused,
        currentSlide,
        customerName,
        propertyAddress,
        isPrintMode,
    } = usePresentationStore();
    const active = currentSlide === 5 || isPrintMode;

    // Admin-curated order takes precedence; otherwise fall back to Sanity `featured`.
    let visibleProperties: SanityProperty[];
    if (featuredPropertyIds.length > 0) {
        const byId = new Map(completedProperties.map((p) => [p._id, p] as const));
        visibleProperties = featuredPropertyIds
            .map((id) => byId.get(id))
            .filter((p): p is SanityProperty => Boolean(p));
    } else {
        visibleProperties = completedProperties.filter((p) => p.featured);
    }

    const images = buildImageList(visibleProperties);
    const pageCount = Math.max(1, Math.ceil(images.length / PAGE_SIZE));
    const [page, setPage] = useState(0);

    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    useEffect(() => {
        if (!active || galleryPaused || pageCount <= 1) return;
        timerRef.current = setInterval(() => {
            setPage((p) => (p + 1) % pageCount);
        }, 6000);
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [active, galleryPaused, pageCount]);

    useEffect(() => {
        if (active) setPage(0);
    }, [active]);

    const pageImages = images.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);
    // No padding — render only filled cells so a partially-full page doesn't
    // show empty dark boxes. The grid wraps naturally up to 3 per row.
    const cells: BuildImage[] = pageImages;

    const lastName = lastNameFromFull(customerName);
    const city = propertyAddress ? cityFromAddress(propertyAddress) : "—";

    return (
        <div className={s.slide}>

            {/* Headline */}
            <div className={s.headRow}>
                <div className={s.headLeft}>
                    <h2 className="section-title on-dark">
                        A showcase of <em>our work</em>
                    </h2>
                    <span className={s.headSubhead}>{visibleProperties.length > 0 ? `${visibleProperties.length}+ similar ADUs built across Southern California` : ""}</span>
                </div>
                <div className={s.headRight}>
                    <span className={s.plateCounter}>Plate {pad2(page + 1)} / {pad2(pageCount)}</span>
                    {pageCount > 1 && (
                        <button
                            className={s.pauseBtn}
                            onClick={() => setGalleryPaused(!galleryPaused)}
                            aria-label={galleryPaused ? "Resume gallery" : "Pause gallery"}
                        >
                            {galleryPaused ? "Resume ▶" : "Pause ⏸"}
                        </button>
                    )}
                </div>
            </div>

            {/* Adaptive grid — up to 3 per row, only fills as many cells as we have */}
            <div className={s.grid}>
                {cells.map((cell, i) => (
                    <div key={i} className={s.cell}>
                        <img src={cldOptimize(cell.url, 1800)} alt={cell.name} className={s.cellImg} loading="lazy" />
                        <span className={s.cellPlate}>№ {pad2(i + 1)}</span>
                        <div className={s.cellOverlay}>
                            <span className={s.cellName}>{cell.name}</span>
                            {cell.location && <span className={s.cellLocation}>{cell.location}</span>}
                        </div>
                    </div>
                ))}
            </div>

            {/* Footer */}
            <div className={s.footer}>
                <div className={s.dotsWrap}>
                    {pageCount > 1 && <span className={s.dotsLabel}>Pages</span>}
                    {pageCount > 1 && (
                        <div className={s.dots}>
                            {Array.from({ length: pageCount }).map((_, i) => (
                                <button
                                    key={i}
                                    className={`${s.dot} ${i === page ? s.dotActive : ""}`}
                                    onClick={() => setPage(i)}
                                    aria-label={`Page ${i + 1}`}
                                />
                            ))}
                        </div>
                    )}
                </div>
                <span className={s.realLabel}>Real homes we&apos;ve built.</span>
            </div>
        </div>
    );
}
