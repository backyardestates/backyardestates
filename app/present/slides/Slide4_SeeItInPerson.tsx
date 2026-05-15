"use client";

import React, { useEffect, useState } from "react";
import { usePresentationStore } from "@/lib/store/presentationStore";
import { RunningHeader } from "./_shared/RunningHeader";
import { RunningFooter } from "./_shared/RunningFooter";
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
            <RunningHeader slideNumber={4} topic="See it in person" theme="dark" />

            <div className={s.titleRow}>
                <h2 className={s.titleText}>See it <em>in person</em></h2>
                <div className={s.titleRight}>
                    {totalPages > 1 && (
                        <span className={s.plateCounter}>
                            Plate {String(page + 1).padStart(2, "0")} / {String(totalPages).padStart(2, "0")}
                        </span>
                    )}
                    <button className={s.pauseBtn} onClick={() => setGalleryPaused(!galleryPaused)}>
                        {galleryPaused ? "▶ Resume" : "⏸ Pause"}
                    </button>
                </div>
            </div>

            <div className={s.content}>
                <div className={s.realhomesLabel}>Real homes we&rsquo;ve built</div>

                {allImages.length > 0 ? (
                    <div
                        className={s.grid}
                        style={{ gridTemplateColumns: `repeat(${COLS}, 1fr)`, gridTemplateRows: `repeat(${ROWS}, 1fr)` }}
                    >
                        {visible.map((img, i) => (
                            <div key={i} className={s.cell}>
                                <img src={img.url} alt={img.name} className={s.cellImg} />
                                <span className={s.cellPlate}>№ {String(page * PER_PAGE + i + 1).padStart(2, "0")}</span>
                                <div className={s.cellCaption}>{img.name}</div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className={s.placeholder}>
                        <span style={{ fontSize: 40, opacity: 0.10 }}>🏡</span>
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
                                    background: i === page ? "var(--p-gold)" : "rgba(255,255,255,0.22)",
                                    transform: i === page ? "scale(1.4)" : "scale(1)",
                                }}
                            />
                        ))}
                    </div>
                )}
            </div>

            <RunningFooter theme="dark" />
        </div>
    );
}
