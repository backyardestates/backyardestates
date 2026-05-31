"use client";

import React, { useEffect, useMemo, useState } from "react";
import { V2_SLIDES, V2_FLOW_COUNT } from "@/app/present-v2/slides/registry";
import { slidePreviewFontVars } from "@/app/present-v2/slides/previewFrame";
import { usePresentationStore } from "@/lib/store/presentationStore";
import s from "./SlideOrderPanel.module.css";

// Names + components come from the shared slide registry (single source of
// truth) so the panel never drifts from the real deck.
const SLIDE_TITLE: Record<number, string> = Object.fromEntries(V2_SLIDES.map((sl) => [sl.n, sl.name]));
const SLIDE_COMPONENT: Record<number, React.ComponentType> = Object.fromEntries(
    V2_SLIDES.map((sl) => [sl.n, sl.Component]),
);
const SLIDE_COUNT = V2_FLOW_COUNT;

const CANVAS_W = 1920;
const CANVAS_H = 1080;
const THUMB_W = 132; // inline thumbnail width (px)
const ENLARGE_W = 520; // hover-enlarge width (px)
const PREVIEWS_LS_KEY = "be_slideOrderPreviews";

interface Props {
    /** Custom slide order. Empty array = use natural 1..N order. */
    value: number[];
    onChange: (next: number[]) => void;
}

function defaultOrder(): number[] {
    return Array.from({ length: SLIDE_COUNT }, (_, i) => i + 1);
}

function arraysEqual(a: number[], b: number[]): boolean {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
    return true;
}

// Render a real slide component scaled down into a clipped 16:9 thumbnail.
// Reuses the print-view technique (native 1920×1080 + CSS transform scale).
function SlidePreview({ slideNum, width }: { slideNum: number; width: number }) {
    const Comp = SLIDE_COMPONENT[slideNum];
    if (!Comp) return null;
    const height = (width * CANVAS_H) / CANVAS_W;
    const scale = width / CANVAS_W;
    return (
        <div className={s.thumb} style={{ width, height }}>
            <div className={`${s.thumbStage} ${slidePreviewFontVars}`} style={{ transform: `scale(${scale})` }}>
                <Comp />
            </div>
        </div>
    );
}

// A slide that throws while rendering out of its normal context must never take
// down the whole panel — fall back to a labelled placeholder.
class PreviewBoundary extends React.Component<
    { children: React.ReactNode; fallback: React.ReactNode },
    { hasError: boolean }
> {
    constructor(props: { children: React.ReactNode; fallback: React.ReactNode }) {
        super(props);
        this.state = { hasError: false };
    }
    static getDerivedStateFromError() {
        return { hasError: true };
    }
    render() {
        return this.state.hasError ? this.props.fallback : this.props.children;
    }
}

