// Dedicated "Site Photo" step body.
//
// The property/site photo drives Slide 2 ("Your Property") of the presenter
// deck (and the legacy present slides 1–3). It used to be a small dashed
// strip buried at the bottom of Step 1's Property section, where reps
// routinely missed it. Pulled out into its own step and made visual: a large
// drag-and-drop drop zone with a full-width preview.

"use client";

import React, { useRef, useState } from "react";
import s from "./SitePhotoBody.module.css";
import { fileToDownscaledDataUrl } from "@/lib/admin/imageDownscale";

interface Props {
    propertyPhotoUrl: string | null;
    setPropertyPhotoUrl: (url: string | null) => void;
    /** Property address — shown as the preview caption for context. */
    address?: string;
}

export function SitePhotoBody({ propertyPhotoUrl, setPropertyPhotoUrl, address }: Props) {
    const inputRef = useRef<HTMLInputElement>(null);
    const [dragOver, setDragOver] = useState(false);

    // Read a File as a downscaled base64 data URL (not blob:) so the
    // BroadcastChannel wire can ship it intact to the presenter tab / persisted
    // snapshot. Downscaling keeps the snapshot under the server body limit.
    function readFile(file: File) {
        if (!file.type.startsWith("image/")) return;
        void fileToDownscaledDataUrl(file).then(setPropertyPhotoUrl);
    }

    function handleInput(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (file) readFile(file);
        // Reset so re-selecting the same file still fires onChange.
        e.target.value = "";
    }

    function handleDrop(e: React.DragEvent) {
        e.preventDefault();
        setDragOver(false);
        const file = e.dataTransfer.files?.[0];
        if (file) readFile(file);
    }

    return (
        <div className={s.root}>
            <input
                ref={inputRef}
                type="file"
                accept="image/*"
                className={s.hiddenInput}
                onChange={handleInput}
            />

            {propertyPhotoUrl ? (
                <figure className={s.preview}>
                    <img src={propertyPhotoUrl} alt={address || "Property site"} className={s.previewImg} />
                    <figcaption className={s.previewCaption}>
                        <span className={s.previewMeta}>
                            <span className={s.previewDot} aria-hidden />
                            Site photo · shown on slide 2
                        </span>
                        <span className={s.previewActions}>
                            <button
                                type="button"
                                className={s.actionBtn}
                                onClick={() => inputRef.current?.click()}
                            >
                                Replace
                            </button>
                            <button
                                type="button"
                                className={s.actionBtnDanger}
                                onClick={() => setPropertyPhotoUrl(null)}
                            >
                                Remove
                            </button>
                        </span>
                    </figcaption>
                </figure>
            ) : (
                <button
                    type="button"
                    className={`${s.dropzone} ${dragOver ? s.dropzoneActive : ""}`}
                    onClick={() => inputRef.current?.click()}
                    onDragOver={(e) => {
                        e.preventDefault();
                        setDragOver(true);
                    }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={handleDrop}
                >
                    <span className={s.dropIcon} aria-hidden>
                        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="3" y="3" width="18" height="18" rx="2" />
                            <circle cx="8.5" cy="8.5" r="1.5" />
                            <path d="m21 15-5-5L5 21" />
                        </svg>
                    </span>
                    <span className={s.dropTitle}>Drop a site photo here, or click to upload</span>
                    <span className={s.dropHint}>
                        Aerial or street view of the property — appears on slide 2 of the presentation
                    </span>
                </button>
            )}
        </div>
    );
}
