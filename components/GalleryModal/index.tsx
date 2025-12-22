"use client";

import { useEffect } from "react";
import Image from "next/image";
import styles from "./GalleryModal.module.css";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { WistiaPlayer } from "@wistia/wistia-player-react";

interface GalleryItem {
    type: "image" | "video";
    url?: string;
    alt?: string;
    wistiaId?: string;
    thumbnail?: string;
}

interface GalleryModalProps {
    items: GalleryItem[];
    index: number;
    setIndex: (i: number) => void;
    onClose: () => void;
}

export default function GalleryModal({
    items = [],
    index = 0,
    onClose,
    setIndex,
}: GalleryModalProps) {
    const total = items.length;

    // ---- Keyboard navigation ----
    useEffect(() => {
        function handleKey(e: KeyboardEvent) {
            if (e.key === "Escape") onClose();
            if (e.key === "ArrowRight") setIndex((index + 1) % total);
            if (e.key === "ArrowLeft") setIndex((index - 1 + total) % total);
        }

        window.addEventListener("keydown", handleKey);
        return () => window.removeEventListener("keydown", handleKey);
    }, [index, total, onClose, setIndex]);

    const next = () => setIndex((index + 1) % total);
    const prev = () => setIndex((index - 1 + total) % total);

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                {/* Close Button */}
                <button className={styles.closeButton} onClick={onClose}>
                    <X size={28} />
                </button>

                {/* Prev / Next */}
                {total > 1 && (
                    <>
                        <button className={styles.prevButton} onClick={prev}>
                            <ChevronLeft size={40} />
                        </button>
                        <button className={styles.nextButton} onClick={next}>
                            <ChevronRight size={40} />
                        </button>
                    </>
                )}

                <div className={styles.imageWrapper}>
                    {items[index].type === "image" ? (
                        <Image
                            src={items[index].url || "/placeholder.svg"}
                            alt={items[index].alt || ""}
                            fill
                            className={styles.modalImage}
                            sizes="80vw"
                        />
                    ) : (
                        <WistiaPlayer
                            mediaId={items[index].wistiaId || ""}
                            id={`gallery-video-${items[index].wistiaId}`}
                            playerColor="#1da4ba"
                            aspect={16 / 9}
                        />
                    )}
                </div>

                <div className={styles.thumbnailRow}>

                    {items.map((item, i) => (
                        <button
                            key={i}
                            className={`${styles.thumb} ${i === index ? styles.activeThumb : ""}`}
                            onClick={() => setIndex(i)}
                        >
                            {item.type === "image" ? (
                                <Image
                                    src={item.url || "/placeholder.svg"}
                                    alt={item.alt || ""}
                                    width={120}
                                    height={80}
                                    className={styles.thumbImage}
                                />
                            ) : (
                                <div style={{ position: "relative" }}>
                                    <Image
                                        src={item.thumbnail || "/placeholder.svg"}
                                        alt="Video thumbnail"
                                        width={120}
                                        height={80}
                                        className={styles.thumbImage}
                                    />
                                    <div
                                        style={{
                                            position: "absolute",
                                            inset: 0,
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            background: "rgba(0,0,0,0.25)"
                                        }}
                                    >
                                        <svg width="30" height="30" viewBox="0 0 100 100">
                                            <circle cx="50" cy="50" r="45" fill="rgba(255,255,255,0.7)" />
                                            <polygon points="40,30 75,50 40,70" fill="#1da4ba" />
                                        </svg>
                                    </div>
                                </div>
                            )}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}
