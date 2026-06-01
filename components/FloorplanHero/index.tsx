'use client'

import { useState } from 'react'
import { CldImage } from 'next-cloudinary'
import {
    Bed,
    Bath,
    Ruler,
    Sparkles,
    MapPin,
    Download,
    ZoomIn,
    Images,
} from 'lucide-react'

import Button from '@/components/Button'
import VideoPlayer from '@/components/VideoPlayer'
import GalleryModal from '@/components/GalleryModal'
import { USDollar } from '@/utils/currency'

import style from './FloorplanHero.module.css'

interface FloorplanHeroProps {
    floorplan: any
    citiesLabel?: string
    citiesCount?: number
    qualifier?: string | null
}

export default function FloorplanHero({
    floorplan,
    citiesLabel,
    citiesCount = 0,
    qualifier,
}: FloorplanHeroProps) {
    const [open, setOpen] = useState(false)
    const [index, setIndex] = useState(0)

    const { name, bed, bath, sqft, price, videoID } = floorplan
    const drawingUrl = floorplan.drawing?.secure_url
    const photos: { secure_url: string }[] = (floorplan.images || []).filter(
        (img: any) => img?.secure_url
    )

    // Lightbox = drawing first, then all photos
    const modalItems = [
        ...(drawingUrl
            ? [{ type: 'image' as const, url: drawingUrl, alt: `Floor plan — ${name}` }]
            : []),
        ...photos.map((p) => ({
            type: 'image' as const,
            url: p.secure_url,
            alt: `${name} build photo`,
        })),
    ]
    const drawingIndex = 0
    const photoStartIndex = drawingUrl ? 1 : 0

    function openAt(i: number) {
        setIndex(i)
        setOpen(true)
    }

    // Right-rail tiles: walkthrough video first, then photos (cap at 4)
    const MAX_TILES = 4
    const photoTiles = photos.map((p, i) => ({
        kind: 'photo' as const,
        url: p.secure_url,
        modalIndex: photoStartIndex + i,
    }))
    const allTiles = videoID
        ? [{ kind: 'video' as const }, ...photoTiles]
        : photoTiles
    const tiles = allTiles.slice(0, MAX_TILES)
    const extraCount = photos.length - tiles.filter((t) => t.kind === 'photo').length
    const hasTiles = tiles.length > 0

    // Two-tone title: last token in beige
    const parts = String(name || '').trim().split(' ')
    const lastToken = parts.length > 1 ? parts[parts.length - 1] : ''
    const headTitle = parts.length > 1 ? parts.slice(0, -1).join(' ') : name

    return (
        <section className={style.hero}>
            {/* ---------- MEDIA COLLAGE ---------- */}
            <div
                className={`${style.collage} ${hasTiles ? '' : style.collageSolo}`}
            >
                {drawingUrl && (
                    <button
                        type="button"
                        className={style.bigTile}
                        onClick={() => openAt(drawingIndex)}
                        aria-label="Zoom in on the floor plan"
                    >
                        <CldImage
                            src={drawingUrl}
                            width="900"
                            height="700"
                            alt={`3D floor plan of ${name}`}
                            className={style.drawing}
                            priority
                        />
                        <span className={style.customBadge}>
                            <Sparkles className={style.badgeIcon} aria-hidden="true" />
                            Fully customizable
                        </span>
                        <span className={style.zoomHint} aria-hidden="true">
                            <ZoomIn className={style.badgeIcon} />
                            Tap to zoom
                        </span>
                    </button>
                )}

                {hasTiles &&
                    tiles.map((tile, i) => {
                        if (tile.kind === 'video') {
                            return (
                                <div
                                    key="video"
                                    className={`${style.tile} ${style.videoTile}`}
                                >
                                    <div className={style.videoFrame}>
                                        <VideoPlayer wistiaID={videoID} />
                                    </div>
                                </div>
                            )
                        }
                        const isLast = i === tiles.length - 1
                        const showViewAll = isLast && extraCount > 1
                        return (
                            <button
                                key={tile.modalIndex}
                                type="button"
                                className={style.tile}
                                onClick={() => openAt(tile.modalIndex)}
                                aria-label={
                                    showViewAll
                                        ? 'View all photos'
                                        : 'View photo'
                                }
                            >
                                <CldImage
                                    src={tile.url}
                                    width="500"
                                    height="320"
                                    alt={`${name} build photo`}
                                    className={style.tilePhoto}
                                />
                                {showViewAll && (
                                    <span className={style.viewAll}>
                                        <Images
                                            className={style.badgeIcon}
                                            aria-hidden="true"
                                        />
                                        View all {photos.length}
                                    </span>
                                )}
                            </button>
                        )
                    })}
            </div>

            {/* ---------- TITLE BAND ---------- */}
            <div className={style.band}>
                {/* Identity */}
                <div className={style.headGroup}>
                    <span className={style.eyebrow}>
                        Designed, permitted &amp; built for you
                    </span>
                    <h1 className={style.title}>
                        {headTitle}
                        {lastToken && (
                            <>
                                {' '}
                                <span className={style.titleAccent}>
                                    {lastToken}
                                </span>
                            </>
                        )}
                    </h1>
                    {price !== null && price !== undefined && (
                        <div className={style.priceBlock}>
                            <span className={style.priceLabel}>
                                All-in price starts at
                            </span>
                            <span className={style.priceValue}>
                                {USDollar.format(price)}
                            </span>
                        </div>
                    )}
                    {/* Specs + proof */}
                    <div className={style.factsGroup}>
                        <ul className={style.pills}>
                            <li className={style.pill}>
                                <Bed className={style.pillIcon} aria-hidden="true" />
                                {bed === 0 ? 'Studio' : `${bed} Bed`}
                            </li>
                            <li className={style.pill}>
                                <Bath className={style.pillIcon} aria-hidden="true" />
                                {bath} Bath
                            </li>
                            <li className={style.pill}>
                                <Ruler className={style.pillIcon} aria-hidden="true" />
                                {sqft} sq ft
                            </li>
                        </ul>
                    </div>
                    <div className={style.ctaRow}>
                        <Button
                            href="/talk-to-an-adu-specialist/office-consultation"
                            theme="blue"
                        >
                            Schedule your office visit
                        </Button>
                        {floorplan.download?.secure_url && (
                            <a
                                className={style.ghostBtn}
                                href={floorplan.download.secure_url}
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                <Download
                                    className={style.badgeIcon}
                                    aria-hidden="true"
                                />
                                Download floor plan
                            </a>
                        )}

                    </div>
                    {floorplan.download?.secure_url && (
                        <p className={style.downloadNote}>
                            Includes room dimensions and the full layout
                        </p>
                    )}
                </div>
            </div>

            {open && modalItems.length > 0 && (
                <GalleryModal
                    items={modalItems}
                    index={index}
                    setIndex={setIndex}
                    onClose={() => setOpen(false)}
                />
            )}
        </section>
    )
}