export function SlideOrderPanel({ value, onChange }: Props) {
    // Internal working order — fall back to the natural order when empty.
    const order = useMemo(() => {
        if (!Array.isArray(value) || value.length === 0) return defaultOrder();
        return value;
    }, [value]);

    const isCustom = !arraysEqual(order, defaultOrder());

    const [dragIndex, setDragIndex] = useState<number | null>(null);
    const [dropIndex, setDropIndex] = useState<number | null>(null);
    const [dropPosition, setDropPosition] = useState<"above" | "below" | null>(null);

    // "Show previews" toggle — persisted as a personal UI preference.
    const [showPreviews, setShowPreviews] = useState<boolean>(() => {
        if (typeof window === "undefined") return false;
        return localStorage.getItem(PREVIEWS_LS_KEY) === "1";
    });
    useEffect(() => {
        try {
            localStorage.setItem(PREVIEWS_LS_KEY, showPreviews ? "1" : "0");
        } catch {
            /* quota / private browsing */
        }
    }, [showPreviews]);

    // While previews are visible, render slides in print mode so count-up
    // animations settle to their final values (otherwise non-active slides show
    // $0). Restore the prior flag on hide/unmount. isPrintMode is presenter-local
    // and not part of the broadcast, so this never affects an open presenter tab.
    useEffect(() => {
        if (!showPreviews) return;
        const prev = usePresentationStore.getState().isPrintMode;
        usePresentationStore.setState({ isPrintMode: true });
        return () => usePresentationStore.setState({ isPrintMode: prev });
    }, [showPreviews]);

    const [hovered, setHovered] = useState<number | null>(null);

    function commit(next: number[]) {
        // Persist natural order as [] so the presenter falls back cleanly.
        if (arraysEqual(next, defaultOrder())) onChange([]);
        else onChange(next);
    }

    function move(from: number, to: number) {
        if (from === to) return;
        const copy = order.slice();
        const [item] = copy.splice(from, 1);
        copy.splice(to, 0, item);
        commit(copy);
    }

    function moveBy(i: number, delta: -1 | 1) {
        const next = i + delta;
        if (next < 0 || next >= order.length) return;
        move(i, next);
    }

    function onDragStart(e: React.DragEvent<HTMLDivElement>, i: number) {
        setDragIndex(i);
        e.dataTransfer.effectAllowed = "move";
        // Some browsers require data to be set to allow drag.
        try {
            e.dataTransfer.setData("text/plain", String(i));
        } catch {
            /* ignore */
        }
    }

    function onDragOver(e: React.DragEvent<HTMLDivElement>, i: number) {
        if (dragIndex == null || dragIndex === i) return;
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
        const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
        const midpoint = rect.top + rect.height / 2;
        setDropIndex(i);
        setDropPosition(e.clientY < midpoint ? "above" : "below");
    }

    function onDrop(e: React.DragEvent<HTMLDivElement>) {
        e.preventDefault();
        if (dragIndex == null || dropIndex == null) {
            resetDragState();
            return;
        }
        let target = dropIndex + (dropPosition === "below" ? 1 : 0);
        // When dragging down, the source removal shifts indices left by 1.
        if (dragIndex < target) target -= 1;
        move(dragIndex, target);
        resetDragState();
    }

    function onDragEnd() {
        resetDragState();
    }

    function resetDragState() {
        setDragIndex(null);
        setDropIndex(null);
        setDropPosition(null);
    }

    function handleReset() {
        commit(defaultOrder());
    }

    return (
        <div className={s.panel}>
            <div className={s.header}>
                <span className={s.headerLabel}>
                    Drag to reorder · arrow keys also work
                    {isCustom && <span className={s.customBadge}>Custom order</span>}
                </span>
                <div className={s.headerActions}>
                    <button
                        type="button"
                        className={`${s.switch} ${showPreviews ? s.switchOn : ""}`}
                        role="switch"
                        aria-checked={showPreviews}
                        aria-label="Show slide previews"
                        onClick={() => setShowPreviews((v) => !v)}
                    >
                        <span className={s.switchKnob} />
                    </button>
                    <span className={s.switchText} onClick={() => setShowPreviews((v) => !v)}>
                        Previews
                    </span>
                    <button
                        type="button"
                        className={s.resetBtn}
                        onClick={handleReset}
                        disabled={!isCustom}
                    >
                        Reset to default
                    </button>
                </div>
            </div>

            <div className={s.list} onDrop={onDrop}>
                {order.map((slideNum, i) => {
                    const isDragging = dragIndex === i;
                    const isDropTarget = dropIndex === i && dragIndex !== i;
                    const rowClass = [
                        s.row,
                        showPreviews ? s.rowPreview : "",
                        isDragging ? s.rowDragging : "",
                        isDropTarget && dropPosition === "above" ? s.rowDropTargetAbove : "",
                        isDropTarget && dropPosition === "below" ? s.rowDropTargetBelow : "",
                    ]
                        .filter(Boolean)
                        .join(" ");

                    return (
                        <div
                            key={slideNum}
                            className={rowClass}
                            draggable
                            onDragStart={(e) => onDragStart(e, i)}
                            onDragOver={(e) => onDragOver(e, i)}
                            onDragEnd={onDragEnd}
                            onDrop={onDrop}
                        >
                            <span className={s.handle} aria-hidden>⋮⋮</span>
                            <span className={s.position}>{String(i + 1).padStart(2, "0")}</span>
                            {showPreviews && (
                                <div
                                    className={s.thumbWrap}
                                    onMouseEnter={() => setHovered(slideNum)}
                                    onMouseLeave={() => setHovered((h) => (h === slideNum ? null : h))}
                                >
                                    <PreviewBoundary
                                        fallback={<div className={s.thumbFallback} style={{ width: THUMB_W }}>{SLIDE_TITLE[slideNum]}</div>}
                                    >
                                        <SlidePreview slideNum={slideNum} width={THUMB_W} />
                                    </PreviewBoundary>
                                    {hovered === slideNum && (
                                        <div className={s.enlarge}>
                                            <PreviewBoundary
                                                fallback={<div className={s.thumbFallback} style={{ width: ENLARGE_W }}>{SLIDE_TITLE[slideNum]}</div>}
                                            >
                                                <SlidePreview slideNum={slideNum} width={ENLARGE_W} />
                                            </PreviewBoundary>
                                        </div>
                                    )}
                                </div>
                            )}
                            <div className={s.titles}>
                                <span className={s.title}>{SLIDE_TITLE[slideNum] ?? `Slide ${slideNum}`}</span>
                                <span className={s.sub}>Original slide № {String(slideNum).padStart(2, "0")}</span>
                            </div>
                            <div className={s.arrowGroup}>
                                <button
                                    type="button"
                                    className={s.arrowBtn}
                                    onClick={() => moveBy(i, -1)}
                                    disabled={i === 0}
                                    aria-label="Move up"
                                    title="Move up"
                                >
                                    ↑
                                </button>
                                <button
                                    type="button"
                                    className={s.arrowBtn}
                                    onClick={() => moveBy(i, 1)}
                                    disabled={i === order.length - 1}
                                    aria-label="Move down"
                                    title="Move down"
                                >
                                    ↓
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className={s.toolbar}>
                <span className={s.toolbarHint}>
                    Arrow keys → / ← in the presenter walk this order.
                    {showPreviews && " Hover a thumbnail to enlarge."}
                </span>
            </div>
        </div>
    );
}
