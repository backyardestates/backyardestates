"use client";

import React, { useEffect, useState } from "react";
import { usePresentationStore } from "@/lib/store/presentationStore";
import s from "./Slide4.module.css";

export function Slide4_SeeItInPerson() {
    const { completedProperties, galleryPaused, setGalleryPaused } = usePresentationStore();
    const [page, setPage] = useState(0);

    const COLS = 3;
    const ROWS = 2;
    const PER_PAGE = COLS * ROWS;

    const allImages: { url: string; name: string }[] = [];
    for (const prop of completedProperties) {
        const imgs = prop.images ?? (prop.thumbnailUrl ? [prop.thumbnailUrl] : []);
        for (const url of imgs) {
            if (url) allImages.push({ url, name: prop.name });
        }
    }

    const totalPages = Math.max(1, Math.ceil(allImages.length / PER_PAGE));

    useEffect(() => {
        if (galleryPaused || allImages.length <= PER_PAGE) return;
        const id = setInterval(() => setPage((p) => (p + 1) % totalPages), 6000);
        return () => clearInterval(id);
    }, [galleryPaused, allImages.length, totalPages, PER_PAGE]);

    const visible = allImages.slice(page * PER_PAGE, page * PER_PAGE + PER_PAGE);

    return (
        <div className={s.slide}>
            <div className="slide-header slide-header-dark">
                <span className="slide-header-title">Real Backyard Estates ADUs</span>
                <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                    {allImages.length > PER_PAGE && (
                        <span className="slide-header-pill">{page + 1} / {totalPages} pages</span>
                    )}
                    <button className={s.pauseBtn} onClick={() => setGalleryPaused(!galleryPaused)}>
                        {galleryPaused ? "▶ Resume" : "⏸ Pause"}
                    </button>
                </div>
            </div>

            <div className={s.content}>
                <div className={s.eyebrow}>Real Homes We&rsquo;ve Built</div>

                {allImages.length > 0 ? (
                    <div className={s.grid} style={{ gridTemplateColumns: `repeat(${COLS}, 1fr)`, gridTemplateRows: `repeat(${ROWS}, 1fr)` }}>
                        {visible.map((img, i) => (
                            <div key={i} className={s.cell}>
                                <img src={img.url} alt={img.name} className={s.cellImg} />
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className={s.placeholder}>
                        <span style={{ fontSize: 48, opacity: 0.2 }}>🏡</span>
                        <span className={s.placeholderText}>Completed properties loading…</span>
                    </div>
                )}

                {totalPages > 1 && (
                    <div className={s.dots}>
                        {Array.from({ length: totalPages }, (_, i) => (
                            <button
                                key={i}
                                onClick={() => setPage(i)}
                                className={s.dot}
                                style={{
                                    background: i === page ? "var(--p-gold)" : "rgba(255,255,255,0.25)",
                                    transform: i === page ? "scale(1.4)" : "scale(1)",
                                }}
                            />
                        ))}
                    </div>
                )}
            </div>
            <div className={s.wbfy}>We build for you.</div>
        </div>
    );
}
