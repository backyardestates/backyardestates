"use client";

import { useState } from "react";
import styles from "./PropertyMediaSection.module.css";
import { Images, Bed, Bath, Ruler, Home } from "lucide-react";
import Image from "next/image";
import { WistiaPlayer } from "@wistia/wistia-player-react";
import GalleryModal from "../GalleryModal";
import { SanityDocument } from "next-sanity";

//
// ──────────────────────────────────────────────
// TYPES
// ──────────────────────────────────────────────
//
type GalleryItem =
    | { type: "video"; wistiaId: string; thumbnail?: string }
    | { type: "image"; url: string; alt?: string };

interface PropertyMediaSectionProps {
    property: SanityDocument;   // loosen the type
}


export default function PropertyMediaSection({ property }: PropertyMediaSectionProps) {
    const { walkthroughVideo, testimonial, photos = [] } = property;

    const [showGalleryModal, setShowGalleryModal] = useState(false);
    const [galleryIndex, setGalleryIndex] = useState(0);

    //
    // ──────────────────────────────────────────────
    // 1. BUILD GALLERY ITEMS (WHAT THE MODAL USES)
    // ──────────────────────────────────────────────
    //
    const galleryItems: GalleryItem[] = [];

    // Testimonial video always index 0 if exists
    if (testimonial?.wistiaId) {
        galleryItems.push({
            type: "video",
            wistiaId: testimonial.wistiaId,
            thumbnail: testimonial.portrait?.url,
        });
    }

    // Then add images
    photos.forEach((p) =>
        galleryItems.push({
            type: "image",
            url: p.url,
            alt: p.alt,
        })
    );

    //
    // ──────────────────────────────────────────────
    // 2. SLOT ASSIGNMENT LOGIC (WHAT SHOWS IN GRID)
    // ──────────────────────────────────────────────
    //
    let walkthroughSlot: GalleryItem | null = null;
    let testimonialSlot: GalleryItem | null = null;

    const photoQueue = [...photos]; // non-destructive clone

    // CASE 1: Walkthrough exists
    if (walkthroughVideo) {
        walkthroughSlot = { type: "video", wistiaId: walkthroughVideo };

        if (testimonial?.wistiaId) {
            testimonialSlot = {
                type: "video",
                wistiaId: testimonial.wistiaId,
                thumbnail: testimonial.portrait?.url,
            };
        } else if (photoQueue.length > 0) {
            const img = photoQueue.shift()!;
            testimonialSlot = { type: "image", url: img.url, alt: img.alt };
        }
    }
    // CASE 2: No walkthrough, but testimonial exists
    else if (testimonial?.wistiaId) {
        walkthroughSlot = {
            type: "video",
            wistiaId: testimonial.wistiaId,
            thumbnail: testimonial.portrait?.url,
        };

        if (photoQueue.length > 0) {
            const img = photoQueue.shift()!;
            testimonialSlot = { type: "image", url: img.url, alt: img.alt };
        }
    }
    // CASE 3: Neither exists
    else {
        const img1 = photoQueue.shift();
        const img2 = photoQueue.shift();

        walkthroughSlot = img1 ? { type: "image", url: img1.url, alt: img1.alt } : null;
        testimonialSlot = img2 ? { type: "image", url: img2.url, alt: img2.alt } : null;
    }

    //
    // ──────────────────────────────────────────────
    // 3. DISPLAY ORDER (EXACT ORDER OF GRID TILES)
    // ──────────────────────────────────────────────
    //
    const displayOrder: number[] = [];

    function pushSlot(slot: GalleryItem | null) {
        if (!slot) return;

        const index = galleryItems.findIndex((item) => {
            if (slot.type === "video" && item.type === "video") {
                return item.wistiaId === slot.wistiaId;
            }
            if (slot.type === "image" && item.type === "image") {
                return item.url === slot.url;
            }
            return false;
        });

        displayOrder.push(index);
    }

    // Fill display order in grid order
    pushSlot(walkthroughSlot);
    pushSlot(testimonialSlot);
    photoQueue.forEach((img) => {
        const index = galleryItems.findIndex((item) => item.type === "image" && item.url === img.url);
        displayOrder.push(index);
    });

    //
    // ──────────────────────────────────────────────
    // RENDER COMPONENT
    // ──────────────────────────────────────────────
    //
    return (
        <>
            <section className={styles.section}>
                <div className={styles.gridContainer}>
                    {/** ───────────────────────────────
           *  WALKTHROUGH SLOT
           *  ─────────────────────────────── */}
                    <div className={styles.walkthrough}>
                        {walkthroughSlot?.type === "video" && (
                            <WistiaPlayer
                                id={`walk-${walkthroughSlot.wistiaId}`}
                                mediaId={walkthroughSlot.wistiaId}
                                aspect={16 / 9}
                                className={styles.player}
                            />
                        )}

                        {walkthroughSlot?.type === "image" && (
                            <Image
                                src={walkthroughSlot.url}
                                alt={walkthroughSlot.alt || "Walkthrough image"}
                                className={styles.galleryImage}
                                width={640}
                                height={360}
                                onClick={() => {
                                    setGalleryIndex(displayOrder[0]);
                                    setShowGalleryModal(true);
                                }}
                            />
                        )}
                    </div>

                    {/** ───────────────────────────────
           *  PROPERTY HEADER
           *  ─────────────────────────────── */}
                    <div className={styles.propertyHeader}>
                        <div className={styles.titleBlock}>
                            <div className={styles.locationWrapper}>
                                <p className={styles.cityState}>{property.slug}</p>
                            </div>
                            <h1 className={styles.aduTitle}>ADU</h1>
                        </div>

                        <div className={styles.features}>
                            <div className={styles.featureItem}>
                                <Bed className={styles.featureIcon} />
                                <span>{property?.bed} Bed</span>
                            </div>
                            <div className={styles.featureItem}>
                                <Bath className={styles.featureIcon} />
                                <span>{property?.bath} Bath</span>
                            </div>
                            <div className={styles.featureItem}>
                                <Ruler className={styles.featureIcon} />
                                <span>{property?.sqft} sqft</span>
                            </div>
                            <div className={styles.featureItem}>
                                <Home className={styles.featureIcon} />
                                <span>{property?.aduType}</span>
                            </div>
                        </div>
                    </div>

                    {/** ───────────────────────────────
           *  TESTIMONIAL SLOT
           *  ─────────────────────────────── */}
                    <div className={styles.testimonial}>
                        {testimonialSlot?.type === "video" && (
                            <div
                                className={styles.testimonialThumbnail}
                                onClick={() => {
                                    setGalleryIndex(displayOrder[1]);
                                    setShowGalleryModal(true);
                                }}
                                style={{ position: "relative", cursor: "pointer" }}
                            >
                                <Image
                                    src={testimonial?.portrait?.url || "/placeholder.svg"}
                                    alt="Testimonial video"
                                    className={styles.galleryImage}
                                    width={640}
                                    height={360}
                                />

                                {/* PLAY BUTTON */}
                                {/* Play button overlay */}
                                <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", }} >
                                    <div style={{ padding: "8px 22px", borderRadius: "5px", background: "rgba(29,164,186,0.85)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 6px 16px rgba(0,0,0,0.35)", }} >
                                        <svg width="46" height="46" viewBox="0 0 100 100">
                                            <polygon points="35,25 75,50 35,75" fill="#f9f9f9ff" />
                                        </svg>
                                    </div>
                                </div>
                            </div>
                        )}

                        {testimonialSlot?.type === "image" && (
                            <Image
                                src={testimonialSlot.url}
                                alt={testimonialSlot.alt || "Testimonial image"}
                                className={styles.galleryImage}
                                width={640}
                                height={360}
                                onClick={() => {
                                    setGalleryIndex(displayOrder[1]);
                                    setShowGalleryModal(true);
                                }}
                            />
                        )}
                    </div>

                    {/** ───────────────────────────────
           *  REMAINING PHOTOS (FIRST TWO)
           *  ─────────────────────────────── */}
                    {photoQueue.slice(0, 2).map((photo, i) => (
                        <div key={i} className={styles.imageItem}>
                            <Image
                                src={photo.url}
                                alt={photo.alt || "Gallery image"}
                                className={styles.galleryImage}
                                width={640}
                                height={360}
                                onClick={() => {
                                    setGalleryIndex(displayOrder[i + 2]);
                                    setShowGalleryModal(true);
                                }}
                            />
                        </div>
                    ))}

                    {/** ───────────────────────────────
           *  VIEW ALL BUTTON
           *  ─────────────────────────────── */}
                    <div
                        className={styles.viewAll}
                        onClick={() => {
                            setGalleryIndex(0);
                            setShowGalleryModal(true);
                        }}
                    >
                        <Image
                            src={photos?.[4]?.url || "/placeholder.svg"}
                            alt="View gallery"
                            className={styles.mediaImage}
                            width={640}
                            height={360}
                        />
                        <div className={styles.viewAllOverlay}>
                            <Images className={styles.viewAllIcon} />
                            <span className={styles.viewAllText}>View All</span>
                        </div>
                    </div>
                </div>
            </section>

            {/* MODAL */}
            {showGalleryModal && (
                <GalleryModal
                    items={galleryItems}
                    index={galleryIndex}
                    setIndex={setGalleryIndex}
                    onClose={() => setShowGalleryModal(false)}
                />
            )}
        </>
    );
}
