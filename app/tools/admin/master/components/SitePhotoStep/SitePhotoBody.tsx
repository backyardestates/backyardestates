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
    const [uploading, setUploading] = useState(false);

    // Downscale client-side, then upload to Cloudinary and store the URL.
    // Storing a URL (instead of embedding the base64 data URL in the snapshot)
    // keeps every autosave POST small — oversized snapshots used to 413 and
    // the photo silently never persisted. If the upload fails (offline / env
    // not configured), fall back to the legacy data-URL behavior so the rep
    // never loses the photo locally.
    function readFile(file: File) {
        if (!file.type.startsWith("image/")) return;
        setUploading(true);
        void (async () => {
            const dataUrl = await fileToDownscaledDataUrl(file);
            try {
                const blob = await (await fetch(dataUrl)).blob();
                const form = new FormData();
                form.append("file", blob, file.name || "site-photo.jpg");
                const res = await fetch("/api/admin/site-photo", { method: "POST", body: form });
                const data = (await res.json().catch(() => ({}))) as { url?: string; error?: string };
                if (res.ok && data.url) {
                    setPropertyPhotoUrl(data.url);
                    return;
                }
                console.warn("[site-photo] upload failed, falling back to inline image", data.error);
                setPropertyPhotoUrl(dataUrl);
            } catch (err) {
                console.warn("[site-photo] upload failed, falling back to inline image", err);
                setPropertyPhotoUrl(dataUrl);
            } finally {
                setUploading(false);
            }
        })();
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
                            {uploading ? "Uploading replacement…" : "Site photo · shown on slide 2"}
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
                    disabled={uploading}
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
                    <span className={s.dropTitle}>
                        {uploading ? "Uploading photo…" : "Drop a site photo here, or click to upload"}
                    </span>
                    <span className={s.dropHint}>
                        Aerial or street view of the property — appears on slide 2 of the presentation
                    </span>
                </button>
            )}
        </div>
    );
}
